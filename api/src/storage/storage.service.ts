// api/src/storage/storage.service.ts
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '../integrations/config.service';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { AssetDocument } from '../models/asset.model';

export interface UploadOptions {
  key?: string;
  contentType?: string;
  tenantId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  uploadedBy?: string;
}

export interface AssetMetadata {
  url: string;
  filename: string;
  type: 'image' | 'video' | 'text' | 'other';
  tags: string[];
  metadata: Record<string, any>;
  uploadedBy: string;
  uploadedAt: Date;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client | null = null;
  private bucket: string = '';
  private publicBaseUrl: string = '';

  constructor(
    private readonly configService: ConfigService,
    @InjectModel('Asset') private readonly assetModel: Model<AssetDocument>,
  ) {
    this.logger.log('StorageService initialized');
  }

  async init(tenantId?: string) {
    const config = await this.configService.getConfig('r2', tenantId);
    if (!config?.bucketName || !config?.endpoint) {
      this.logger.error('[init] Missing R2 config values', { bucketName: config?.bucketName, endpoint: config?.endpoint });
      throw new InternalServerErrorException('R2 storage configuration is incomplete (bucket/endpoint).');
    }
    this.logger.log('[init] R2 config loaded', {
      endpoint: config.endpoint,
      bucketName: config.bucketName,
      publicBaseUrl: config.publicBaseUrl,
    });
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    this.bucket = config.bucketName;
    this.publicBaseUrl = config.publicBaseUrl;
    this.logger.log(`[init] S3 client ready for bucket ${this.bucket}`);
  }

  /**
   * Upload file to R2 and create asset record in database
   */
  async uploadFile(buffer: Buffer, key?: string, contentType?: string, tenantId?: string): Promise<string>;
  async uploadFile(buffer: Buffer, options: UploadOptions): Promise<string>;
  async uploadFile(buffer: Buffer, keyOrOptions?: string | UploadOptions, contentType?: string, tenantId?: string): Promise<string> {
    // Handle overloaded parameters
    const options: UploadOptions = typeof keyOrOptions === 'string' 
      ? { key: keyOrOptions, contentType, tenantId }
      : keyOrOptions || {};

    if (!this.s3) await this.init(options.tenantId);
    if (!this.bucket) {
      this.logger.error('[uploadFile] bucket not set');
      throw new InternalServerErrorException('R2 bucket not configured');
    }
    
    const fileKey = options.key || uuidv4();
    this.logger.log(`[uploadFile] Uploading key=${fileKey} bucket=${this.bucket}`);
    
    const putCmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      Body: buffer,
      ContentType: options.contentType,
      ACL: 'public-read',
    });
    
    try {
      await this.s3!.send(putCmd);
    } catch (err: any) {
      this.logger.error('[uploadFile] Upload failed', {
        errorMessage: err?.message,
        errorCode: err?.Code,
        httpStatus: err?.$metadata?.httpStatusCode,
        bucket: this.bucket,
      });
      throw err;
    }
    
    const canonicalUrl = this.publicBaseUrl ? `${this.publicBaseUrl}/${fileKey}` : `${this.bucket}/${fileKey}`;
    let viewUrl = canonicalUrl;

    // If publicBaseUrl is configured and ACL is public-read, use direct public URL
    // Otherwise, generate signed URL with 7-day expiration (max for R2/S3)
    if (!this.publicBaseUrl) {
      try {
        viewUrl = await this.generateSignedGetUrl(fileKey, 7 * 24 * 60 * 60); // 7 days
      } catch (err: any) {
        this.logger.warn('[uploadFile] Failed to generate signed URL, falling back to canonical', {
          errorMessage: err?.message,
        });
      }
    }

    this.logger.log(`[uploadFile] Upload successful canonical=${canonicalUrl}`);

    // Create asset record if tenantId and uploadedBy are provided
    if (options.tenantId && options.uploadedBy) {
      await this.createAssetRecord({
        tenantId: options.tenantId,
        url: canonicalUrl,
        filename: fileKey,
        type: this.inferAssetType(options.contentType),
        tags: options.tags || [],
        metadata: {
          ...options.metadata,
          contentType: options.contentType,
          size: buffer.length,
          viewUrl,
        },
        uploadedBy: options.uploadedBy,
        uploadedAt: new Date(),
      });
    }

    return viewUrl;
  }

  private async generateSignedGetUrl(key: string, expiresInSeconds = 604800): Promise<string> {
    if (!this.s3) throw new InternalServerErrorException('S3 client not initialized');
    // Max expiration is 7 days (604800 seconds) for R2/S3
    const maxExpiration = 7 * 24 * 60 * 60; // 7 days
    const expiration = Math.min(expiresInSeconds, maxExpiration);
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn: expiration });
  }

  /**
   * Generate a view URL (presigned when bucket is private) for an existing asset URL or key
   */
  async getViewUrlForExisting(urlOrKey: string, tenantId?: string, expiresInSeconds = 604800): Promise<string> {
    if (!urlOrKey) {
      throw new BadRequestException('urlOrKey is required');
    }

    if (!this.s3) await this.init(tenantId);
    
    // If publicBaseUrl is configured, return public URL directly
    if (this.publicBaseUrl && urlOrKey.includes(this.publicBaseUrl)) {
      return urlOrKey; // Already a public URL
    }
    
    const key = this.extractKey(urlOrKey);
    
    // If publicBaseUrl is configured, construct and return public URL
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl}/${key}`;
    }

    try {
      return await this.generateSignedGetUrl(key, expiresInSeconds);
    } catch (err: any) {
      this.logger.warn('[getViewUrlForExisting] Failed to sign URL, falling back to canonical', {
        errorMessage: err?.message,
        key,
      });
      return this.publicBaseUrl ? `${this.publicBaseUrl}/${key}` : urlOrKey;
    }
  }

  /**
   * Normalize a URL or key to an object key inside the configured bucket
   */
  private extractKey(urlOrKey: string): string {
    // If caller already provided a key, strip any leading slash
    if (!urlOrKey.startsWith('http')) {
      return urlOrKey.replace(/^\/+/, '');
    }

    try {
      const parsed = new URL(urlOrKey);
      const path = parsed.pathname.replace(/^\/+/, '');

      // Paths typically look like `${bucket}/key` on r2.cloudflarestorage.com
      if (this.bucket && path.startsWith(`${this.bucket}/`)) {
        return path.substring(this.bucket.length + 1);
      }

      return path;
    } catch (err: any) {
      this.logger.warn('[extractKey] Failed to parse URL, returning raw key', {
        errorMessage: err?.message,
      });
      return urlOrKey.replace(/^\/+/, '');
    }
  }

  /**
   * Create asset record in database
   */
  async createAssetRecord(assetData: Partial<AssetMetadata> & { tenantId: string }): Promise<AssetDocument> {
    const asset = new this.assetModel(assetData);
    await asset.save();
    this.logger.log(`[createAssetRecord] Asset created: ${asset._id}`);
    return asset;
  }

  /**
   * Get asset by URL
   */
  async getAssetByUrl(url: string, tenantId: string): Promise<AssetDocument | null> {
    return this.assetModel.findOne({ url, tenantId }).exec();
  }

  /**
   * Get all assets for a tenant
   */
  async getAssets(tenantId: string, filters?: { tags?: string[]; type?: string; archived?: boolean }): Promise<AssetDocument[]> {
    const query: any = { tenantId };
    
    if (filters?.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }
    
    if (filters?.type) {
      query.type = filters.type;
    }
    
    if (filters?.archived !== undefined) {
      query.archived = filters.archived;
    }
    
    return this.assetModel.find(query).sort({ uploadedAt: -1 }).exec();
  }

  /**
   * Tag an asset
   */
  async tagAsset(url: string, tenantId: string, tags: string[]): Promise<AssetDocument> {
    const asset = await this.assetModel.findOne({ url, tenantId }).exec();
    
    if (!asset) {
      throw new NotFoundException(`Asset not found: ${url}`);
    }
    
    // Merge new tags with existing ones (avoiding duplicates)
    asset.tags = [...new Set([...asset.tags, ...tags])];
    await asset.save();
    
    this.logger.log(`[tagAsset] Asset tagged: ${asset._id}, tags: ${asset.tags.join(', ')}`);
    return asset;
  }

  /**
   * Replace an asset (mark old as replaced, return new)
   */
  async replaceAsset(oldUrl: string, newUrl: string, tenantId: string): Promise<AssetDocument> {
    const oldAsset = await this.assetModel.findOne({ url: oldUrl, tenantId }).exec();
    
    if (!oldAsset) {
      throw new NotFoundException(`Old asset not found: ${oldUrl}`);
    }
    
    // Mark old asset as replaced
    oldAsset.replacedBy = newUrl;
    await oldAsset.save();
    
    // Find or create new asset record
    let newAsset = await this.assetModel.findOne({ url: newUrl, tenantId }).exec();
    
    if (!newAsset) {
      // If new asset doesn't exist, create it with old asset's metadata
      newAsset = new this.assetModel({
        tenantId: oldAsset.tenantId,
        url: newUrl,
        filename: newUrl.split('/').pop() || 'unknown',
        type: oldAsset.type,
        tags: oldAsset.tags,
        metadata: oldAsset.metadata,
        uploadedBy: oldAsset.uploadedBy,
        usedInCampaigns: oldAsset.usedInCampaigns,
        usedInContentVersions: oldAsset.usedInContentVersions,
      });
      await newAsset.save();
    }
    
    this.logger.log(`[replaceAsset] Asset replaced: ${oldUrl} -> ${newUrl}`);
    return newAsset;
  }

  /**
   * Link asset to campaign
   */
  async linkAssetToCampaign(url: string, tenantId: string, campaignId: string, contentVersion?: number): Promise<AssetDocument> {
    const asset = await this.assetModel.findOne({ url, tenantId }).exec();
    
    if (!asset) {
      throw new NotFoundException(`Asset not found: ${url}`);
    }
    
    // Add campaign to usedInCampaigns if not already there
    const campaignObjectId = new Types.ObjectId(campaignId);
    if (!asset.usedInCampaigns.some(id => id.equals(campaignObjectId))) {
      asset.usedInCampaigns.push(campaignObjectId);
    }
    
    // Add to content versions if specified
    if (contentVersion !== undefined) {
      const existingVersion = asset.usedInContentVersions.find(
        v => v.campaignId.equals(campaignObjectId) && v.version === contentVersion
      );
      
      if (!existingVersion) {
        asset.usedInContentVersions.push({
          campaignId: campaignObjectId,
          version: contentVersion,
        });
      }
    }
    
    await asset.save();
    this.logger.log(`[linkAssetToCampaign] Asset linked: ${asset._id} -> Campaign ${campaignId}`);
    return asset;
  }

  /**
   * Archive an asset (soft delete)
   */
  async archiveAsset(url: string, tenantId: string): Promise<AssetDocument> {
    const asset = await this.assetModel.findOne({ url, tenantId }).exec();
    
    if (!asset) {
      throw new NotFoundException(`Asset not found: ${url}`);
    }
    
    asset.archived = true;
    asset.archivedAt = new Date();
    await asset.save();
    
    this.logger.log(`[archiveAsset] Asset archived: ${asset._id}`);
    return asset;
  }

  /**
   * Get assets used in a specific campaign
   */
  async getAssetsForCampaign(campaignId: string, tenantId: string): Promise<AssetDocument[]> {
    const campaignObjectId = new Types.ObjectId(campaignId);
    return this.assetModel.find({
      tenantId,
      usedInCampaigns: campaignObjectId,
      archived: false,
    }).exec();
  }

  /**
   * Clean up unused assets (not linked to any campaign)
   */
  async cleanupUnusedAssets(tenantId: string, olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const unusedAssets = await this.assetModel.find({
      tenantId,
      usedInCampaigns: { $size: 0 },
      uploadedAt: { $lt: cutoffDate },
      archived: false,
    }).exec();
    
    let cleanedCount = 0;
    for (const asset of unusedAssets) {
      asset.archived = true;
      asset.archivedAt = new Date();
      await asset.save();
      cleanedCount++;
    }
    
    this.logger.log(`[cleanupUnusedAssets] Cleaned ${cleanedCount} unused assets for tenant ${tenantId}`);
    return cleanedCount;
  }

  /**
   * Search assets by tag and type
   */
  async searchAssets(tenantId: string, query: { tags?: string[]; type?: string; search?: string; archived?: boolean }): Promise<AssetDocument[]> {
    const filter: any = { tenantId };
    
    if (query.tags && query.tags.length > 0) {
      filter.tags = { $in: query.tags };
    }
    
    if (query.type) {
      filter.type = query.type;
    }
    
    if (query.archived !== undefined) {
      filter.archived = query.archived;
    }
    
    if (query.search) {
      filter.$or = [
        { filename: { $regex: query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(query.search, 'i')] } },
      ];
    }
    
    return this.assetModel.find(filter).sort({ uploadedAt: -1 }).exec();
  }

  /**
   * Get asset categories for organization
   */
  async getAssetCategories(tenantId: string): Promise<Record<string, number>> {
    const assets = await this.assetModel.find({ tenantId, archived: false }).exec();
    const categories: Record<string, number> = {};
    
    for (const asset of assets) {
      for (const tag of asset.tags) {
        categories[tag] = (categories[tag] || 0) + 1;
      }
    }
    
    return categories;
  }

  /**
   * Categorize and organize assets by tag
   */
  async categorizeAsset(assetId: string, categories: string[]): Promise<AssetDocument> {
    const asset = await this.assetModel.findById(assetId).exec();
    if (!asset) {
      throw new NotFoundException(`Asset not found: ${assetId}`);
    }
    
    asset.tags = [...new Set([...asset.tags, ...categories])];
    await asset.save();
    
    this.logger.log(`[categorizeAsset] Asset categorized: ${assetId}`, {
      categories,
    });
    
    return asset;
  }

  /**
   * Clone an asset record for reuse across campaigns
   */
  async cloneAsset(sourceUrl: string, sourceTenantId: string, targetTenantId: string, targetCampaignId?: string, version?: number): Promise<AssetDocument> {
    const sourceAsset = await this.assetModel.findOne({ url: sourceUrl, tenantId: sourceTenantId }).exec();
    if (!sourceAsset) {
      throw new NotFoundException(`Source asset not found: ${sourceUrl}`);
    }
    
    // Create new asset record (pointing to same URL)
    const newAsset = new this.assetModel({
      tenantId: new Types.ObjectId(targetTenantId),
      url: sourceUrl,
      filename: sourceAsset.filename,
      type: sourceAsset.type,
      tags: [...sourceAsset.tags, 'cloned'],
      metadata: {
        ...sourceAsset.metadata,
        clonedFrom: sourceUrl,
        clonedAt: new Date(),
      },
      uploadedBy: sourceAsset.uploadedBy,
    });
    
    if (targetCampaignId) {
      newAsset.usedInCampaigns.push(new Types.ObjectId(targetCampaignId));
      if (version !== undefined) {
        newAsset.usedInContentVersions.push({
          campaignId: new Types.ObjectId(targetCampaignId),
          version,
        });
      }
    }
    
    await newAsset.save();
    this.logger.log(`[cloneAsset] Asset cloned for reuse`, {
      sourceUrl,
      sourceTenantId,
      targetTenantId,
    });
    
    return newAsset;
  }

  /**
   * Get reuse statistics for an asset
   */
  async getAssetStats(url: string, tenantId: string): Promise<{ url: string; usageCount: number; campaigns: string[]; lastUsed?: Date }> {
    const asset = await this.assetModel.findOne({ url, tenantId }).exec();
    if (!asset) {
      throw new NotFoundException(`Asset not found: ${url}`);
    }
    
    return {
      url: asset.url,
      usageCount: asset.usedInCampaigns.length,
      campaigns: asset.usedInCampaigns.map(id => id.toString()),
      lastUsed: asset.usedInContentVersions[asset.usedInContentVersions.length - 1]
        ? new Date(asset.usedInContentVersions[asset.usedInContentVersions.length - 1].campaignId.toString())
        : undefined,
    };
  }

  /**
   * Infer asset type from content type
   */
  private inferAssetType(contentType?: string): 'image' | 'video' | 'text' | 'other' {
    if (!contentType) return 'other';
    
    if (contentType.startsWith('image/')) return 'image';
    if (contentType.startsWith('video/')) return 'video';
    if (contentType.startsWith('text/')) return 'text';
    
    return 'other';
  }
}

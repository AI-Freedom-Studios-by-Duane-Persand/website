import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CampaignDocument } from '../../models/campaign.schema';
import { 
  CreateAssetDto, 
  TagAssetDto, 
  ReplaceAssetDto, 
  LinkAssetToVersionDto,
  AssetType 
} from '../dto/asset.dto';

@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);

  constructor(
    @InjectModel('Campaign') private readonly campaignModel: Model<CampaignDocument>,
  ) {}

  /**
   * Add an asset reference to a campaign
   */
  async addAsset(campaignId: string, dto: CreateAssetDto, tenantId: string): Promise<CampaignDocument> {
    this.logger.log(`Adding asset to campaign ${campaignId}`);

    const campaign = await this.campaignModel.findOne({ 
      _id: campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    // Check if asset already exists
    const existingAsset = campaign.assetRefs.find((a: any) => a.url === dto.url);
    if (existingAsset) {
      this.logger.warn(`Asset ${dto.url} already exists in campaign`);
      return campaign;
    }

    const now = new Date();
    campaign.assetRefs.push({
      url: dto.url,
      type: dto.type,
      tags: dto.tags || [],
      uploadedAt: now,
      uploadedBy: dto.uploadedBy,
      usedInContentVersions: [],
      usedInStrategyVersions: [],
    });

    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: dto.uploadedBy,
      changes: { addedAsset: dto.url },
      note: 'Asset added',
    });

    await campaign.save();
    this.logger.log('Asset added successfully');
    return campaign;
  }

  /**
   * Tag an existing asset
   */
  async tagAsset(dto: TagAssetDto, tenantId: string): Promise<CampaignDocument> {
    this.logger.log(`Tagging asset ${dto.assetUrl} in campaign ${dto.campaignId}`);

    const campaign = await this.campaignModel.findOne({ 
      _id: dto.campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${dto.campaignId} not found`);
    }

    const asset = campaign.assetRefs.find((a: any) => a.url === dto.assetUrl);
    if (!asset) {
      throw new NotFoundException(`Asset ${dto.assetUrl} not found in campaign`);
    }

    // Merge tags (avoid duplicates)
    const existingTags = asset.tags || [];
    asset.tags = [...new Set([...existingTags, ...dto.tags])];

    const now = new Date();
    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: dto.userId,
      changes: { taggedAsset: { url: dto.assetUrl, tags: dto.tags } },
      note: 'Asset tagged',
    });

    await campaign.save();
    this.logger.log('Asset tagged successfully');
    return campaign;
  }

  /**
   * Replace an asset (updates references)
   */
  async replaceAsset(dto: ReplaceAssetDto, tenantId: string): Promise<CampaignDocument> {
    this.logger.log(`Replacing asset ${dto.oldAssetUrl} with ${dto.newAssetUrl}`);

    const campaign = await this.campaignModel.findOne({ 
      _id: dto.campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${dto.campaignId} not found`);
    }

    const oldAsset = campaign.assetRefs.find((a: any) => a.url === dto.oldAssetUrl);
    if (!oldAsset) {
      throw new NotFoundException(`Asset ${dto.oldAssetUrl} not found in campaign`);
    }

    // Mark old asset as replaced
    oldAsset.replacedBy = dto.newAssetUrl;

    // Add new asset with same metadata
    const now = new Date();
    campaign.assetRefs.push({
      url: dto.newAssetUrl,
      type: oldAsset.type,
      tags: oldAsset.tags,
      uploadedAt: now,
      uploadedBy: dto.userId,
      usedInContentVersions: oldAsset.usedInContentVersions,
      usedInStrategyVersions: oldAsset.usedInStrategyVersions,
    });

    // Update references in content versions
    campaign.contentVersions.forEach((content: any) => {
      if (content.textAssets) {
        content.textAssets = content.textAssets.map((url: string) => 
          url === dto.oldAssetUrl ? dto.newAssetUrl : url
        );
      }
      if (content.imageAssets) {
        content.imageAssets = content.imageAssets.map((url: string) => 
          url === dto.oldAssetUrl ? dto.newAssetUrl : url
        );
      }
      if (content.videoAssets) {
        content.videoAssets = content.videoAssets.map((url: string) => 
          url === dto.oldAssetUrl ? dto.newAssetUrl : url
        );
      }
    });

    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: dto.userId,
      changes: { replacedAsset: { old: dto.oldAssetUrl, new: dto.newAssetUrl } },
      note: dto.note || 'Asset replaced',
    });

    // Invalidate affected content versions
    campaign.approvalStates.content = 'needs_review';

    await campaign.save();
    this.logger.log('Asset replaced successfully');
    return campaign;
  }

  /**
   * Link asset to specific version
   */
  async linkAssetToVersion(dto: LinkAssetToVersionDto, tenantId: string): Promise<CampaignDocument> {
    this.logger.log(`Linking asset ${dto.assetUrl} to version`);

    const campaign = await this.campaignModel.findOne({ 
      _id: dto.campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${dto.campaignId} not found`);
    }

    const asset = campaign.assetRefs.find((a: any) => a.url === dto.assetUrl);
    if (!asset) {
      throw new NotFoundException(`Asset ${dto.assetUrl} not found in campaign`);
    }

    if (dto.contentVersion) {
      if (!asset.usedInContentVersions) asset.usedInContentVersions = [];
      if (!asset.usedInContentVersions.includes(dto.contentVersion)) {
        asset.usedInContentVersions.push(dto.contentVersion);
      }
    }

    if (dto.strategyVersion) {
      if (!asset.usedInStrategyVersions) asset.usedInStrategyVersions = [];
      if (!asset.usedInStrategyVersions.includes(dto.strategyVersion)) {
        asset.usedInStrategyVersions.push(dto.strategyVersion);
      }
    }

    const now = new Date();
    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: dto.userId,
      changes: { 
        linkedAsset: { 
          url: dto.assetUrl, 
          contentVersion: dto.contentVersion, 
          strategyVersion: dto.strategyVersion 
        } 
      },
      note: 'Asset linked to version',
    });

    await campaign.save();
    this.logger.log('Asset linked successfully');
    return campaign;
  }

  /**
   * Get all assets for a campaign
   */
  async getAssets(campaignId: string, tenantId: string): Promise<any[]> {
    const campaign = await this.campaignModel.findOne({ 
      _id: campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    return campaign.assetRefs || [];
  }

  /**
   * Get assets by tag
   */
  async getAssetsByTag(campaignId: string, tag: string, tenantId: string): Promise<any[]> {
    const assets = await this.getAssets(campaignId, tenantId);
    return assets.filter((a: any) => a.tags && a.tags.includes(tag));
  }

  /**
   * Get assets by type
   */
  async getAssetsByType(campaignId: string, type: AssetType, tenantId: string): Promise<any[]> {
    const assets = await this.getAssets(campaignId, tenantId);
    return assets.filter((a: any) => a.type === type);
  }

  /**
   * Get unused assets (not linked to any version)
   */
  async getUnusedAssets(campaignId: string, tenantId: string): Promise<any[]> {
    const assets = await this.getAssets(campaignId, tenantId);
    return assets.filter((a: any) => 
      (!a.usedInContentVersions || a.usedInContentVersions.length === 0) &&
      (!a.usedInStrategyVersions || a.usedInStrategyVersions.length === 0)
    );
  }

  /**
   * Remove unused assets
   */
  async cleanupUnusedAssets(campaignId: string, userId: string, tenantId: string): Promise<CampaignDocument> {
    this.logger.log(`Cleaning up unused assets for campaign ${campaignId}`);

    const campaign = await this.campaignModel.findOne({ 
      _id: campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    const unusedAssets = campaign.assetRefs.filter((a: any) => 
      (!a.usedInContentVersions || a.usedInContentVersions.length === 0) &&
      (!a.usedInStrategyVersions || a.usedInStrategyVersions.length === 0) &&
      !a.replacedBy
    );

    const removedCount = unusedAssets.length;
    campaign.assetRefs = campaign.assetRefs.filter((a: any) => 
      (a.usedInContentVersions && a.usedInContentVersions.length > 0) ||
      (a.usedInStrategyVersions && a.usedInStrategyVersions.length > 0) ||
      a.replacedBy
    );

    const now = new Date();
    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: userId,
      changes: { cleanedUnusedAssets: removedCount },
      note: `Removed ${removedCount} unused assets`,
    });

    await campaign.save();
    this.logger.log(`Cleaned up ${removedCount} unused assets`);
    return campaign;
  }
}

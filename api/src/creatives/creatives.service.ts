import { Injectable, NotFoundException, BadRequestException, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Creative } from '../../../shared/types';
import { CreateCreativeDto, UpdateCreativeDto } from './dtos/creative.dto';
import { CreativeDocument } from './schemas/creative.schema';
import { InjectModel as InjectTenantModel } from '@nestjs/mongoose';
import { TenantDocument } from '../tenants/schemas/tenant.schema';
import { AIModelsService } from '../engines/ai-models.service';
import { StorageService } from '../storage/storage.service';
import { CampaignDocument } from '../models/campaign.schema';
import { PoeClient } from '../engines/poe.client';
import { ReplicateClient } from '../engines/replicate.client';

export interface ModelsForContentTypeResult {
  recommendedModel: string;
  availableModels: {
    model: string;
    displayName: string;
    provider: string;
    recommended?: boolean;
    description?: string;
  }[];
}

export type CaptionModelsListingResponse = {
  contentType: 'caption-generation';
  providerHint: string;
} & ModelsForContentTypeResult;

export type GenerateTextCreativeResult = CaptionModelsListingResponse | Creative;

@Injectable()
export class CreativesService {
  constructor(
    @InjectModel('Creative') private readonly creativeModel: Model<CreativeDocument>,
    @InjectTenantModel('Tenant') private readonly tenantModel: Model<TenantDocument>,
    @InjectModel('Campaign') private readonly campaignModel: Model<CampaignDocument>,
    private readonly aiModelsService: AIModelsService,
    private readonly storageService: StorageService,
    private readonly poeClient: PoeClient,
    private readonly replicateClient: ReplicateClient,
  ) {}

  private readonly logger = new Logger(CreativesService.name);

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Detect known placeholder image/video hosts to avoid treating them as real assets.
   */
  private isPlaceholderUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      const placeholderHosts = [
        'via.placeholder.com',
        'placeholder.com',
        'placehold.it',
      ];
      return placeholderHosts.includes(host);
    } catch {
      return false;
    }
  }

  private toCreativeResponse(doc: CreativeDocument): Creative {
    const obj = doc.toObject();
    return {
      ...obj,
      campaignId: obj.campaignId ? obj.campaignId.toString() : null,
    };
  }

  /**
   * Batch helper: walk existing creatives and refresh their image URLs
   * using signed URLs from StorageService.refreshAssetUrl.
   * Intended for maintenance/migrations to fix older, non-signed URLs.
   */
  async refreshAllCreativeImageUrls(tenantId?: string): Promise<{ total: number; updated: number; errors: number }> {
    const baseQuery: any = {};
    if (tenantId) {
      baseQuery.tenantId = new Types.ObjectId(tenantId);
    }

    const batchSize = 100;
    let lastId: Types.ObjectId | null = null;
    let total = 0;
    let updated = 0;
    let errors = 0;

    // Process creatives in batches to avoid loading everything into memory
    // and to naturally throttle calls to StorageService.refreshAssetUrl.
    for (;;) {
      const query: any = { ...baseQuery };
      if (lastId) {
        query._id = { $gt: lastId };
      }

      const batch = await this.creativeModel
        .find(query)
        .sort({ _id: 1 })
        .limit(batchSize)
        .exec();

      if (!batch.length) {
        break;
      }

      total += batch.length;
      lastId = batch[batch.length - 1]._id as Types.ObjectId;

      for (const creative of batch) {
        const effectiveTenantId = tenantId || creative.tenantId?.toString();
        let changed = false;

        try {
          // Light throttling between creatives to avoid overloading storage backend
          await this.delay(10);

          // Refresh primary visual image URL
          if (creative.visual?.imageUrl) {
            const newUrl = await this.storageService.refreshAssetUrl(
              creative.visual.imageUrl,
              effectiveTenantId,
              false,
            );
            if (newUrl && newUrl !== creative.visual.imageUrl) {
              creative.visual.imageUrl = newUrl;
              creative.markModified('visual');
              changed = true;
            }
          }

          // Refresh assets.imageUrls array
          if (creative.assets?.imageUrls?.length) {
            const refreshed: string[] = [];
            for (const url of creative.assets.imageUrls) {
              if (!url) continue;
              try {
                const newUrl = await this.storageService.refreshAssetUrl(url, effectiveTenantId, false);
                refreshed.push(newUrl || url);
              } catch (innerErr: any) {
                this.logger.warn('[refreshAllCreativeImageUrls] Failed to refresh image URL for creative', {
                  creativeId: creative._id,
                  url,
                  error: innerErr?.message,
                });
                refreshed.push(url);
              }
            }

            const original = creative.assets.imageUrls.filter((u) => u != null);
            const changedArray =
              refreshed.length !== original.length ||
              refreshed.some((val, idx) => val !== original[idx]);

            if (changedArray) {
              creative.assets.imageUrls = refreshed;
              creative.markModified('assets');
              changed = true;
            }
          }

          if (changed) {
            creative.updatedAt = new Date();
            await creative.save();
            updated++;
          }
        } catch (err: any) {
          errors++;
          this.logger.warn('[refreshAllCreativeImageUrls] Failed to refresh creative URLs', {
            creativeId: creative._id,
            error: err?.message,
          });
        }
      }
    }

    this.logger.log('[refreshAllCreativeImageUrls] Finished refreshing creative image URLs', {
      total,
      updated,
      errors,
    });

    return { total, updated, errors };
  }

  /**
   * Refresh expired signed URLs for assets
   * Signed URLs expire after 7 days, so we regenerate them on retrieval
   */
  private async refreshAssetUrls(creative: CreativeDocument, tenantId?: string): Promise<void> {
    try {
      // Refresh visual imageUrl
      if (creative.visual?.imageUrl) {
        const refreshedUrl = await this.storageService.getViewUrlForExisting(
          creative.visual.imageUrl,
          tenantId || creative.tenantId?.toString(),
        );
        if (refreshedUrl && refreshedUrl !== creative.visual.imageUrl) {
          creative.visual.imageUrl = refreshedUrl;
          creative.markModified('visual');
        }
      }

      // Refresh asset imageUrls array
      if (creative.assets?.imageUrls?.length) {
        const refreshedUrls = await Promise.all(
          creative.assets.imageUrls.map((url: string) =>
            this.storageService.getViewUrlForExisting(url, tenantId || creative.tenantId?.toString())
          )
        );
        
        // Filter out null/undefined results
        const nonNullUrls = refreshedUrls.filter((u) => u != null);
        const originalNonNull = creative.assets.imageUrls.filter((u) => u != null);
        
        // Only update if URLs actually changed
        if (nonNullUrls.length !== originalNonNull.length || 
            nonNullUrls.some((url, i) => url !== originalNonNull[i])) {
          creative.assets.imageUrls = nonNullUrls;
          creative.markModified('assets');
        }
      }

      // Refresh asset videoUrl (singular)
      if (creative.assets?.videoUrl) {
        const refreshedUrl = await this.storageService.getViewUrlForExisting(
          creative.assets.videoUrl,
          tenantId || creative.tenantId?.toString(),
        );
        if (refreshedUrl && refreshedUrl !== creative.assets.videoUrl) {
          creative.assets.videoUrl = refreshedUrl;
          creative.markModified('assets');
        }
      }

      // Save if any URLs were updated
      if (creative.isModified('visual') || creative.isModified('assets')) {
        await creative.save();
      }
    } catch (err: any) {
      this.logger.warn('[refreshAssetUrls] Failed to refresh URLs', { error: err.message });
      // Don't throw - continue serving old URLs if refresh fails
    }
  }

  async findAll(query: any): Promise<Creative[]> {
    // Convert campaignId string to ObjectId for proper MongoDB querying
    if (query.campaignId && typeof query.campaignId === 'string') {
      query.campaignId = new Types.ObjectId(query.campaignId);
    }
    this.logger.log(`[findAll] Query: ${JSON.stringify(query)}`);
    const creatives = await this.creativeModel.find(query).exec();
    this.logger.log(`[findAll] Found ${creatives.length} creatives`);
    
    // Refresh expired URLs in parallel (non-blocking)
    creatives.forEach(creative => {
      this.refreshAssetUrls(creative).catch(err =>
        this.logger.warn('[findAll] URL refresh failed for creative', { id: creative._id, error: err.message })
      );
    });

    return creatives.map((creative) => this.toCreativeResponse(creative));
  }

  async findOne(id: string, tenantId?: string): Promise<Creative> {
    const creative = await this.creativeModel.findById(id).exec();
    if (!creative) throw new NotFoundException('Creative not found');
    
    // Refresh expired URLs
    await this.refreshAssetUrls(creative, tenantId);

    return this.toCreativeResponse(creative);
  }

  async create(createCreativeDto: CreateCreativeDto): Promise<Creative> {
    // Enforce subscription gating
    const tenant = await this.tenantModel.findById(createCreativeDto.tenantId).exec();
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (tenant.subscriptionStatus !== 'active') {
      throw new Error('Subscription inactive. Please renew to create creatives.');
    }
    const createdCreative = new this.creativeModel(createCreativeDto);
    const savedCreative = await createdCreative.save();
    return this.toCreativeResponse(savedCreative);
  }

  async generateTextCreative(params: {
    tenantId: string;
    campaignId?: string | null;
    model: string;
    prompt: string;
    platforms?: string[];
    angleId?: string | null;
    guidance?: { brandTone?: string; targetAudience?: string; contentPillars?: string[]; hashtagCount?: number };
    availableModels?: boolean;
    selectModel?: boolean;
  }): Promise<GenerateTextCreativeResult> {
    if (!params.tenantId) throw new BadRequestException('tenantId is required');
    // If asking for model listings, return unified lists for caption-generation
    if (params.availableModels === true || params.selectModel === true) {
      const lists = this.aiModelsService.getModelsForContentType('caption-generation') as ModelsForContentTypeResult;
      return { contentType: 'caption-generation', ...lists, providerHint: 'poe' };
    }
    
    const contents = JSON.stringify({ type: 'text', task: 'caption_hashtags', ...params });
    
    // Run AI generation and prepare for parallel operations
    const result = await this.aiModelsService.generateContent('creative-text', { model: params.model, contents });
    
    // Parse result
    let caption = result;
    let hashtags: string[] = [];
    try {
      const parsed = JSON.parse(result);
      caption = parsed.caption ?? caption;
      hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : hashtags;
    } catch {}
    
    const campaignObjectId = params.campaignId ? new Types.ObjectId(params.campaignId) : null;
    
    // Run DB save and optional R2 upload in parallel
    const [creativeDoc] = await Promise.all([
      this.creativeModel.create({
        tenantId: new Types.ObjectId(params.tenantId),
        campaignId: campaignObjectId,
        type: 'text',
        angleId: params.angleId ? new Types.ObjectId(params.angleId) : null,
        platforms: params.platforms ?? [],
        copy: { caption },
        metadata: { tags: hashtags, derivedFrom: 'ai:creative-text' },
        status: 'needsReview',
      }),
      // Upload to R2 and attach in background (non-blocking)
      params.campaignId
        ? (async () => {
            const payload = JSON.stringify({ caption, hashtags });
            const url = await this.storageService.uploadFile(
              Buffer.from(payload, 'utf-8'),
              `${params.campaignId}-caption-${Date.now()}.json`,
              'application/json',
            );
            await this.attachAssetToCampaign(params.campaignId!, 'text', url);
          })().catch(err => this.logger.error('[generateTextCreative] R2 upload failed', err))
        : Promise.resolve(),
    ]);
    
    return this.toCreativeResponse(creativeDoc);
  }

  async generateImageCreative(params: {
    tenantId: string;
    campaignId?: string | null;
    model: string;
    prompt: string;
    layoutHint?: string;
    platforms?: string[];
    angleId?: string | null;
    generateActual?: boolean;
    quality?: {
      width?: number;
      height?: number;
      negativePrompt?: string;
      numInferenceSteps?: number;
      guidanceScale?: number;
      scheduler?: string;
    };
  }): Promise<any> {
    if (!params.tenantId) throw new BadRequestException('tenantId is required');
    // If asking for model listings, return unified lists for image-generation
    if ((params as any).availableModels === true || (params as any).selectModel === true) {
      const lists = this.aiModelsService.getModelsForContentType('image-generation');
      return { contentType: 'image-generation', ...lists, providerHint: process.env.IMAGE_PROVIDER || 'replicate' };
    }
    
    const contents = JSON.stringify({ type: 'image', task: 'prompt', ...params });
    const result = await this.aiModelsService.generateContent('creative-image', { model: params.model, contents });
    
    const creativeDoc = await this.creativeModel.create({
      tenantId: new Types.ObjectId(params.tenantId),
      campaignId: params.campaignId ? new Types.ObjectId(params.campaignId) : null,
      type: 'image',
      angleId: params.angleId ? new Types.ObjectId(params.angleId) : null,
      platforms: params.platforms ?? [],
      visual: { prompt: result, layoutHint: params.layoutHint },
      status: 'draft',
      metadata: { derivedFrom: 'ai:creative-image' },
    });
    
    // Optionally generate actual image in background
    if (params.generateActual !== false) {
      this.generateActualImage(
        creativeDoc._id.toString(),
        result,
        params.model,
        params.tenantId,
        params.quality,
      )
        .catch(err => this.logger.error('[generateImageCreative] Failed to generate actual image', err));
    }
    
    return this.toCreativeResponse(creativeDoc);
  }

  async generateVideoCreative(params: {
    tenantId: string;
    campaignId?: string | null;
    model: string;
    prompt: string;
    platforms?: string[];
    angleId?: string | null;
    generateActual?: boolean;
    quality?: {
      durationSeconds?: number;
      fps?: number;
      negativePrompt?: string;
      numInferenceSteps?: number;
      guidanceScale?: number;
    };
  }): Promise<any> {
    if (!params.tenantId) throw new BadRequestException('tenantId is required');
    // If asking for model listings, return unified lists for video-generation
    if ((params as any).availableModels === true || (params as any).selectModel === true) {
      const lists = this.aiModelsService.getModelsForContentType('video-generation');
      return { contentType: 'video-generation', ...lists, providerHint: process.env.VIDEO_PROVIDER || 'replicate' };
    }
    
    this.logger.log(`[generateVideoCreative] Starting video generation${params.campaignId ? ` for campaign ${params.campaignId}` : ''}`);
    const contents = JSON.stringify({ type: 'video', task: 'script', ...params });
    const result = await this.aiModelsService.generateContent('creative-video', { model: params.model, contents });
    
    // Parse script
    let script: any = { body: result };
    try { script = JSON.parse(result); } catch {}
    
    // Run DB save and R2 operations in parallel
    const [creativeDoc] = await Promise.all([
      this.creativeModel.create({
        tenantId: new Types.ObjectId(params.tenantId),
        campaignId: params.campaignId ? new Types.ObjectId(params.campaignId) : null,
        type: 'video',
        angleId: params.angleId ? new Types.ObjectId(params.angleId) : null,
        platforms: params.platforms ?? [],
        script,
        status: 'draft',
        metadata: { derivedFrom: 'ai:creative-video' },
      }),
      // Upload script to R2 and attach in background (non-blocking)
      params.campaignId
        ? (async () => {
            const scriptPayload = Buffer.from(JSON.stringify(script, null, 2), 'utf-8');
            const scriptUrl = await this.storageService.uploadFile(
              scriptPayload,
              `${params.campaignId}-video-script-${Date.now()}.json`,
              'application/json',
              params.tenantId,
            );
            this.logger.log(`[generateVideoCreative] Script uploaded to R2: ${scriptUrl}`);
            await this.attachAssetToCampaign(params.campaignId!, 'video', scriptUrl);
          })().catch(err => this.logger.error('[generateVideoCreative] R2 upload failed', err))
        : Promise.resolve(),
    ]);
    
    // Optionally generate actual video in background
    if (params.generateActual !== false) {
      this.generateActualVideo(
        creativeDoc._id.toString(),
        params.prompt,
        script,
        params.model,
        params.tenantId,
        params.quality,
      )
        .catch(err => this.logger.error('[generateVideoCreative] Failed to generate actual video', err));
    }
    
    this.logger.log(`[generateVideoCreative] Video creative saved with ID: ${creativeDoc._id}`);
    return this.toCreativeResponse(creativeDoc);
  }

  async linkUploadedAsset(creativeId: string, assetUrl: string, type: 'image' | 'video'): Promise<Creative> {
    const creative = await this.creativeModel.findById(creativeId).exec();
    if (!creative) throw new NotFoundException('Creative not found');
    if (type === 'image') {
      creative.assets = creative.assets || {};
      const list = Array.isArray(creative.assets.imageUrls) ? creative.assets.imageUrls : [];
      list.push(assetUrl);
      creative.assets.imageUrls = list;
      creative.visual = { ...(creative.visual || {}), imageUrl: assetUrl };
      if (creative.campaignId) { await this.attachAssetToCampaign(creative.campaignId.toString(), 'image', assetUrl); };
    } else {
      creative.assets = { ...(creative.assets || {}), videoUrl: assetUrl };
      if (creative.campaignId) { await this.attachAssetToCampaign(creative.campaignId.toString(), 'video', assetUrl); };
    }
    creative.status = 'needsReview';
    creative.updatedAt = new Date();
    await creative.save();
    return this.toCreativeResponse(creative);
  }

  async regenerateWithPrompt(creativeId: string, model: string, prompt: string, scope?: 'caption' | 'hashtags' | 'prompt' | 'script' | 'all'): Promise<Creative> {
    const creative = await this.creativeModel.findById(creativeId).exec();
    if (!creative) throw new NotFoundException('Creative not found');
    const contents = JSON.stringify({ type: creative.type, task: 'regenerate', prompt });
    const result = await this.aiModelsService.generateContent(`creative-${creative.type}`, { model, contents });
    if (creative.type === 'text') {
      try {
        const parsed = JSON.parse(result);
        if (!scope || scope === 'all' || scope === 'caption') {
          creative.copy = { ...(creative.copy || {}), caption: parsed.caption ?? result };
        }
        if (!scope || scope === 'all' || scope === 'hashtags') {
          creative.metadata = { ...(creative.metadata || {}), tags: parsed.hashtags ?? creative.metadata?.tags };
        }
      } catch {
        if (!scope || scope === 'all' || scope === 'caption') {
          creative.copy = { ...(creative.copy || {}), caption: result };
        }
      }
    } else if (creative.type === 'image') {
      if (!scope || scope === 'all' || scope === 'prompt') {
        creative.visual = { ...(creative.visual || {}), prompt: result };
      }
    } else if (creative.type === 'video') {
      if (!scope || scope === 'all' || scope === 'script') {
        try { creative.script = JSON.parse(result); } catch { creative.script = { body: result }; }
      }
    }
    creative.status = 'needsReview';
    creative.updatedAt = new Date();
    await creative.save();
    return this.toCreativeResponse(creative);
  }

  /**
   * Selective regeneration: replace image without affecting text
   */
  async replaceImage(creativeId: string, newImageUrl: string): Promise<Creative> {
    const creative = await this.creativeModel.findById(creativeId).exec();
    if (!creative) throw new NotFoundException('Creative not found');
    if (creative.type !== 'image' && creative.type !== 'text') {
      throw new BadRequestException('Can only replace images on image/text creatives');
    }

    creative.assets = { ...(creative.assets || {}), imageUrls: [newImageUrl] };
    creative.visual = { ...(creative.visual || {}), imageUrl: newImageUrl };
    creative.status = 'needsReview';
    creative.updatedAt = new Date();
    await creative.save();

    // Update campaign asset refs
    if (creative.campaignId) { await this.attachAssetToCampaign(creative.campaignId.toString(), 'image', newImageUrl); };

    this.logger.log(`[replaceImage] Image replaced for creative ${creativeId}`);
    return this.toCreativeResponse(creative);
  }

  /**
   * Selective regeneration: replace video without affecting text
   */
  async replaceVideo(creativeId: string, newVideoUrl: string, posterUrl?: string): Promise<Creative> {
    const creative = await this.creativeModel.findById(creativeId).exec();
    if (!creative) throw new NotFoundException('Creative not found');

    creative.assets = { ...(creative.assets || {}), videoUrl: newVideoUrl };
    creative.visual = { 
      ...(creative.visual || {}), 
      imageUrl: posterUrl,
      thumbnailUrl: posterUrl,
    };
    creative.status = 'needsReview';
    creative.updatedAt = new Date();
    await creative.save();

    // Update campaign asset refs
    if (creative.campaignId) { await this.attachAssetToCampaign(creative.campaignId.toString(), 'video', newVideoUrl); };

    this.logger.log(`[replaceVideo] Video replaced for creative ${creativeId}`);
    return this.toCreativeResponse(creative);
  }

  /**
   * Link creative to strategy version for traceability
   */
  async linkToStrategy(creativeId: string, strategyVersion: number): Promise<Creative> {
    const creative = await this.creativeModel.findById(creativeId).exec();
    if (!creative) throw new NotFoundException('Creative not found');

    if (!creative.metadata) {
      creative.metadata = {};
    }
    creative.metadata = { 
      ...(creative.metadata || {}), 
      derivedFrom: `strategy:v${strategyVersion}`,
    };
    creative.updatedAt = new Date();
    await creative.save();

    this.logger.log(`[linkToStrategy] Creative linked to strategy v${strategyVersion}`);
    return this.toCreativeResponse(creative);
  }

  private async attachAssetToCampaign(campaignId: string, kind: 'text' | 'image' | 'video', url: string) {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) { this.logger.warn(`Campaign ${campaignId} not found for asset attach`); return; }
    const latestIndex = (campaign.contentVersions?.length || 0) - 1;
    if (latestIndex < 0) {
      // create initial content version
      campaign.contentVersions = [{
        version: 1,
        createdAt: new Date(),
        createdBy: 'system',
        mode: 'ai',
        textAssets: kind === 'text' ? [url] : [],
        imageAssets: kind === 'image' ? [url] : [],
        videoAssets: kind === 'video' ? [url] : [],
        strategyVersion: (campaign.strategyVersions?.length || 1),
        needsReview: true,
        invalidated: false,
      }];
    } else {
      const cv = campaign.contentVersions[latestIndex] as any;
      if (kind === 'text') cv.textAssets = [...(cv.textAssets || []), url];
      if (kind === 'image') cv.imageAssets = [...(cv.imageAssets || []), url];
      if (kind === 'video') cv.videoAssets = [...(cv.videoAssets || []), url];
      cv.needsReview = true;
    }
    campaign.assetRefs = [...(campaign.assetRefs || []), { url, type: kind, uploadedAt: new Date(), uploadedBy: 'system' }];
    campaign.updatedAt = new Date();
    await campaign.save();
  }

  async update(id: string, updateCreativeDto: UpdateCreativeDto): Promise<Creative> {
    const creative = await this.creativeModel.findByIdAndUpdate(id, updateCreativeDto, { new: true }).exec();
    if (!creative) throw new NotFoundException('Creative not found');
    return this.toCreativeResponse(creative);
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const res = await this.creativeModel.deleteOne({ _id: id }).exec();
    return { deleted: res.deletedCount > 0 };
  }

  async editCaption(creativeId: string, caption: string): Promise<Creative> {
    const creative = await this.creativeModel.findById(creativeId).exec();
    if (!creative) throw new NotFoundException('Creative not found');
    if (creative.type !== 'text') throw new BadRequestException('Can only edit caption on text creatives');
    creative.copy = { ...(creative.copy || {}), caption };
    creative.status = 'needsReview';
    creative.updatedAt = new Date();
    await creative.save();
    return this.toCreativeResponse(creative);
  }

  async editHashtags(creativeId: string, hashtags: string[]): Promise<Creative> {
    const creative = await this.creativeModel.findById(creativeId).exec();
    if (!creative) throw new NotFoundException('Creative not found');
    if (creative.type !== 'text') throw new BadRequestException('Can only edit hashtags on text creatives');
    creative.metadata = { ...(creative.metadata || {}), tags: hashtags };
    creative.status = 'needsReview';
    creative.updatedAt = new Date();
    await creative.save();
    return this.toCreativeResponse(creative);
  }

  async editPrompt(creativeId: string, prompt: string): Promise<Creative> {
    const creative = await this.creativeModel.findById(creativeId).exec();
    if (!creative) throw new NotFoundException('Creative not found');
    
    // Allow editing prompts for all creative types
    if (creative.type === 'image') {
      creative.visual = { ...(creative.visual || {}), prompt };
    } else if (creative.type === 'video') {
      // Map edited prompt to the script body only; keep hook unchanged
      creative.script = { ...(creative.script || {}), body: prompt };
    } else if (creative.type === 'text') {
      // For text creatives, prompt maps to caption
      creative.copy = { ...(creative.copy || {}), caption: prompt };
    }
    
    creative.status = 'needsReview';
    creative.updatedAt = new Date();
    await creative.save();
    return this.toCreativeResponse(creative);
  }

  /**
   * Generate actual image file from prompt using AI
   * This runs asynchronously in the background
    * Defaults:
    * - Prompt enhancement is configurable via `ENABLE_PROMPT_ENHANCEMENT` (env) or per-request `quality.enhancePrompt`.
    * - Image dimensions default to `DEFAULT_IMAGE_WIDTH`/`DEFAULT_IMAGE_HEIGHT` env (fallback 1024x576).
    * Callers can override via the `quality` object.
   */
  async generateActualImage(
    creativeId: string,
    prompt: string,
    model: string,
    tenantId: string,
    quality?: {
      width?: number;
      height?: number;
      negativePrompt?: string;
      numInferenceSteps?: number;
      guidanceScale?: number;
      scheduler?: string;
      // Optional flag to control prompt enhancement behavior
      enhancePrompt?: boolean;
    },
  ): Promise<void> {
    try {
      this.logger.log(`[generateActualImage] Starting image generation for creative ${creativeId}`);
      
      // Determine image generation provider from env
      const imageProvider = process.env.IMAGE_PROVIDER || 'replicate';
      this.logger.log(`[generateActualImage] Using ${imageProvider} for image generation`);
      
      // Enhance prompt with detailed quality descriptors for better results
      // Behavior can be configured via ENABLE_PROMPT_ENHANCEMENT env or per-request flag
      const enableEnhancement = (quality?.enhancePrompt ?? (process.env.ENABLE_PROMPT_ENHANCEMENT === 'true'));
      const enhancedPrompt = enableEnhancement
        ? `${prompt}. High quality professional artwork, cinematic lighting, sharp focus, intricate details, vibrant colors, well-composed, 8k ultra HD, award-winning quality, masterpiece`
        : prompt;
      
      // Parse dimensions from env with proper NaN handling
      const parsedWidth = Number(process.env.DEFAULT_IMAGE_WIDTH);
      const parsedHeight = Number(process.env.DEFAULT_IMAGE_HEIGHT);
      
      const defaultWidth = (!Number.isNaN(parsedWidth) && parsedWidth >= 0) ? Math.round(parsedWidth) : 1024;
      const defaultHeight = (!Number.isNaN(parsedHeight) && parsedHeight >= 0) ? Math.round(parsedHeight) : 576;

      let result: string;
      
      // Route to appropriate provider
      if (imageProvider === 'poe') {
        // Use Poe for image generation
        result = await this.poeClient.generateContent('image-generation', {
          model: model || 'claude-3-5-sonnet',
          contents: JSON.stringify({ prompt: enhancedPrompt, width: quality?.width ?? defaultWidth, height: quality?.height ?? defaultHeight }),
        });
      } else {
        // Use Replicate for image generation
        result = await this.replicateClient.generateImage(enhancedPrompt, {
          width: quality?.width ?? defaultWidth,
          height: quality?.height ?? defaultHeight,
          negativePrompt: quality?.negativePrompt,
          numInferenceSteps: quality?.numInferenceSteps,
          guidanceScale: quality?.guidanceScale,
          scheduler: quality?.scheduler,
        });
      }

      // Parse result - could be URL or base64, and may include provider/placeholder metadata
      let imageUrl = result;
      let provider: string | undefined;
      let isPlaceholder = false;
      try {
        const parsed = JSON.parse(result);
        imageUrl = parsed.url || parsed.imageUrl || parsed.image || result;
        provider = parsed.provider;
        if (parsed.isPlaceholder === true) {
          isPlaceholder = true;
        }
      } catch {
        // Result is plain text URL
      }

      const isHttpUrl = imageUrl.startsWith('http');
      const isPoeFallback = provider === 'poe-fallback' || isPlaceholder || this.isPlaceholderUrl(imageUrl);

      if (isHttpUrl && isPoeFallback) {
        // For Poe fallback placeholder images, do not attempt to fetch/upload.
        this.logger.warn(
          `[generateActualImage] Poe fallback placeholder image detected; storing URL directly without uploading to R2`,
        );

        const creative = await this.creativeModel.findById(creativeId).exec();
        if (creative) {
          creative.visual = { ...(creative.visual || {}), imageUrl };
          creative.assets = { ...(creative.assets || {}), imageUrls: [imageUrl] };
          creative.status = 'needsReview';
          creative.updatedAt = new Date();
          await creative.save();

          if (creative.campaignId) {
            await this.attachAssetToCampaign(creative.campaignId.toString(), 'image', imageUrl);
          }

          this.logger.log(
            `[generateActualImage] Creative ${creativeId} updated with Poe fallback placeholder image URL`,
          );
        }
      } else if (isHttpUrl) {
        // If it's a normal URL, download and upload to R2
        this.logger.log(`[generateActualImage] Downloading image from ${imageUrl.substring(0, 50)}...`);
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to R2
        const filename = `creative-${creativeId}-${Date.now()}.png`;
        const r2Url = await this.storageService.uploadFile(buffer, filename, 'image/png', tenantId);

        this.logger.log(`[generateActualImage] Image uploaded to R2: ${r2Url}`);

        // Update creative with image URL
        const creative = await this.creativeModel.findById(creativeId).exec();
        if (creative) {
          creative.visual = { ...(creative.visual || {}), imageUrl: r2Url };
          creative.assets = { ...(creative.assets || {}), imageUrls: [r2Url] };
          creative.status = 'needsReview';
          creative.updatedAt = new Date();
          await creative.save();

          // Attach to campaign
          if (creative.campaignId) {
            await this.attachAssetToCampaign(creative.campaignId.toString(), 'image', r2Url);
          }

          this.logger.log(`[generateActualImage] Creative ${creativeId} updated with image URL`);
        }
      } else {
        this.logger.warn(`[generateActualImage] Unexpected image format: ${imageUrl.substring(0, 100)}`);
      }
    } catch (err: any) {
      this.logger.error(`[generateActualImage] Failed to generate image for creative ${creativeId}`, {
        error: err.message,
        stack: err.stack,
      });
      throw err;
    }
  }
  /**
   * Generate actual video file from script using AI
   * This runs asynchronously in the background
   */
  async generateActualVideo(
    creativeId: string,
    prompt: string,
    script: any,
    model: string,
    tenantId: string,
    quality?: {
      durationSeconds?: number;
      fps?: number;
      negativePrompt?: string;
      numInferenceSteps?: number;
      guidanceScale?: number;
    },
  ): Promise<void> {
    try {
      this.logger.log(`[generateActualVideo] Starting video generation for creative ${creativeId}`);
      
      // Determine video generation provider from env
      const videoProvider = process.env.VIDEO_PROVIDER || 'replicate';
      this.logger.log(`[generateActualVideo] Using ${videoProvider} for video generation`);
      
      const duration = quality?.durationSeconds ?? 12;
      
      let result: string;
      
      // Route to appropriate provider
      if (videoProvider === 'poe') {
        // Use Poe for video generation
        result = await this.poeClient.generateContent('video-generation', {
          model: model || 'claude-3-5-sonnet',
          contents: JSON.stringify({ prompt, durationSeconds: duration, fps: quality?.fps }),
        });
      } else {
        // Use Replicate for video generation (Runway Gen-3)
        result = await this.replicateClient.generateVideo(prompt, {
          durationSeconds: duration,
          fps: quality?.fps,
          negativePrompt: quality?.negativePrompt,
        });
      }

      // Parse result - could be URL
      let videoUrl = result;
      try {
        const parsed = JSON.parse(result);
        videoUrl = parsed.url || parsed.videoUrl || parsed.video || result;
      } catch {
        // Result is plain text URL
      }

      // If it's a URL, download and upload to R2
      if (videoUrl.startsWith('http')) {
        // Skip placeholder URLs - they're not real videos
        if (this.isPlaceholderUrl(videoUrl) || videoUrl.includes('placeholder')) {
          this.logger.warn(`[generateActualVideo] Placeholder URL detected, marking creative for manual review`, {
            url: videoUrl,
          });
          const creative = await this.creativeModel.findById(creativeId).exec();
          if (creative) {
            // Keep as draft - user can retry when quota is available
            creative.status = 'draft';
            creative.updatedAt = new Date();
            await creative.save();
          }
          return;
        }

        this.logger.log(`[generateActualVideo] Downloading video from ${videoUrl.substring(0, 50)}...`);
        
        // Retry fetch with exponential backoff
        let response: Response | null = null;
        let lastError: Error | null = null;
        const maxRetries = 3;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            response = await fetch(videoUrl, { signal: AbortSignal.timeout(30000) });
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            break; // Success
          } catch (err: any) {
            lastError = err;
            this.logger.warn(`[generateActualVideo] Fetch attempt ${attempt + 1}/${maxRetries} failed`, {
              error: err.message,
            });
            if (attempt < maxRetries - 1) {
              const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }

        if (!response) {
          throw new Error(`Failed to download video after ${maxRetries} attempts: ${lastError?.message}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to R2
        const filename = `creative-${creativeId}-${Date.now()}.mp4`;
        const r2Url = await this.storageService.uploadFile(buffer, filename, 'video/mp4', tenantId);
        
        this.logger.log(`[generateActualVideo] Video uploaded to R2: ${r2Url}`);
        
        // Update creative with video URL
        const creative = await this.creativeModel.findById(creativeId).exec();
        if (creative) {
          creative.assets = { ...(creative.assets || {}), videoUrl: r2Url };
          creative.status = 'needsReview';
          creative.updatedAt = new Date();
          await creative.save();
          
          // Attach to campaign
          if (creative.campaignId) { await this.attachAssetToCampaign(creative.campaignId.toString(), 'video', r2Url); };
          
          this.logger.log(`[generateActualVideo] Creative ${creativeId} updated with video URL`);
        }
      } else {
        this.logger.warn(`[generateActualVideo] Unexpected video format: ${videoUrl.substring(0, 100)}`);
      }
    } catch (err: any) {
      const statusCode = err?.statusCode ?? err?.status ?? err?.response?.status;
      const isQuotaError = statusCode === HttpStatus.PAYMENT_REQUIRED;

      this.logger.error(`[generateActualVideo] Failed to generate video for creative ${creativeId}`, {
        error: err?.message,
        statusCode,
      });

      if (isQuotaError) {
        try {
          const creative = await this.creativeModel.findById(creativeId).exec();
          if (creative) {
            // Mark as draft and record a quota error hint so polling clients can react
            creative.status = 'draft';
            creative.metadata = {
              ...(creative.metadata || {}),
              errorCode: 'video_quota_exhausted',
              errorMessage: 'Video generation quota exhausted for the selected model/provider.',
            } as any;
            creative.updatedAt = new Date();
            await creative.save();
          }
        } catch (updateErr: any) {
          this.logger.error(`[generateActualVideo] Failed to update creative after quota error`, {
            error: updateErr?.message,
          });
        }

        // Do not throw HttpException from background task; error is reflected on the creative instead
        return;
      }

      // For non-quota errors, log and exit; generateVideoCreative already logs failures.
      return;
    }
  }
}

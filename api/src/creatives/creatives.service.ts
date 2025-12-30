import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Creative } from '../../../shared/types';
import { CreateCreativeDto, UpdateCreativeDto } from '../../../shared/creative.dto';
import { CreativeDocument } from './schemas/creative.schema';
import { InjectModel as InjectTenantModel } from '@nestjs/mongoose';
import { TenantDocument } from '../tenants/schemas/tenant.schema';
import { AIModelsService } from '../engines/ai-models.service';
import { StorageService } from '../storage/storage.service';
import { CampaignDocument } from '../models/campaign.schema';
import { PoeClient } from '../engines/poe.client';
import { ReplicateClient } from '../engines/replicate.client';

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

  async findAll(query: any): Promise<Creative[]> {
    // Convert campaignId string to ObjectId for proper MongoDB querying
    if (query.campaignId && typeof query.campaignId === 'string') {
      query.campaignId = new Types.ObjectId(query.campaignId);
    }
    this.logger.log(`[findAll] Query: ${JSON.stringify(query)}`);
    const creatives = await this.creativeModel.find(query).exec();
    this.logger.log(`[findAll] Found ${creatives.length} creatives`);
    return creatives.map((creative) => ({
      ...creative.toObject(),
      campaignId: creative.campaignId.toString(),
    }));
  }

  async findOne(id: string): Promise<Creative> {
    const creative = await this.creativeModel.findById(id).exec();
    if (!creative) throw new NotFoundException('Creative not found');
    return {
      ...creative.toObject(),
      campaignId: creative.campaignId.toString(),
    };
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
    return {
      ...savedCreative.toObject(),
      campaignId: savedCreative.campaignId.toString(),
    };
  }

  async generateTextCreative(params: {
    tenantId: string;
    campaignId: string;
    model: string;
    prompt: string;
    platforms?: string[];
    angleId?: string | null;
    guidance?: { brandTone?: string; targetAudience?: string; contentPillars?: string[]; hashtagCount?: number };
  }): Promise<Creative> {
    if (!params.tenantId || !params.campaignId) throw new BadRequestException('tenantId and campaignId are required');
    
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
    
    // Run DB save and R2 upload in parallel
    const [creativeDoc] = await Promise.all([
      this.creativeModel.create({
        tenantId: new Types.ObjectId(params.tenantId),
        campaignId: new Types.ObjectId(params.campaignId),
        type: 'text',
        angleId: params.angleId ? new Types.ObjectId(params.angleId) : null,
        platforms: params.platforms ?? [],
        copy: { caption },
        metadata: { tags: hashtags, derivedFrom: 'ai:creative-text' },
        status: 'needsReview',
      }),
      // Upload to R2 and attach in background (non-blocking)
      (async () => {
        const payload = JSON.stringify({ caption, hashtags });
        const url = await this.storageService.uploadFile(Buffer.from(payload, 'utf-8'), `${params.campaignId}-caption-${Date.now()}.json`, 'application/json');
        await this.attachAssetToCampaign(params.campaignId, 'text', url);
      })().catch(err => this.logger.error('[generateTextCreative] R2 upload failed', err)),
    ]);
    
    return { ...creativeDoc.toObject(), campaignId: creativeDoc.campaignId.toString() } as any;
  }

  async generateImageCreative(params: {
    tenantId: string;
    campaignId: string;
    model: string;
    prompt: string;
    layoutHint?: string;
    platforms?: string[];
    angleId?: string | null;
    generateActual?: boolean;
  }): Promise<Creative> {
    if (!params.tenantId || !params.campaignId) throw new BadRequestException('tenantId and campaignId are required');
    
    const contents = JSON.stringify({ type: 'image', task: 'prompt', ...params });
    const result = await this.aiModelsService.generateContent('creative-image', { model: params.model, contents });
    
    // Create creative document immediately
    const creativeDoc = await this.creativeModel.create({
      tenantId: new Types.ObjectId(params.tenantId),
      campaignId: new Types.ObjectId(params.campaignId),
      type: 'image',
      angleId: params.angleId ? new Types.ObjectId(params.angleId) : null,
      platforms: params.platforms ?? [],
      visual: { prompt: result, layoutHint: params.layoutHint },
      status: 'draft',
      metadata: { derivedFrom: 'ai:creative-image' },
    });
    
    // Optionally generate actual image in background
    if (params.generateActual !== false) {
      this.generateActualImage(creativeDoc._id.toString(), result, params.model, params.tenantId)
        .catch(err => this.logger.error('[generateImageCreative] Failed to generate actual image', err));
    }
    
    return { ...creativeDoc.toObject(), campaignId: creativeDoc.campaignId.toString() } as any;
  }

  async generateVideoCreative(params: {
    tenantId: string;
    campaignId: string;
    model: string;
    prompt: string;
    platforms?: string[];
    angleId?: string | null;
    generateActual?: boolean;
  }): Promise<Creative> {
    if (!params.tenantId || !params.campaignId) throw new BadRequestException('tenantId and campaignId are required');
    
    this.logger.log(`[generateVideoCreative] Starting video generation for campaign ${params.campaignId}`);
    const contents = JSON.stringify({ type: 'video', task: 'script', ...params });
    const result = await this.aiModelsService.generateContent('creative-video', { model: params.model, contents });
    
    // Parse script
    let script: any = { body: result };
    try { script = JSON.parse(result); } catch {}
    
    // Run DB save and R2 operations in parallel
    const [creativeDoc] = await Promise.all([
      this.creativeModel.create({
        tenantId: new Types.ObjectId(params.tenantId),
        campaignId: new Types.ObjectId(params.campaignId),
        type: 'video',
        angleId: params.angleId ? new Types.ObjectId(params.angleId) : null,
        platforms: params.platforms ?? [],
        script,
        status: 'draft',
        metadata: { derivedFrom: 'ai:creative-video' },
      }),
      // Upload script to R2 and attach in background (non-blocking)
      (async () => {
        const scriptPayload = Buffer.from(JSON.stringify(script, null, 2), 'utf-8');
        const scriptUrl = await this.storageService.uploadFile(
          scriptPayload,
          `${params.campaignId}-video-script-${Date.now()}.json`,
          'application/json',
          params.tenantId,
        );
        this.logger.log(`[generateVideoCreative] Script uploaded to R2: ${scriptUrl}`);
        await this.attachAssetToCampaign(params.campaignId, 'video', scriptUrl);
      })().catch(err => this.logger.error('[generateVideoCreative] R2 upload failed', err)),
    ]);
    
    // Optionally generate actual video in background
    if (params.generateActual !== false) {
      this.generateActualVideo(creativeDoc._id.toString(), params.prompt, script, params.model, params.tenantId)
        .catch(err => this.logger.error('[generateVideoCreative] Failed to generate actual video', err));
    }
    
    this.logger.log(`[generateVideoCreative] Video creative saved with ID: ${creativeDoc._id}`);
    return { ...creativeDoc.toObject(), campaignId: creativeDoc.campaignId.toString() } as any;
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
      await this.attachAssetToCampaign(creative.campaignId.toString(), 'image', assetUrl);
    } else {
      creative.assets = { ...(creative.assets || {}), videoUrl: assetUrl };
      await this.attachAssetToCampaign(creative.campaignId.toString(), 'video', assetUrl);
    }
    creative.status = 'needsReview';
    creative.updatedAt = new Date();
    await creative.save();
    return { ...creative.toObject(), campaignId: creative.campaignId.toString() } as any;
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
    return { ...creative.toObject(), campaignId: creative.campaignId.toString() } as any;
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
    await this.attachAssetToCampaign(creative.campaignId.toString(), 'image', newImageUrl);

    this.logger.log(`[replaceImage] Image replaced for creative ${creativeId}`);
    return { ...creative.toObject(), campaignId: creative.campaignId.toString() } as any;
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
    await this.attachAssetToCampaign(creative.campaignId.toString(), 'video', newVideoUrl);

    this.logger.log(`[replaceVideo] Video replaced for creative ${creativeId}`);
    return { ...creative.toObject(), campaignId: creative.campaignId.toString() } as any;
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
    return { ...creative.toObject(), campaignId: creative.campaignId.toString() } as any;
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
    return {
      ...creative.toObject(),
      campaignId: creative.campaignId.toString(),
    };
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
    return { ...creative.toObject(), campaignId: creative.campaignId.toString() } as any;
  }

  async editHashtags(creativeId: string, hashtags: string[]): Promise<Creative> {
    const creative = await this.creativeModel.findById(creativeId).exec();
    if (!creative) throw new NotFoundException('Creative not found');
    if (creative.type !== 'text') throw new BadRequestException('Can only edit hashtags on text creatives');
    creative.metadata = { ...(creative.metadata || {}), tags: hashtags };
    creative.status = 'needsReview';
    creative.updatedAt = new Date();
    await creative.save();
    return { ...creative.toObject(), campaignId: creative.campaignId.toString() } as any;
  }

  async editPrompt(creativeId: string, prompt: string): Promise<Creative> {
    const creative = await this.creativeModel.findById(creativeId).exec();
    if (!creative) throw new NotFoundException('Creative not found');
    if (creative.type !== 'image') throw new BadRequestException('Can only edit prompt on image creatives');
    creative.visual = { ...(creative.visual || {}), prompt };
    creative.status = 'needsReview';
    creative.updatedAt = new Date();
    await creative.save();
    return { ...creative.toObject(), campaignId: creative.campaignId.toString() } as any;
  }

  /**
   * Generate actual image file from prompt using AI
   * This runs asynchronously in the background
   */
  async generateActualImage(creativeId: string, prompt: string, model: string, tenantId: string): Promise<void> {
    try {
      this.logger.log(`[generateActualImage] Starting image generation for creative ${creativeId}`);
      
      // Always use Replicate for image generation (per plan)
      this.logger.log(`[generateActualImage] Using replicate for image generation`);
      const result: string = await this.replicateClient.generateImage(prompt, 1024, 1024);

      // Parse result - could be URL or base64
      let imageUrl = result;
      try {
        const parsed = JSON.parse(result);
        imageUrl = parsed.url || parsed.imageUrl || parsed.image || result;
      } catch {
        // Result is plain text URL
      }

      // If it's a URL, download and upload to R2
      if (imageUrl.startsWith('http')) {
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
          await this.attachAssetToCampaign(creative.campaignId.toString(), 'image', r2Url);
          
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
  async generateActualVideo(creativeId: string, prompt: string, script: any, model: string, tenantId: string): Promise<void> {
    try {
      this.logger.log(`[generateActualVideo] Starting video generation for creative ${creativeId}`);
      
      // Always use Replicate for video generation (per plan)
      const duration = 15;
      this.logger.log(`[generateActualVideo] Using replicate for video generation`);
      const result: string = await this.replicateClient.generateVideo(prompt, duration);

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
          await this.attachAssetToCampaign(creative.campaignId.toString(), 'video', r2Url);
          
          this.logger.log(`[generateActualVideo] Creative ${creativeId} updated with video URL`);
        }
      } else {
        this.logger.warn(`[generateActualVideo] Unexpected video format: ${videoUrl.substring(0, 100)}`);
      }
    } catch (err: any) {
      this.logger.error(`[generateActualVideo] Failed to generate video for creative ${creativeId}`, {
        error: err.message,
        stack: err.stack,
      });
      throw err;
    }
  }
}

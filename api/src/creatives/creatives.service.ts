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

@Injectable()
export class CreativesService {
  constructor(
    @InjectModel('Creative') private readonly creativeModel: Model<CreativeDocument>,
    @InjectTenantModel('Tenant') private readonly tenantModel: Model<TenantDocument>,
    @InjectModel('Campaign') private readonly campaignModel: Model<CampaignDocument>,
    private readonly aiModelsService: AIModelsService,
    private readonly storageService: StorageService,
  ) {}

  private readonly logger = new Logger(CreativesService.name);

  async findAll(query: any): Promise<Creative[]> {
    const creatives = await this.creativeModel.find(query).exec();
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
    const result = await this.aiModelsService.generateContent('creative-text', { model: params.model, contents });
    // Expect JSON { caption: string, hashtags: string[] }
    let caption = result;
    let hashtags: string[] = [];
    try {
      const parsed = JSON.parse(result);
      caption = parsed.caption ?? caption;
      hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : hashtags;
    } catch {}
    const creativeDoc = await this.creativeModel.create({
      tenantId: new Types.ObjectId(params.tenantId),
      campaignId: new Types.ObjectId(params.campaignId),
      type: 'text',
      angleId: params.angleId ? new Types.ObjectId(params.angleId) : null,
      platforms: params.platforms ?? [],
      copy: { caption },
      metadata: { tags: hashtags, derivedFrom: 'ai:creative-text' },
      status: 'needsReview',
    });
    // Upload caption+hashtags to R2 and attach to campaign content version
    const payload = JSON.stringify({ caption, hashtags });
    const url = await this.storageService.uploadFile(Buffer.from(payload, 'utf-8'), `${params.campaignId}-caption-${Date.now()}.json`, 'application/json');
    await this.attachAssetToCampaign(params.campaignId, 'text', url);
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
  }): Promise<Creative> {
    if (!params.tenantId || !params.campaignId) throw new BadRequestException('tenantId and campaignId are required');
    const contents = JSON.stringify({ type: 'image', task: 'prompt', ...params });
    const result = await this.aiModelsService.generateContent('creative-image', { model: params.model, contents });
    // Store prompt; user may upload image later
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
    return { ...creativeDoc.toObject(), campaignId: creativeDoc.campaignId.toString() } as any;
  }

  async generateVideoCreative(params: {
    tenantId: string;
    campaignId: string;
    model: string;
    prompt: string;
    platforms?: string[];
    angleId?: string | null;
  }): Promise<Creative> {
    if (!params.tenantId || !params.campaignId) throw new BadRequestException('tenantId and campaignId are required');
    const contents = JSON.stringify({ type: 'video', task: 'script', ...params });
    const result = await this.aiModelsService.generateContent('creative-video', { model: params.model, contents });
    // Attempt JSON { hook, body, outro, scenes[] }
    let script: any = { body: result };
    try { script = JSON.parse(result); } catch {}
    const creativeDoc = await this.creativeModel.create({
      tenantId: new Types.ObjectId(params.tenantId),
      campaignId: new Types.ObjectId(params.campaignId),
      type: 'video',
      angleId: params.angleId ? new Types.ObjectId(params.angleId) : null,
      platforms: params.platforms ?? [],
      script,
      status: 'draft',
      metadata: { derivedFrom: 'ai:creative-video' },
    });
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
}

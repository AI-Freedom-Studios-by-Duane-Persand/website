import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CampaignDocument } from '../models/campaign.schema';
import { CreateCampaignDto } from '../../../shared';
import { StrategyEngine } from '../engines/strategy.engine';
import { CopyEngine } from '../engines/copy.engine';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    @InjectModel('Campaign') private readonly campaignModel: Model<CampaignDocument>,
    private readonly strategyEngine: StrategyEngine,
    private readonly copyEngine: CopyEngine,
    private readonly subscriptionsService: SubscriptionsService, // Replaced SubscriptionsModule with SubscriptionsService
    private readonly storageService: StorageService // Inject StorageService
  ) {}

  async create(createCampaignDto: CreateCampaignDto & { createdBy: string; tenantId: string }): Promise<any> {
    try {
      this.logger.log('Starting campaign creation process');

      const tenantId = createCampaignDto.tenantId;
      if (!tenantId) {
        this.logger.error('tenantId is required (must come from authenticated user)');
        throw new Error('Missing tenantId for campaign creation');
      }
      this.logger.log(`[create] tenantId=${tenantId}`);

      // Patch required fields for CreateCampaignDto compatibility
      const patchedDto = {
        ...createCampaignDto,
        title: (createCampaignDto as any).title || createCampaignDto.name || 'Untitled',
        description: (createCampaignDto as any).description || '',
        budget: (createCampaignDto as any).budget || 0,
        userId: (createCampaignDto as any).userId || createCampaignDto.createdBy || 'system',
      };

      // Generate initial strategy with Poe API, fallback on error
      let strategy;
      try {
        this.logger.log('[PoeAPI] Requesting strategy generation', patchedDto);
        strategy = await this.strategyEngine.generate(patchedDto);
        this.logger.log('[PoeAPI] Strategy generated successfully');
      } catch (err) {
        const errorMessage = (typeof err === 'object' && err !== null && 'message' in err) ? (err as any).message : undefined;
        const errorStack = (typeof err === 'object' && err !== null && 'stack' in err) ? (err as any).stack : undefined;
        this.logger.error('[PoeAPI] Strategy generation failed, using fallback.', {
          errorMessage,
          errorStack,
          err
        });
        strategy = 'Default strategy content';
        this.logger.warn('[PoeAPI] Using fallback strategy content:', strategy);
      }

      // Generate initial copy with Poe API, fallback on error
      let copy;
      try {
        this.logger.log('[PoeAPI] Requesting copy generation', patchedDto);
        copy = await this.copyEngine.generate(patchedDto);
        this.logger.log('[PoeAPI] Copy generated successfully');
      } catch (err) {
        const errorMessage = (typeof err === 'object' && err !== null && 'message' in err) ? (err as any).message : undefined;
        const errorStack = (typeof err === 'object' && err !== null && 'stack' in err) ? (err as any).stack : undefined;
        this.logger.error('[PoeAPI] Copy generation failed, using fallback.', {
          errorMessage,
          errorStack,
          err
        });
        copy = 'Default copy content';
        this.logger.warn('[PoeAPI] Using fallback copy content:', copy);
      }

      // Use a generated campaignId or fallback to name+timestamp
      const campaignId = (createCampaignDto as any).campaignId || `${createCampaignDto.name.replace(/\s+/g, '-')}-${Date.now()}`;

      // Upload generated strategy and copy to R2
      let strategyUrl, copyUrl;
      try {
        strategyUrl = await this.storageService.uploadFile(
          Buffer.from(strategy, 'utf-8'),
          `${campaignId}-strategy-v1.txt`,
          'text/plain'
        );
        this.logger.log(`[StorageService] Strategy uploaded to R2: ${strategyUrl}`);
      } catch (err) {
        const errorMessage = (typeof err === 'object' && err !== null && 'message' in err) ? (err as any).message : undefined;
        const errorStack = (typeof err === 'object' && err !== null && 'stack' in err) ? (err as any).stack : undefined;
        this.logger.error('[StorageService] Failed to upload strategy to R2', {
          errorMessage,
          errorStack,
          err
        });
        throw new Error('Failed to upload strategy to storage.');
      }

      try {
        copyUrl = await this.storageService.uploadFile(
          Buffer.from(copy, 'utf-8'),
          `${campaignId}-copy-v1.txt`,
          'text/plain'
        );
        this.logger.log(`[StorageService] Copy uploaded to R2: ${copyUrl}`);
      } catch (err) {
        const errorMessage = (typeof err === 'object' && err !== null && 'message' in err) ? (err as any).message : undefined;
        const errorStack = (typeof err === 'object' && err !== null && 'stack' in err) ? (err as any).stack : undefined;
        this.logger.error('[StorageService] Failed to upload copy to R2', {
          errorMessage,
          errorStack,
          err
        });
        throw new Error('Failed to upload copy to storage.');
      }

      // Build initial versioned structures
      const now = new Date();
      const initialStrategy = {
        version: 1,
        createdAt: now,
        createdBy: createCampaignDto.createdBy,
        platforms: (createCampaignDto as any).platforms || [],
        goals: (createCampaignDto as any).goals || [],
        targetAudience: (createCampaignDto as any).targetAudience || '',
        contentPillars: (createCampaignDto as any).contentPillars || [],
        brandTone: (createCampaignDto as any).brandTone || '',
        constraints: (createCampaignDto as any).constraints || '',
        cadence: (createCampaignDto as any).cadence || '',
        adsConfig: (createCampaignDto as any).adsConfig || {},
        invalidated: false,
      };

      const initialContent = {
        version: 1,
        createdAt: now,
        createdBy: createCampaignDto.createdBy,
        mode: (createCampaignDto as any).mode || 'ai',
        textAssets: [copyUrl],
        imageAssets: [],
        videoAssets: [],
        aiModel: (createCampaignDto as any).model || '',
        regenerationMeta: {},
        strategyVersion: 1,
        needsReview: false,
        invalidated: false,
      };

      const newCampaign = new this.campaignModel({
        tenantId,
        name: createCampaignDto.name,
        status: 'draft',
        statusHistory: [{ status: 'draft', changedAt: now, changedBy: createCampaignDto.createdBy }],
        strategyVersions: [initialStrategy],
        contentVersions: [initialContent],
        assetRefs: [],
        schedule: [],
        approvalStates: {
          strategy: 'pending',
          content: 'pending',
          schedule: 'pending',
          ads: 'pending',
        },
        revisionHistory: [{
          revision: 1,
          changedAt: now,
          changedBy: createCampaignDto.createdBy,
          changes: { created: true },
          note: 'Initial campaign creation',
        }],
      });

      let savedCampaign;
      try {
        savedCampaign = await newCampaign.save();
        this.logger.log(`Campaign created successfully with ID: ${savedCampaign._id}`);
      } catch (err) {
        const errorMessage = (typeof err === 'object' && err !== null && 'message' in err) ? (err as any).message : undefined;
        const errorStack = (typeof err === 'object' && err !== null && 'stack' in err) ? (err as any).stack : undefined;
        this.logger.error('[MongoDB] Failed to save new campaign', {
          errorMessage,
          errorStack,
          err,
          campaignData: newCampaign
        });
        throw new Error('Failed to save campaign to database.');
      }
      return savedCampaign;
    } catch (error) {
      const errorMessage = (typeof error === 'object' && error !== null && 'message' in error) ? (error as any).message : undefined;
      const errorStack = (typeof error === 'object' && error !== null && 'stack' in error) ? (error as any).stack : undefined;
      this.logger.error('Error during campaign creation', {
        errorMessage,
        errorStack,
        error,
        input: createCampaignDto
      });
      throw new Error('Failed to create campaign. Please try again later.');
    }
  }

  // Add a new strategy version and invalidate downstream approvals/content
  async addStrategyVersion(campaignId: string, strategyData: any, userId: string, note?: string, tenantId?: string) {
    const campaign = await this.campaignModel.findOne({ _id: campaignId, tenantId }).exec();
    if (!campaign) throw new NotFoundException('Campaign not found');
    const newVersion = (campaign.strategyVersions?.length || 0) + 1;
    const now = new Date();
    campaign.strategyVersions.push({ ...strategyData, version: newVersion, createdAt: now, createdBy: userId, invalidated: false });
    // Invalidate all content/schedule/ads approvals
    campaign.approvalStates.strategy = 'pending';
    campaign.approvalStates.content = 'needs_review';
    campaign.approvalStates.schedule = 'needs_review';
    campaign.approvalStates.ads = 'needs_review';
    // Mark all content versions as invalidated
    if (campaign.contentVersions) {
      campaign.contentVersions.forEach((c: any) => { c.invalidated = true; c.invalidatedAt = now; c.invalidatedBy = userId; });
    }
    campaign.status = 'draft';
    campaign.statusHistory.push({ status: 'draft', changedAt: now, changedBy: userId, note });
    campaign.revisionHistory.push({ revision: (campaign.revisionHistory?.length || 0) + 1, changedAt: now, changedBy: userId, changes: { strategyVersion: newVersion }, note });
    await campaign.save();
    return campaign;
  }

  // Add a new content version (AI/manual/hybrid)
  async addContentVersion(campaignId: string, contentData: any, userId: string, note?: string, tenantId?: string) {
    const campaign = await this.campaignModel.findOne({ _id: campaignId, tenantId }).exec();
    if (!campaign) throw new NotFoundException('Campaign not found');
    const newVersion = (campaign.contentVersions?.length || 0) + 1;
    const now = new Date();
    campaign.contentVersions.push({ ...contentData, version: newVersion, createdAt: now, createdBy: userId, invalidated: false });
    campaign.approvalStates.content = 'pending';
    campaign.status = 'draft';
    campaign.statusHistory.push({ status: 'draft', changedAt: now, changedBy: userId, note });
    campaign.revisionHistory.push({ revision: (campaign.revisionHistory?.length || 0) + 1, changedAt: now, changedBy: userId, changes: { contentVersion: newVersion }, note });
    await campaign.save();
    return campaign;
  }

  // Approve a section (strategy, content, schedule, ads)
  async approveSection(campaignId: string, section: string, userId: string, note?: string, tenantId?: string) {
    const campaign = await this.campaignModel.findOne({ _id: campaignId, tenantId }).exec();
    if (!campaign) throw new NotFoundException('Campaign not found');
    campaign.approvalStates[section] = 'approved';
    const now = new Date();
    campaign.statusHistory.push({ status: `approved_${section}`, changedAt: now, changedBy: userId, note });
    campaign.revisionHistory.push({ revision: (campaign.revisionHistory?.length || 0) + 1, changedAt: now, changedBy: userId, changes: { approved: section }, note });
    await campaign.save();
    return campaign;
  }

  // Rollback to a previous revision
  async rollbackToRevision(campaignId: string, revision: number, userId: string, note?: string, tenantId?: string) {
    // This is a stub for rollback logic; would require storing full snapshots or diffs
    // For now, just log the intent
    this.logger.warn(`Requested rollback of campaign ${campaignId} to revision ${revision} by ${userId} in tenant ${tenantId}`);
    // Implement actual rollback logic as needed
    return { message: 'Rollback not yet implemented' };
  }

  async findAll(tenantId: string): Promise<CampaignDocument[]> {
    return this.campaignModel.find({ tenantId }).exec();
  }

  async findOne(id: string, tenantId: string): Promise<CampaignDocument> {
    const campaign = await this.campaignModel.findOne({ _id: id, tenantId }).exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    return campaign;
  }

  async update(id: string, updateData: Partial<CampaignDocument>, tenantId: string): Promise<CampaignDocument> {
    try {
      const updatedCampaign = await this.campaignModel.findOneAndUpdate(
        { _id: id, tenantId },
        updateData,
        { new: true },
      ).exec();
      if (!updatedCampaign) {
        throw new NotFoundException(`Campaign with ID ${id} not found`);
      }
      this.logger.log(`Campaign updated successfully with ID: ${id}`);
      return updatedCampaign;
    } catch (error) {
      this.logger.error('Error during campaign update', error instanceof Error ? error.stack : error);
      throw new Error('Failed to update campaign. Please try again later.');
    }
  }

  async delete(id: string, tenantId: string): Promise<CampaignDocument> {
    const deletedCampaign = await this.campaignModel.findOneAndDelete({ _id: id, tenantId }).exec();
    if (!deletedCampaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    return deletedCampaign;
  }

  async createCampaignId(): Promise<{ id: string }> {
    try {
      this.logger.log('Creating campaign ID');

      // Simulate campaign ID creation logic
      const campaignId = `campaign-${Date.now()}`;

      this.logger.log(`Campaign ID created successfully: ${campaignId}`);
      return { id: campaignId };
    } catch (error) {
      this.logger.error('Error creating campaign ID', error instanceof Error ? error.stack : error);
      throw new Error('Failed to create campaign ID. Please try again later.');
    }
  }
}

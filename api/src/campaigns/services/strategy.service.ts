import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CampaignDocument } from '../../models/campaign.schema';
import { CreateStrategyVersionDto, AddStrategyVersionDto } from '../dto/strategy-version.dto';

@Injectable()
export class StrategyService {
  private readonly logger = new Logger(StrategyService.name);

  constructor(
    @InjectModel('Campaign') private readonly campaignModel: Model<CampaignDocument>,
  ) {}

  /**
   * Add a new strategy version to a campaign
   * Automatically invalidates downstream approvals and content versions
   */
  async addStrategyVersion(dto: AddStrategyVersionDto, tenantId: string): Promise<CampaignDocument> {
    this.logger.log(`Adding strategy version for campaign ${dto.campaignId}`);

    const campaign = await this.campaignModel.findOne({ 
      _id: dto.campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${dto.campaignId} not found`);
    }

    const newVersion = (campaign.strategyVersions?.length || 0) + 1;
    const now = new Date();

    // Add new strategy version
    campaign.strategyVersions.push({
      version: newVersion,
      createdAt: now,
      createdBy: dto.userId,
      platforms: dto.platforms,
      goals: dto.goals,
      targetAudience: dto.targetAudience,
      contentPillars: dto.contentPillars,
      brandTone: dto.brandTone,
      constraints: dto.constraints,
      cadence: dto.cadence,
      adsConfig: dto.adsConfig,
      invalidated: false,
    });

    // Invalidate all downstream approvals
    campaign.approvalStates = {
      strategy: 'pending',
      content: 'needs_review',
      schedule: 'needs_review',
      ads: 'needs_review',
    };

    // Mark all existing content versions as invalidated
    if (campaign.contentVersions && campaign.contentVersions.length > 0) {
      campaign.contentVersions.forEach((content: any) => {
        content.invalidated = true;
        content.invalidatedAt = now;
        content.invalidatedBy = dto.userId;
        content.needsReview = true;
      });
      this.logger.log(`Invalidated ${campaign.contentVersions.length} content versions`);
    }

    // Update campaign status and history
    campaign.status = 'draft';
    campaign.statusHistory.push({
      status: 'draft',
      changedAt: now,
      changedBy: dto.userId,
      note: dto.note || `Strategy version ${newVersion} added`,
    });

    // Add revision history
    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: dto.userId,
      changes: { strategyVersion: newVersion },
      note: dto.note,
    });

    await campaign.save();
    this.logger.log(`Strategy version ${newVersion} added successfully`);
    return campaign;
  }

  /**
   * Get the latest active (non-invalidated) strategy version
   */
  async getLatestStrategyVersion(campaignId: string, tenantId: string): Promise<any> {
    const campaign = await this.campaignModel.findOne({ 
      _id: campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    const activeStrategies = campaign.strategyVersions.filter((s: any) => !s.invalidated);
    
    if (activeStrategies.length === 0) {
      throw new BadRequestException('No active strategy version found');
    }

    return activeStrategies[activeStrategies.length - 1];
  }

  /**
   * Get all strategy versions for a campaign
   */
  async getAllStrategyVersions(campaignId: string, tenantId: string): Promise<any[]> {
    const campaign = await this.campaignModel.findOne({ 
      _id: campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    return campaign.strategyVersions || [];
  }

  /**
   * Invalidate a specific strategy version
   */
  async invalidateStrategyVersion(
    campaignId: string, 
    version: number, 
    userId: string, 
    tenantId: string
  ): Promise<CampaignDocument> {
    const campaign = await this.campaignModel.findOne({ 
      _id: campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    const strategyVersion = campaign.strategyVersions.find((s: any) => s.version === version);
    
    if (!strategyVersion) {
      throw new NotFoundException(`Strategy version ${version} not found`);
    }

    const now = new Date();
    strategyVersion.invalidated = true;
    strategyVersion.invalidatedAt = now;
    strategyVersion.invalidatedBy = userId;

    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: userId,
      changes: { invalidatedStrategyVersion: version },
      note: `Strategy version ${version} invalidated`,
    });

    await campaign.save();
    this.logger.log(`Strategy version ${version} invalidated`);
    return campaign;
  }
}

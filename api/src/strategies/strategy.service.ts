import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StrategyDocument } from '../models/strategy.model';
import { CampaignDocument } from '../models/campaign.schema';
import { ApprovalsService } from '../approvals/approvals.service';

export interface CreateStrategyInput {
  tenantId: string;
  campaignId: string;
  platforms: string[];
  goals: string[];
  targetAudience: string;
  contentPillars: string[];
  brandTone: string;
  constraints?: string;
  cadence: string;
  adsConfig?: any;
}

@Injectable()
export class StrategyService {
  private readonly logger = new Logger(StrategyService.name);

  constructor(
    @InjectModel('Strategy') private readonly strategyModel: Model<StrategyDocument>,
    @InjectModel('Campaign') private readonly campaignModel: Model<CampaignDocument>,
    private readonly approvalsService: ApprovalsService,
  ) {}

  /**
   * Create a new strategy version for a campaign
   */
  async createStrategy(input: CreateStrategyInput, createdBy: string): Promise<StrategyDocument> {
    const campaign = await this.campaignModel.findById(input.campaignId).exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign not found: ${input.campaignId}`);
    }

    // Get next version number
    const lastStrategy = await this.strategyModel
      .findOne({ campaignId: new Types.ObjectId(input.campaignId) })
      .sort({ version: -1 })
      .exec();

    const nextVersion = (lastStrategy?.version || 0) + 1;

    const strategy = new this.strategyModel({
      tenantId: new Types.ObjectId(input.tenantId),
      campaignId: new Types.ObjectId(input.campaignId),
      version: nextVersion,
      platforms: input.platforms,
      goals: input.goals,
      targetAudience: input.targetAudience,
      contentPillars: input.contentPillars,
      brandTone: input.brandTone,
      constraints: input.constraints,
      cadence: input.cadence,
      adsConfig: input.adsConfig,
      createdBy,
      createdAt: new Date(),
    });

    await strategy.save();

    // Update campaign's strategy version
    if (!campaign.strategyVersions) {
      campaign.strategyVersions = [];
    }
    campaign.strategyVersions.push({
      version: nextVersion,
      createdAt: new Date(),
      createdBy,
      platforms: input.platforms,
      goals: input.goals,
      targetAudience: input.targetAudience,
      contentPillars: input.contentPillars,
      brandTone: input.brandTone,
      constraints: input.constraints,
      cadence: input.cadence,
      adsConfig: input.adsConfig,
      invalidated: false,
    });
    await campaign.save();

    this.logger.log(`[createStrategy] Strategy v${nextVersion} created for campaign ${input.campaignId}`);
    return strategy;
  }

  /**
   * Get current (latest non-invalidated) strategy for a campaign
   */
  async getCurrentStrategy(campaignId: string, tenantId: string): Promise<StrategyDocument> {
    const strategy = await this.strategyModel
      .findOne({
        campaignId: new Types.ObjectId(campaignId),
        tenantId: new Types.ObjectId(tenantId),
        invalidated: false,
      })
      .sort({ version: -1 })
      .exec();

    if (!strategy) {
      throw new NotFoundException(`No valid strategy found for campaign ${campaignId}`);
    }

    return strategy;
  }

  /**
   * Get strategy by version
   */
  async getStrategyByVersion(campaignId: string, version: number, tenantId: string): Promise<StrategyDocument> {
    const strategy = await this.strategyModel
      .findOne({
        campaignId: new Types.ObjectId(campaignId),
        version,
        tenantId: new Types.ObjectId(tenantId),
      })
      .exec();

    if (!strategy) {
      throw new NotFoundException(`Strategy version ${version} not found for campaign ${campaignId}`);
    }

    return strategy;
  }

  /**
   * Get all strategies for a campaign
   */
  async getStrategiesForCampaign(campaignId: string, tenantId: string): Promise<StrategyDocument[]> {
    return this.strategyModel
      .find({
        campaignId: new Types.ObjectId(campaignId),
        tenantId: new Types.ObjectId(tenantId),
      })
      .sort({ version: -1 })
      .exec();
  }

  /**
   * Invalidate a strategy and mark dependent content for review
   */
  async invalidateStrategy(campaignId: string, strategyVersion: number, tenantId: string, reason: string, invalidatedBy: string): Promise<StrategyDocument> {
    const strategy = await this.getStrategyByVersion(campaignId, strategyVersion, tenantId);

    strategy.invalidated = true;
    strategy.invalidatedAt = new Date();
    strategy.invalidatedBy = invalidatedBy;
    strategy.invalidationReason = reason;
    await strategy.save();

    // Update campaign's strategy version to mark as invalidated
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (campaign && campaign.strategyVersions) {
      const cv = campaign.strategyVersions.find(v => v.version === strategyVersion);
      if (cv) {
        cv.invalidated = true;
        cv.invalidatedAt = new Date();
        cv.invalidatedBy = invalidatedBy;
      }
      await campaign.save();
    }

    // Invalidate downstream approvals (content, schedule, ads)
    try {
      await this.approvalsService.invalidateDownstreamApprovals(
        campaignId,
        strategyVersion,
        tenantId,
        invalidatedBy,
      );
    } catch (err) {
      this.logger.warn(`[invalidateStrategy] Failed to invalidate downstream approvals`, {
        error: (err as Error).message,
        campaignId,
        strategyVersion,
      });
    }

    this.logger.log(`[invalidateStrategy] Strategy v${strategyVersion} invalidated for campaign ${campaignId}`, {
      reason,
    });

    return strategy;
  }

  /**
   * Update an existing strategy (creates new version)
   */
  async updateStrategy(campaignId: string, currentVersion: number, updates: Partial<CreateStrategyInput>, tenantId: string, updatedBy: string): Promise<StrategyDocument> {
    const currentStrategy = await this.getStrategyByVersion(campaignId, currentVersion, tenantId);

    // Invalidate current strategy
    await this.invalidateStrategy(campaignId, currentVersion, tenantId, 'Updated with new strategy', updatedBy);

    // Create new strategy with merged data
    const newStrategy = await this.createStrategy(
      {
        tenantId,
        campaignId,
        platforms: updates.platforms || currentStrategy.platforms,
        goals: updates.goals || currentStrategy.goals,
        targetAudience: updates.targetAudience || currentStrategy.targetAudience,
        contentPillars: updates.contentPillars || currentStrategy.contentPillars,
        brandTone: updates.brandTone || currentStrategy.brandTone,
        constraints: updates.constraints || currentStrategy.constraints,
        cadence: updates.cadence || currentStrategy.cadence,
        adsConfig: updates.adsConfig || currentStrategy.adsConfig,
      },
      updatedBy,
    );

    this.logger.log(`[updateStrategy] Strategy updated for campaign ${campaignId}`, {
      oldVersion: currentVersion,
      newVersion: newStrategy.version,
    });

    return newStrategy;
  }

  /**
   * Check if strategy needs updates (for continuous prompting engine)
   */
  async checkStrategyCompleteness(strategy: StrategyDocument): Promise<{ complete: boolean; missingFields: string[] }> {
    const required = ['platforms', 'goals', 'targetAudience', 'contentPillars', 'brandTone', 'cadence'];
    const missing: string[] = [];

    for (const field of required) {
      const value = (strategy as any)[field];
      if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
        missing.push(field);
      }
    }

    return {
      complete: missing.length === 0,
      missingFields: missing,
    };
  }
}

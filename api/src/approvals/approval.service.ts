import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CampaignDocument } from '../models/campaign.schema';

export type ApprovalScope = 'strategy' | 'content' | 'schedule' | 'ads';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'needs_review';

export interface ApprovalState {
  scope: ApprovalScope;
  status: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  invalidatedAt?: Date;
  invalidationReason?: string;
}

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name);

  constructor(
    @InjectModel('Campaign') private readonly campaignModel: Model<CampaignDocument>,
  ) {}

  /**
   * Initialize approval states for a campaign
   */
  async initializeApprovals(campaignId: string, requiredScopes: ApprovalScope[]): Promise<Record<string, ApprovalState>> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign not found: ${campaignId}`);
    }

    const approvalStates: Record<string, ApprovalState> = {};
    for (const scope of requiredScopes) {
      approvalStates[scope] = {
        scope,
        status: 'pending',
      };
    }

    campaign.approvalStates = approvalStates;
    await campaign.save();

    this.logger.log(`[initializeApprovals] Initialized approvals for campaign ${campaignId}`, {
      scopes: requiredScopes,
    });

    return approvalStates;
  }

  /**
   * Set approval for a specific scope
   */
  async approve(campaignId: string, scope: ApprovalScope, approvedBy: string, comments?: string): Promise<ApprovalState> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign not found: ${campaignId}`);
    }

    if (!campaign.approvalStates[scope]) {
      throw new BadRequestException(`Approval scope not found: ${scope}`);
    }

    const approval = campaign.approvalStates[scope];
    approval.status = 'approved';
    approval.approvedBy = approvedBy;
    approval.approvedAt = new Date();

    await campaign.save();

    this.logger.log(`[approve] Campaign ${campaignId} approved for ${scope}`, {
      approvedBy,
      comments,
    });

    return approval;
  }

  /**
   * Reject approval for a scope
   */
  async reject(campaignId: string, scope: ApprovalScope, rejectedBy: string, reason: string): Promise<ApprovalState> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign not found: ${campaignId}`);
    }

    if (!campaign.approvalStates[scope]) {
      throw new BadRequestException(`Approval scope not found: ${scope}`);
    }

    const approval = campaign.approvalStates[scope];
    approval.status = 'rejected';
    approval.rejectedBy = rejectedBy;
    approval.rejectionReason = reason;
    approval.rejectedAt = new Date();

    await campaign.save();

    this.logger.log(`[reject] Campaign ${campaignId} rejected for ${scope}`, {
      rejectedBy,
      reason,
    });

    return approval;
  }

  /**
   * Invalidate approval (e.g., when strategy changes)
   */
  async invalidateApproval(campaignId: string, scope: ApprovalScope, reason: string, invalidatedBy?: string): Promise<ApprovalState> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign not found: ${campaignId}`);
    }

    if (!campaign.approvalStates[scope]) {
      throw new BadRequestException(`Approval scope not found: ${scope}`);
    }

    const approval = campaign.approvalStates[scope];
    approval.status = 'needs_review';
    approval.invalidatedAt = new Date();
    approval.invalidationReason = reason;

    await campaign.save();

    this.logger.log(`[invalidateApproval] Campaign ${campaignId} approval invalidated for ${scope}`, {
      reason,
      invalidatedBy,
    });

    return approval;
  }

  /**
   * Invalidate dependent approvals when strategy changes
   */
  async invalidateDependentApprovals(campaignId: string, changedScope: 'strategy', reason: string, invalidatedBy?: string): Promise<Record<string, ApprovalState>> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign not found: ${campaignId}`);
    }

    // When strategy changes, content, schedule, and ads approvals become invalid
    const dependents = changedScope === 'strategy' ? ['content', 'schedule', 'ads'] : [];

    for (const scope of dependents) {
      if (campaign.approvalStates[scope]) {
        await this.invalidateApproval(campaignId, scope as ApprovalScope, reason, invalidatedBy);
      }
    }

    this.logger.log(`[invalidateDependentApprovals] Campaign ${campaignId} dependent approvals invalidated`, {
      changedScope,
      dependents,
    });

    return campaign.approvalStates;
  }

  /**
   * Check if campaign is ready for publishing
   */
  async canPublish(campaignId: string, requiredScopes?: ApprovalScope[]): Promise<{ canPublish: boolean; blockers: string[] }> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign not found: ${campaignId}`);
    }

    const scopes = requiredScopes || Object.keys(campaign.approvalStates) as ApprovalScope[];
    const blockers: string[] = [];

    for (const scope of scopes) {
      const approval = campaign.approvalStates[scope];
      if (!approval) {
        blockers.push(`Missing approval state for ${scope}`);
      } else if (approval.status !== 'approved') {
        blockers.push(`${scope} approval is ${approval.status}`);
      }
    }

    return {
      canPublish: blockers.length === 0,
      blockers,
    };
  }

  /**
   * Get approval state for a campaign
   */
  async getApprovals(campaignId: string): Promise<Record<string, ApprovalState>> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign not found: ${campaignId}`);
    }

    return campaign.approvalStates || {};
  }

  /**
   * Get detailed approval status for UI display
   */
  async getApprovalStatus(campaignId: string): Promise<{ scope: ApprovalScope; status: ApprovalStatus; details: any }[]> {
    const approvals = await this.getApprovals(campaignId);

    return Object.entries(approvals).map(([scope, approval]) => ({
      scope: scope as ApprovalScope,
      status: approval.status,
      details: {
        approvedBy: approval.approvedBy,
        approvedAt: approval.approvedAt,
        rejectionReason: approval.rejectionReason,
        rejectedAt: approval.rejectedAt,
        invalidatedAt: approval.invalidatedAt,
        invalidationReason: approval.invalidationReason,
      },
    }));
  }
}

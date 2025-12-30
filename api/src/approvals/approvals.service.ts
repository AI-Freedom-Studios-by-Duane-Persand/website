import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ApprovalDocument, ApprovalType, ApprovalStatus } from '../models/approval.model';
import { CampaignDocument } from '../models/campaign.schema';

export interface CreateApprovalInput {
  campaignId: string;
  type: ApprovalType;
  version: number;
  requiredApprovals?: number;
  approvers?: Array<{ userId: string; role?: string }>;
}

export interface ApproveInput {
  campaignId: string;
  type: ApprovalType;
  version: number;
  userId: string;
  feedback?: string;
}

export interface RejectInput {
  campaignId: string;
  type: ApprovalType;
  version: number;
  userId: string;
  reason: string;
}

@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);

  constructor(
    @InjectModel('Approval') private readonly approvalModel: Model<ApprovalDocument>,
    @InjectModel('Campaign') private readonly campaignModel: Model<CampaignDocument>,
  ) {}

  /**
   * Create a new approval request
   */
  async createApproval(
    tenantId: string,
    input: CreateApprovalInput,
    createdBy: string,
  ): Promise<ApprovalDocument> {
    const campaign = await this.campaignModel.findById(input.campaignId).exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign not found: ${input.campaignId}`);
    }

    const approval = new this.approvalModel({
      tenantId: new Types.ObjectId(tenantId),
      campaignId: new Types.ObjectId(input.campaignId),
      type: input.type,
      version: input.version,
      requiredApprovals: input.requiredApprovals || 1,
      currentApprovals: 0,
      approvers: input.approvers || [],
      status: 'pending',
      createdBy,
      createdAt: new Date(),
    });

    await approval.save();

    this.logger.log(`[createApproval] Created ${input.type} approval v${input.version} for campaign ${input.campaignId}`, {
      tenantId,
      approvalId: approval._id,
    });

    return approval;
  }

  /**
   * Get current approval for a type and version
   */
  async getCurrentApproval(
    campaignId: string,
    type: ApprovalType,
    tenantId: string,
  ): Promise<ApprovalDocument | null> {
    return this.approvalModel
      .findOne({
        campaignId: new Types.ObjectId(campaignId),
        type,
        tenantId: new Types.ObjectId(tenantId),
        status: { $ne: 'needs_review' },
      })
      .sort({ version: -1 })
      .exec();
  }

  /**
   * Get approval by type and version
   */
  async getApprovalByVersion(
    campaignId: string,
    type: ApprovalType,
    version: number,
    tenantId: string,
  ): Promise<ApprovalDocument | null> {
    return this.approvalModel.findOne({
      campaignId: new Types.ObjectId(campaignId),
      type,
      version,
      tenantId: new Types.ObjectId(tenantId),
    }).exec();
  }

  /**
   * Get all approvals for a campaign
   */
  async getApprovalsForCampaign(
    campaignId: string,
    tenantId: string,
  ): Promise<ApprovalDocument[]> {
    return this.approvalModel
      .find({
        campaignId: new Types.ObjectId(campaignId),
        tenantId: new Types.ObjectId(tenantId),
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Check if all required approvals are met
   */
  async isFullyApproved(
    campaignId: string,
    type: ApprovalType,
    version: number,
    tenantId: string,
  ): Promise<boolean> {
    const approval = await this.getApprovalByVersion(campaignId, type, version, tenantId);
    if (!approval) return false;

    return approval.status === 'approved' && approval.currentApprovals >= approval.requiredApprovals;
  }

  /**
   * Approve by a user
   */
  async approve(
    tenantId: string,
    input: ApproveInput,
  ): Promise<ApprovalDocument> {
    const approval = await this.getApprovalByVersion(
      input.campaignId,
      input.type,
      input.version,
      tenantId,
    );

    if (!approval) {
      throw new NotFoundException(
        `Approval not found for ${input.type} v${input.version} in campaign ${input.campaignId}`,
      );
    }

    if (approval.status === 'rejected') {
      throw new BadRequestException('Cannot approve a rejected approval');
    }

    // Find or add approver
    let approver = approval.approvers.find(a => a.userId === input.userId);
    if (!approver) {
      approver = { userId: input.userId, role: '', approved: true, approvedAt: new Date(), feedback: input.feedback };
      approval.approvers.push(approver);
    } else {
      approver.approved = true;
      approver.approvedAt = new Date();
      approver.feedback = input.feedback;
    }

    // Update approval count
    approval.currentApprovals = approval.approvers.filter(a => a.approved).length;

    // Check if fully approved
    if (approval.currentApprovals >= approval.requiredApprovals) {
      approval.status = 'approved';
      this.logger.log(`[approve] ${input.type} approval fully approved for campaign ${input.campaignId}`, {
        version: input.version,
      });
    }

    await approval.save();

    this.logger.log(`[approve] ${input.type} approval approved by ${input.userId}`, {
      campaignId: input.campaignId,
      version: input.version,
    });

    return approval;
  }

  /**
   * Reject an approval
   */
  async reject(
    tenantId: string,
    input: RejectInput,
  ): Promise<ApprovalDocument> {
    const approval = await this.getApprovalByVersion(
      input.campaignId,
      input.type,
      input.version,
      tenantId,
    );

    if (!approval) {
      throw new NotFoundException(
        `Approval not found for ${input.type} v${input.version} in campaign ${input.campaignId}`,
      );
    }

    approval.status = 'rejected';
    approval.rejectionReason = input.reason;
    approval.rejectedBy = input.userId;
    approval.rejectedAt = new Date();

    await approval.save();

    this.logger.log(`[reject] ${input.type} approval rejected for campaign ${input.campaignId}`, {
      version: input.version,
      reason: input.reason,
    });

    return approval;
  }

  /**
   * Invalidate all downstream approvals when a strategy changes
   * Called when strategy is updated/invalidated
   */
  async invalidateDownstreamApprovals(
    campaignId: string,
    strategyVersion: number,
    tenantId: string,
    invalidatedBy: string,
  ): Promise<void> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign not found: ${campaignId}`);
    }

    // Find all approvals for content, schedule, and ads that depend on this strategy version
    const downstreamApprovals = await this.approvalModel.find({
      campaignId: new Types.ObjectId(campaignId),
      tenantId: new Types.ObjectId(tenantId),
      type: { $in: ['content', 'schedule', 'ads'] },
      status: { $ne: 'needs_review' },
    }).exec();

    for (const approval of downstreamApprovals) {
      // Check if content/schedule depends on strategy version
      if (approval.metadata?.strategyVersion === strategyVersion || !approval.metadata?.strategyVersion) {
        approval.status = 'needs_review';
        approval.invalidatedAt = new Date();
        approval.invalidatedBy = invalidatedBy;
        approval.invalidationReason = `Strategy v${strategyVersion} changed - requires re-review`;
        approval.currentApprovals = 0;
        approval.approvers = approval.approvers.map(a => ({
          ...a,
          approved: false,
          approvedAt: undefined,
        }));

        await approval.save();

        this.logger.log(`[invalidateDownstreamApprovals] Invalidated ${approval.type} approval for campaign ${campaignId}`, {
          strategyVersion,
          approvalType: approval.type,
          approvalVersion: approval.version,
        });
      }
    }
  }

  /**
   * Check if campaign can be published (all required approvals met)
   */
  async canPublish(
    campaignId: string,
    tenantId: string,
  ): Promise<{ canPublish: boolean; blockers: string[] }> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign not found: ${campaignId}`);
    }

    const blockers: string[] = [];

    // Check strategy approval
    const strategyApproved = await this.isFullyApproved(
      campaignId,
      'strategy',
      campaign.strategyVersions?.length || 1,
      tenantId,
    );
    if (!strategyApproved) blockers.push('Strategy requires approval');

    // Check content approval
    const contentApproved = await this.isFullyApproved(
      campaignId,
      'content',
      campaign.contentVersions?.length || 1,
      tenantId,
    );
    if (!contentApproved) blockers.push('Content requires approval');

    // Check schedule approval
    const scheduleApproved = await this.isFullyApproved(
      campaignId,
      'schedule',
      campaign.schedule?.length || 1,
      tenantId,
    );
    if (!scheduleApproved) blockers.push('Schedule requires approval');

    // Check if ads are enabled and require approval
    const adsEnabled = campaign.strategyVersions?.[campaign.strategyVersions.length - 1]?.adsConfig?.enabled;
    if (adsEnabled) {
      const adsApproved = await this.isFullyApproved(
        campaignId,
        'ads',
        campaign.strategyVersions?.length || 1,
        tenantId,
      );
      if (!adsApproved) blockers.push('Ads configuration requires approval');
    }

    return {
      canPublish: blockers.length === 0,
      blockers,
    };
  }

  /**
   * Mark approval as published
   */
  async markAsPublished(
    campaignId: string,
    type: ApprovalType,
    version: number,
    tenantId: string,
    publishedBy: string,
  ): Promise<ApprovalDocument> {
    const approval = await this.getApprovalByVersion(campaignId, type, version, tenantId);
    if (!approval) {
      throw new NotFoundException(
        `Approval not found for ${type} v${version} in campaign ${campaignId}`,
      );
    }

    approval.publishedAt = new Date();
    approval.publishedBy = publishedBy;
    await approval.save();

    this.logger.log(`[markAsPublished] ${type} approval marked as published for campaign ${campaignId}`, {
      version,
    });

    return approval;
  }
}

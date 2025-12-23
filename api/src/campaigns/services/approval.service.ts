import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CampaignDocument } from '../../models/campaign.schema';
import { ApproveDto, RejectDto, ApprovalSection, ApprovalStatus } from '../dto/approval.dto';

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name);

  constructor(
    @InjectModel('Campaign') private readonly campaignModel: Model<CampaignDocument>,
  ) {}

  /**
   * Approve a specific section of a campaign
   */
  async approveSection(dto: ApproveDto, tenantId: string): Promise<CampaignDocument> {
    this.logger.log(`Approving section ${dto.section} for campaign ${dto.campaignId}`);

    const campaign = await this.campaignModel.findOne({ 
      _id: dto.campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${dto.campaignId} not found`);
    }

    // Validate that section can be approved
    const currentStatus = campaign.approvalStates[dto.section];
    if (currentStatus === ApprovalStatus.APPROVED) {
      this.logger.warn(`Section ${dto.section} is already approved`);
      return campaign;
    }

    // Update approval state
    campaign.approvalStates[dto.section] = ApprovalStatus.APPROVED;

    const now = new Date();
    campaign.statusHistory.push({
      status: `approved_${dto.section}`,
      changedAt: now,
      changedBy: dto.userId,
      note: dto.note || `${dto.section} approved`,
    });

    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: dto.userId,
      changes: { approved: dto.section },
      note: dto.note,
    });

    // Check if all sections are approved - if so, update campaign status
    const allApproved = Object.values(campaign.approvalStates).every(
      status => status === ApprovalStatus.APPROVED
    );

    if (allApproved) {
      campaign.status = 'active';
      campaign.statusHistory.push({
        status: 'active',
        changedAt: now,
        changedBy: dto.userId,
        note: 'All sections approved - campaign activated',
      });
      this.logger.log(`All sections approved - campaign ${dto.campaignId} activated`);
    }

    await campaign.save();
    this.logger.log(`Section ${dto.section} approved successfully`);
    return campaign;
  }

  /**
   * Reject a specific section of a campaign
   */
  async rejectSection(dto: RejectDto, tenantId: string): Promise<CampaignDocument> {
    this.logger.log(`Rejecting section ${dto.section} for campaign ${dto.campaignId}`);

    const campaign = await this.campaignModel.findOne({ 
      _id: dto.campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${dto.campaignId} not found`);
    }

    campaign.approvalStates[dto.section] = ApprovalStatus.REJECTED;

    const now = new Date();
    campaign.statusHistory.push({
      status: `rejected_${dto.section}`,
      changedAt: now,
      changedBy: dto.userId,
      note: dto.note || dto.reason,
    });

    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: dto.userId,
      changes: { rejected: dto.section, reason: dto.reason },
      note: dto.note,
    });

    // Set campaign back to draft if any section is rejected
    if (campaign.status === 'active') {
      campaign.status = 'draft';
      campaign.statusHistory.push({
        status: 'draft',
        changedAt: now,
        changedBy: dto.userId,
        note: `Campaign moved to draft due to ${dto.section} rejection`,
      });
    }

    await campaign.save();
    this.logger.log(`Section ${dto.section} rejected`);
    return campaign;
  }

  /**
   * Get approval status for all sections
   */
  async getApprovalStatus(campaignId: string, tenantId: string): Promise<Record<string, string>> {
    const campaign = await this.campaignModel.findOne({ 
      _id: campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    return campaign.approvalStates || {};
  }

  /**
   * Check if campaign is ready for publishing (all sections approved)
   */
  async isReadyForPublishing(campaignId: string, tenantId: string): Promise<boolean> {
    const approvalStates = await this.getApprovalStatus(campaignId, tenantId);
    return Object.values(approvalStates).every(status => status === ApprovalStatus.APPROVED);
  }

  /**
   * Get sections that need review
   */
  async getSectionsNeedingReview(campaignId: string, tenantId: string): Promise<string[]> {
    const approvalStates = await this.getApprovalStatus(campaignId, tenantId);
    return Object.entries(approvalStates)
      .filter(([_, status]) => status === ApprovalStatus.NEEDS_REVIEW || status === ApprovalStatus.PENDING)
      .map(([section, _]) => section);
  }

  /**
   * Reset all approval states to pending (useful when making major changes)
   */
  async resetAllApprovals(campaignId: string, userId: string, tenantId: string): Promise<CampaignDocument> {
    this.logger.log(`Resetting all approvals for campaign ${campaignId}`);

    const campaign = await this.campaignModel.findOne({ 
      _id: campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    campaign.approvalStates = {
      strategy: ApprovalStatus.PENDING,
      content: ApprovalStatus.PENDING,
      schedule: ApprovalStatus.PENDING,
      ads: ApprovalStatus.PENDING,
    };

    const now = new Date();
    campaign.statusHistory.push({
      status: 'draft',
      changedAt: now,
      changedBy: userId,
      note: 'All approvals reset',
    });

    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: userId,
      changes: { resetApprovals: true },
      note: 'All approvals reset',
    });

    campaign.status = 'draft';

    await campaign.save();
    this.logger.log('All approvals reset successfully');
    return campaign;
  }
}

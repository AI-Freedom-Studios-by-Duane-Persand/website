import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, BadRequestException, Patch, Logger } from '@nestjs/common';
import { ApprovalService, ApprovalScope } from './approval.service';
import { ApprovalsService } from './approvals.service';
import { AuthGuard } from '@nestjs/passport';
import { ApprovalDocument } from '../models/approval.model';
import { CreateApprovalInput, ApproveInput, RejectInput } from './approvals.service';

@Controller('campaigns/:campaignId/approvals')
@UseGuards(AuthGuard('jwt'))
export class ApprovalsController {
  private readonly logger = new Logger(ApprovalsController.name);

  constructor(
    private readonly approvalService: ApprovalService,
    private readonly approvalsService: ApprovalsService,
  ) {}

  @Get()
  async getApprovals(@Param('campaignId') campaignId: string) {
    return this.approvalService.getApprovalStatus(campaignId);
  }

  @Post('initialize')
  async initializeApprovals(@Param('campaignId') campaignId: string, @Body() body: { scopes: ApprovalScope[] }) {
    return this.approvalService.initializeApprovals(campaignId, body.scopes);
  }

  @Post(':scope/approve')
  async approve(
    @Param('campaignId') campaignId: string,
    @Param('scope') scope: ApprovalScope,
    @Body() body: { comments?: string },
    @Req() req: any,
  ) {
    return this.approvalService.approve(campaignId, scope, req.user?.id || 'system', body.comments);
  }

  @Post(':scope/reject')
  async reject(
    @Param('campaignId') campaignId: string,
    @Param('scope') scope: ApprovalScope,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    return this.approvalService.reject(campaignId, scope, req.user?.id || 'system', body.reason);
  }

  @Post('check-publish')
  async checkPublish(@Param('campaignId') campaignId: string, @Query('scopes') scopes?: string) {
    const requiredScopes = scopes ? (scopes.split(',') as ApprovalScope[]) : undefined;
    return this.approvalService.canPublish(campaignId, requiredScopes);
  }

  /**
   * V2 Approval Endpoints - Independent approval states for strategy, content, schedule, ads
   */

  /**
   * Create a new approval request for a specific type
   */
  @Post('v2/create')
  async createApprovalV2(
    @Param('campaignId') campaignId: string,
    @Body() input: CreateApprovalInput,
    @Req() req: any,
  ): Promise<ApprovalDocument> {
    this.logger.log(`[createApprovalV2] Creating ${input.type} approval for campaign ${campaignId}`, {
      userId: req.user?.sub,
    });

    return this.approvalsService.createApproval(req.user?.tenantId, { ...input, campaignId }, req.user?.sub);
  }

  /**
   * Get current approval status for campaign
   */
  @Get('v2/list')
  async getApprovalsV2(
    @Param('campaignId') campaignId: string,
    @Req() req: any,
  ): Promise<ApprovalDocument[]> {
    this.logger.log(`[getApprovalsV2] Fetching approvals for campaign ${campaignId}`, {
      tenantId: req.user?.tenantId,
    });

    return this.approvalsService.getApprovalsForCampaign(campaignId, req.user?.tenantId);
  }

  /**
   * Approve an approval request
   */
  @Patch('v2/approve')
  async approveV2(
    @Param('campaignId') campaignId: string,
    @Body() input: ApproveInput,
    @Req() req: any,
  ): Promise<ApprovalDocument> {
    this.logger.log(`[approveV2] Approving ${input.type} for campaign ${campaignId}`, {
      userId: req.user?.sub,
    });

    return this.approvalsService.approve(req.user?.tenantId, {
      ...input,
      campaignId,
      userId: req.user?.sub,
    });
  }

  /**
   * Reject an approval request
   */
  @Patch('v2/reject')
  async rejectV2(
    @Param('campaignId') campaignId: string,
    @Body() input: RejectInput,
    @Req() req: any,
  ): Promise<ApprovalDocument> {
    this.logger.log(`[rejectV2] Rejecting ${input.type} for campaign ${campaignId}`, {
      userId: req.user?.sub,
      reason: input.reason,
    });

    return this.approvalsService.reject(req.user?.tenantId, {
      ...input,
      campaignId,
      userId: req.user?.sub,
    });
  }

  /**
   * Check if campaign can be published (all required approvals met)
   */
  @Get('v2/can-publish')
  async canPublishV2(
    @Param('campaignId') campaignId: string,
    @Req() req: any,
  ): Promise<{ canPublish: boolean; blockers: string[] }> {
    this.logger.log(`[canPublishV2] Checking if campaign ${campaignId} can be published`, {
      tenantId: req.user?.tenantId,
    });

    return this.approvalsService.canPublish(campaignId, req.user?.tenantId);
  }
}

/**
 * Campaigns Controller (Refactored)
 * 
 * Handles HTTP requests for campaign operations.
 * Uses custom decorators (@TenantId, @CurrentUser) to eliminate repetitive validation.
 * 
 * Architecture improvements:
 * - 36 duplicate tenant validations removed
 * - Clean parameter injection using decorators
 * - Controllers are thin - only routing and response handling
 * - Business logic delegated to services
 */

import { Body, Controller, Delete, Get, Param, Patch, Post, Logger, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CampaignsService } from './campaigns.service';
import { StrategyService } from './services/strategy.service';
import { ApprovalService } from './services/approval.service';
import { ScheduleService } from './services/schedule.service';
import { AssetService } from './services/asset.service';
import { ContentService } from './services/content.service';
import { PromptingService } from './services/prompting.service';
import { CreateCampaignDto, AddStrategyVersionDto, AddContentVersionDto, ApproveDto, RejectDto, AddScheduleDto, UpdateScheduleSlotDto, LockScheduleSlotDto, CreateAssetDto, TagAssetDto, ReplaceAssetDto, LinkAssetToVersionDto, AssetType, UserJwt } from '../../../shared';
import { CampaignDocument } from '../models/campaign.schema';
import { SubscriptionGuard } from '../guards/subscription.guard';
import { TenantId, CurrentUser } from '../common/decorators';

@Controller('campaigns')
export class CampaignsController {
  private readonly logger = new Logger(CampaignsController.name);

  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly strategyService: StrategyService,
    private readonly approvalService: ApprovalService,
    private readonly scheduleService: ScheduleService,
    private readonly assetService: AssetService,
    private readonly contentService: ContentService,
    private readonly promptingService: PromptingService,
  ) {}

  @Post()
  @UseGuards(SubscriptionGuard, AuthGuard('jwt'))
  async create(
    @Body() createCampaignDto: any,
    @TenantId() tenantId: string,
  ) {
    this.logger.log('info', {
      message: 'Received payload for campaign creation',
      payload: createCampaignDto,
    });
    if (!createCampaignDto.createdBy) {
      throw new Error('createdBy is required for audit trail');
    }
    return this.campaignsService.create({
      ...createCampaignDto,
      tenantId,
    });
  }

  // Strategy Version endpoints
  @Post(':id/strategy-version')
  @UseGuards(AuthGuard('jwt'))
  async addStrategyVersion(
    @Param('id') id: string,
    @Body() dto: AddStrategyVersionDto,
    @CurrentUser() user: UserJwt,
    @TenantId() tenantId: string,
  ) {
    dto.campaignId = id;
    dto.userId = user.sub;
    return this.strategyService.addStrategyVersion(dto, tenantId);
  }

  @Get(':id/strategy-versions')
  @UseGuards(AuthGuard('jwt'))
  async getAllStrategyVersions(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.strategyService.getAllStrategyVersions(id, tenantId);
  }

  @Get(':id/strategy-version/latest')
  @UseGuards(AuthGuard('jwt'))
  async getLatestStrategyVersion(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.strategyService.getLatestStrategyVersion(id, tenantId);
  }

  // Content Version endpoints
  @Post(':id/content-version')
  @UseGuards(AuthGuard('jwt'))
  async addContentVersion(
    @Param('id') id: string,
    @Body() dto: AddContentVersionDto,
    @CurrentUser() user: UserJwt,
    @TenantId() tenantId: string,
  ) {
    dto.campaignId = id;
    dto.userId = user.sub;
    return this.campaignsService.addContentVersion(id, dto, user.sub, dto.note, tenantId);
  }

  // Approval endpoints
  @Post(':id/approve')
  @UseGuards(AuthGuard('jwt'))
  async approveSection(
    @Body() dto: ApproveDto,
    @CurrentUser() user: UserJwt,
    @TenantId() tenantId: string,
  ) {
    dto.userId = user.sub;
    return this.approvalService.approveSection(dto, tenantId);
  }

  @Post(':id/reject')
  @UseGuards(AuthGuard('jwt'))
  async rejectSection(
    @Body() dto: RejectDto,
    @CurrentUser() user: UserJwt,
    @TenantId() tenantId: string,
  ) {
    dto.userId = user.sub;
    return this.approvalService.rejectSection(dto, tenantId);
  }

  @Get(':id/approval-status')
  @UseGuards(AuthGuard('jwt'))
  async getApprovalStatus(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.approvalService.getApprovalStatus(id, tenantId);
  }

  @Get(':id/ready-to-publish')
  @UseGuards(AuthGuard('jwt'))
  async isReadyForPublishing(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    const ready = await this.approvalService.isReadyForPublishing(id, tenantId);
    return { ready };
  }

  @Get(':id/needs-review')
  @UseGuards(AuthGuard('jwt'))
  async getSectionsNeedingReview(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.approvalService.getSectionsNeedingReview(id, tenantId);
  }

  // Schedule endpoints
  @Post(':id/schedule/generate')
  @UseGuards(AuthGuard('jwt'))
  async generateAutoSchedule(
    @Param('id') id: string,
    @CurrentUser() user: UserJwt,
    @TenantId() tenantId: string,
  ) {
    return this.scheduleService.generateAutoSchedule(id, user.sub, tenantId);
  }

  @Post(':id/schedule/slots')
  @UseGuards(AuthGuard('jwt'))
  async addScheduleSlots(
    @Body() dto: AddScheduleDto,
    @CurrentUser() user: UserJwt,
    @TenantId() tenantId: string,
  ) {
    dto.userId = user.sub;
    return this.scheduleService.addScheduleSlots(dto, tenantId);
  }

  @Get(':id/schedule')
  @UseGuards(AuthGuard('jwt'))
  async getSchedule(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.scheduleService.getSchedule(id, tenantId);
  }

  @Patch(':id/schedule/slot')
  @UseGuards(AuthGuard('jwt'))
  async updateScheduleSlot(
    @Body() dto: UpdateScheduleSlotDto,
    @CurrentUser() user: UserJwt,
    @TenantId() tenantId: string,
  ) {
    dto.userId = user.sub;
    return this.scheduleService.updateScheduleSlot(dto, tenantId);
  }

  @Post(':id/schedule/lock')
  @UseGuards(AuthGuard('jwt'))
  async toggleSlotLock(
    @Body() dto: LockScheduleSlotDto,
    @CurrentUser() user: UserJwt,
    @TenantId() tenantId: string,
  ) {
    dto.userId = user.sub;
    return this.scheduleService.toggleSlotLock(dto, tenantId);
  }

  @Delete(':id/schedule/unlocked')
  @UseGuards(AuthGuard('jwt'))
  async clearUnlockedSlots(
    @Param('id') id: string,
    @CurrentUser() user: UserJwt,
    @TenantId() tenantId: string,
  ) {
    return this.scheduleService.clearUnlockedSlots(id, user.sub, tenantId);
  }

  // Asset endpoints
  @Post(':id/assets')
  @UseGuards(AuthGuard('jwt'))
  async addAsset(
    @Param('id') id: string,
    @Body() dto: CreateAssetDto,
    @CurrentUser() user: UserJwt,
    @TenantId() tenantId: string,
  ) {
    dto.uploadedBy = user.sub;
    return this.assetService.addAsset(id, dto, tenantId);
  }

  @Get(':id/assets')
  @UseGuards(AuthGuard('jwt'))
  async getAssets(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.assetService.getAssets(id, tenantId);
  }

  @Get(':id/assets/tag/:tag')
  @UseGuards(AuthGuard('jwt'))
  async getAssetsByTag(
    @Param('id') id: string,
    @Param('tag') tag: string,
    @TenantId() tenantId: string,
  ) {
    return this.assetService.getAssetsByTag(id, tag, tenantId);
  }

  @Get(':id/assets/type/:type')
  @UseGuards(AuthGuard('jwt'))
  async getAssetsByType(
    @Param('id') id: string,
    @Param('type') type: string,
    @TenantId() tenantId: string,
  ) {
    return this.assetService.getAssetsByType(id, type as AssetType, tenantId);
  }

  @Post(':id/assets/tag')
  @UseGuards(AuthGuard('jwt'))
  async tagAsset(
    @Body() dto: TagAssetDto,
    @CurrentUser() user: UserJwt,
    @TenantId() tenantId: string,
  ) {
    dto.userId = user.sub;
    return this.assetService.tagAsset(dto, tenantId);
  }

  @Post(':id/assets/replace')
  @UseGuards(AuthGuard('jwt'))
  async replaceAsset(
    @Body() dto: ReplaceAssetDto,
    @CurrentUser() user: UserJwt,
    @TenantId() tenantId: string,
  ) {
    dto.userId = user.sub;
    return this.assetService.replaceAsset(dto, tenantId);
  }

  @Post(':id/assets/link')
  @UseGuards(AuthGuard('jwt'))
  async linkAssetToVersion(
    @Body() dto: LinkAssetToVersionDto,
    @CurrentUser() user: UserJwt,
    @TenantId() tenantId: string,
  ) {
    dto.userId = user.sub;
    return this.assetService.linkAssetToVersion(dto, tenantId);
  }

  @Get(':id/assets/unused')
  @UseGuards(AuthGuard('jwt'))
  async getUnusedAssets(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.assetService.getUnusedAssets(id, tenantId);
  }

  @Delete(':id/assets/unused')
  @UseGuards(AuthGuard('jwt'))
  async cleanupUnusedAssets(
    @Param('id') id: string,
    @CurrentUser() user: UserJwt,
    @TenantId() tenantId: string,
  ) {
    return this.assetService.cleanupUnusedAssets(id, user.sub, tenantId);
  }

  // Rollback to a previous revision
  @Post(':id/rollback')
  @UseGuards(AuthGuard('jwt'))
  async rollbackToRevision(
    @Param('id') id: string,
    @Body() body: { revision: number; userId: string; note?: string },
    @TenantId() tenantId: string,
  ) {
    return this.campaignsService.rollbackToRevision(id, body.revision, body.userId, body.note, tenantId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@TenantId() tenantId: string) {
    return this.campaignsService.findAll(tenantId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.campaignsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<CampaignDocument>,
    @CurrentUser() user: UserJwt,
    @TenantId() tenantId: string,
  ) {
    return this.campaignsService.update(id, updateData, tenantId, user.sub);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.campaignsService.delete(id, tenantId);
  }

  // Content Regeneration endpoints
  @Post(':id/content/regenerate')
  @UseGuards(AuthGuard('jwt'))
  async regenerateContent(
    @Param('id') id: string,
    @Body() body: { regenerationType: 'all' | 'text' | 'images' | 'videos'; aiModel?: string; preserveExisting?: boolean },
    @CurrentUser() user: UserJwt,
    @TenantId() tenantId: string,
  ) {
    return this.contentService.regenerateContent({
      campaignId: id,
      userId: user.sub,
      tenantId,
      regenerationType: body.regenerationType,
      aiModel: body.aiModel,
      preserveExisting: body.preserveExisting,
    });
  }

  @Post(':id/content/regenerate-selective')
  @UseGuards(AuthGuard('jwt'))
  async selectiveRegeneration(
    @Param('id') id: string,
    @Body() body: { textOnly?: boolean; imagesOnly?: boolean; videosOnly?: boolean; aiModel?: string },
    @CurrentUser() user: UserJwt,
    @TenantId() tenantId: string,
  ) {
    return this.contentService.selectiveRegeneration({
      campaignId: id,
      userId: user.sub,
      tenantId,
      textOnly: body.textOnly,
      imagesOnly: body.imagesOnly,
      videosOnly: body.videosOnly,
      aiModel: body.aiModel,
    });
  }

  @Get(':id/content/latest')
  @UseGuards(AuthGuard('jwt'))
  async getLatestContentVersion(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.contentService.getLatestContentVersion(id, tenantId);
  }

  @Post(':id/content/replace-assets')
  @UseGuards(AuthGuard('jwt'))
  async replaceAssets(
    @Param('id') id: string,
    @Body() body: { replacements: Array<{ old: string; new: string; type: 'text' | 'image' | 'video' }> },
    @CurrentUser() user: UserJwt,
    @TenantId() tenantId: string,
  ) {
    return this.contentService.replaceAssets(id, tenantId, user.sub, body.replacements);
  }

  // Continuous Prompting endpoints
  @Get(':id/prompts')
  @UseGuards(AuthGuard('jwt'))
  async getCampaignPrompts(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.promptingService.evaluateCampaign(id, tenantId);
  }

  @Post(':id/prompts/resolve')
  @UseGuards(AuthGuard('jwt'))
  async resolvePrompt(
    @Param('id') id: string,
    @Body() body: { field: string; action: 'provide' | 'accept' | 'skip'; value?: any },
    @TenantId() tenantId: string,
  ) {
    return this.promptingService.resolvePrompt(id, tenantId, {
      field: body.field,
      action: body.action,
      value: body.value,
    });
  }
}

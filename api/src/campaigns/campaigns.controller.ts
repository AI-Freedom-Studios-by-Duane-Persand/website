import { Body, Controller, Delete, Get, Param, Patch, Post, Logger, UseGuards, Put, Req, BadRequestException, Query } from '@nestjs/common';
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
  async create(@Body() createCampaignDto: any, @Req() req: any) {
    this.logger.log('info', {
      message: 'Received payload for campaign creation',
      payload: createCampaignDto,
    });
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    if (!createCampaignDto.createdBy) {
      throw new Error('createdBy is required for audit trail');
    }
    return this.campaignsService.create({
      ...createCampaignDto,
      tenantId: user.tenantId,
    });
  }

  // Strategy Version endpoints
  @Post(':id/strategy-version')
  @UseGuards(AuthGuard('jwt'))
  async addStrategyVersion(
    @Param('id') id: string,
    @Body() dto: AddStrategyVersionDto,
    @Req() req: any,
  ) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    dto.campaignId = id;
    dto.userId = user.sub;
    return this.strategyService.addStrategyVersion(dto, user.tenantId);
  }

  @Get(':id/strategy-versions')
  @UseGuards(AuthGuard('jwt'))
  async getAllStrategyVersions(@Param('id') id: string, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.strategyService.getAllStrategyVersions(id, user.tenantId);
  }

  @Get(':id/strategy-version/latest')
  @UseGuards(AuthGuard('jwt'))
  async getLatestStrategyVersion(@Param('id') id: string, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.strategyService.getLatestStrategyVersion(id, user.tenantId);
  }

  // Content Version endpoints
  @Post(':id/content-version')
  @UseGuards(AuthGuard('jwt'))
  async addContentVersion(
    @Param('id') id: string,
    @Body() dto: AddContentVersionDto,
    @Req() req: any,
  ) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    dto.campaignId = id;
    dto.userId = user.sub;
    return this.campaignsService.addContentVersion(id, dto, user.sub, dto.note, user.tenantId);
  }

  // Approval endpoints
  @Post(':id/approve')
  @UseGuards(AuthGuard('jwt'))
  async approveSection(@Body() dto: ApproveDto, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    dto.userId = user.sub;
    return this.approvalService.approveSection(dto, user.tenantId);
  }

  @Post(':id/reject')
  @UseGuards(AuthGuard('jwt'))
  async rejectSection(@Body() dto: RejectDto, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    dto.userId = user.sub;
    return this.approvalService.rejectSection(dto, user.tenantId);
  }

  @Get(':id/approval-status')
  @UseGuards(AuthGuard('jwt'))
  async getApprovalStatus(@Param('id') id: string, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.approvalService.getApprovalStatus(id, user.tenantId);
  }

  @Get(':id/ready-to-publish')
  @UseGuards(AuthGuard('jwt'))
  async isReadyForPublishing(@Param('id') id: string, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    const ready = await this.approvalService.isReadyForPublishing(id, user.tenantId);
    return { ready };
  }

  @Get(':id/needs-review')
  @UseGuards(AuthGuard('jwt'))
  async getSectionsNeedingReview(@Param('id') id: string, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.approvalService.getSectionsNeedingReview(id, user.tenantId);
  }

  // Schedule endpoints
  @Post(':id/schedule/generate')
  @UseGuards(AuthGuard('jwt'))
  async generateAutoSchedule(@Param('id') id: string, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.scheduleService.generateAutoSchedule(id, user.sub, user.tenantId);
  }

  @Post(':id/schedule/slots')
  @UseGuards(AuthGuard('jwt'))
  async addScheduleSlots(@Body() dto: AddScheduleDto, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    dto.userId = user.sub;
    return this.scheduleService.addScheduleSlots(dto, user.tenantId);
  }

  @Get(':id/schedule')
  @UseGuards(AuthGuard('jwt'))
  async getSchedule(@Param('id') id: string, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.scheduleService.getSchedule(id, user.tenantId);
  }

  @Patch(':id/schedule/slot')
  @UseGuards(AuthGuard('jwt'))
  async updateScheduleSlot(@Body() dto: UpdateScheduleSlotDto, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    dto.userId = user.sub;
    return this.scheduleService.updateScheduleSlot(dto, user.tenantId);
  }

  @Post(':id/schedule/lock')
  @UseGuards(AuthGuard('jwt'))
  async toggleSlotLock(@Body() dto: LockScheduleSlotDto, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    dto.userId = user.sub;
    return this.scheduleService.toggleSlotLock(dto, user.tenantId);
  }

  @Delete(':id/schedule/unlocked')
  @UseGuards(AuthGuard('jwt'))
  async clearUnlockedSlots(@Param('id') id: string, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.scheduleService.clearUnlockedSlots(id, user.sub, user.tenantId);
  }

  // Asset endpoints
  @Post(':id/assets')
  @UseGuards(AuthGuard('jwt'))
  async addAsset(@Param('id') id: string, @Body() dto: CreateAssetDto, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    dto.uploadedBy = user.sub;
    return this.assetService.addAsset(id, dto, user.tenantId);
  }

  @Get(':id/assets')
  @UseGuards(AuthGuard('jwt'))
  async getAssets(@Param('id') id: string, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.assetService.getAssets(id, user.tenantId);
  }

  @Get(':id/assets/tag/:tag')
  @UseGuards(AuthGuard('jwt'))
  async getAssetsByTag(@Param('id') id: string, @Param('tag') tag: string, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.assetService.getAssetsByTag(id, tag, user.tenantId);
  }

  @Get(':id/assets/type/:type')
  @UseGuards(AuthGuard('jwt'))
  async getAssetsByType(@Param('id') id: string, @Param('type') type: string, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.assetService.getAssetsByType(id, type as AssetType, user.tenantId);
  }

  @Post(':id/assets/tag')
  @UseGuards(AuthGuard('jwt'))
  async tagAsset(@Body() dto: TagAssetDto, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    dto.userId = user.sub;
    return this.assetService.tagAsset(dto, user.tenantId);
  }

  @Post(':id/assets/replace')
  @UseGuards(AuthGuard('jwt'))
  async replaceAsset(@Body() dto: ReplaceAssetDto, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    dto.userId = user.sub;
    return this.assetService.replaceAsset(dto, user.tenantId);
  }

  @Post(':id/assets/link')
  @UseGuards(AuthGuard('jwt'))
  async linkAssetToVersion(@Body() dto: LinkAssetToVersionDto, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    dto.userId = user.sub;
    return this.assetService.linkAssetToVersion(dto, user.tenantId);
  }

  @Get(':id/assets/unused')
  @UseGuards(AuthGuard('jwt'))
  async getUnusedAssets(@Param('id') id: string, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.assetService.getUnusedAssets(id, user.tenantId);
  }

  @Delete(':id/assets/unused')
  @UseGuards(AuthGuard('jwt'))
  async cleanupUnusedAssets(@Param('id') id: string, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.assetService.cleanupUnusedAssets(id, user.sub, user.tenantId);
  }

  // Rollback to a previous revision
  @Post(':id/rollback')
  @UseGuards(AuthGuard('jwt'))
  async rollbackToRevision(
    @Param('id') id: string,
    @Body() body: { revision: number; userId: string; note?: string },
    @Req() req: any,
  ) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.campaignsService.rollbackToRevision(id, body.revision, body.userId, body.note, user.tenantId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.campaignsService.findAll(user.tenantId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.campaignsService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<CampaignDocument>,
    @Req() req: any,
  ) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.campaignsService.update(id, updateData, user.tenantId, user.sub);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Param('id') id: string, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.campaignsService.delete(id, user.tenantId);
  }

  // Content Regeneration endpoints
  @Post(':id/content/regenerate')
  @UseGuards(AuthGuard('jwt'))
  async regenerateContent(
    @Param('id') id: string,
    @Body() body: { regenerationType: 'all' | 'text' | 'images' | 'videos'; aiModel?: string; preserveExisting?: boolean },
    @Req() req: any,
  ) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.contentService.regenerateContent({
      campaignId: id,
      userId: user.sub,
      tenantId: user.tenantId,
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
    @Req() req: any,
  ) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.contentService.selectiveRegeneration({
      campaignId: id,
      userId: user.sub,
      tenantId: user.tenantId,
      textOnly: body.textOnly,
      imagesOnly: body.imagesOnly,
      videosOnly: body.videosOnly,
      aiModel: body.aiModel,
    });
  }

  @Get(':id/content/latest')
  @UseGuards(AuthGuard('jwt'))
  async getLatestContentVersion(@Param('id') id: string, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.contentService.getLatestContentVersion(id, user.tenantId);
  }

  @Post(':id/content/replace-assets')
  @UseGuards(AuthGuard('jwt'))
  async replaceAssets(
    @Param('id') id: string,
    @Body() body: { replacements: Array<{ old: string; new: string; type: 'text' | 'image' | 'video' }> },
    @Req() req: any,
  ) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.contentService.replaceAssets(id, user.tenantId, user.sub, body.replacements);
  }

  // Continuous Prompting endpoints
  @Get(':id/prompts')
  @UseGuards(AuthGuard('jwt'))
  async getCampaignPrompts(@Param('id') id: string, @Req() req: any) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.promptingService.evaluateCampaign(id, user.tenantId);
  }

  @Post(':id/prompts/resolve')
  @UseGuards(AuthGuard('jwt'))
  async resolvePrompt(
    @Param('id') id: string,
    @Body() body: { field: string; action: 'provide' | 'accept' | 'skip'; value?: any },
    @Req() req: any,
  ) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.promptingService.resolvePrompt(id, user.tenantId, {
      field: body.field,
      action: body.action,
      value: body.value,
    });
  }
}


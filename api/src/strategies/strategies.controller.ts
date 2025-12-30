import { Controller, Post, Get, Body, Param, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { StrategyService, CreateStrategyInput } from './strategy.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('campaigns/:campaignId/strategies')
@UseGuards(AuthGuard('jwt'))
export class StrategiesController {
  constructor(private readonly strategyService: StrategyService) {}

  @Post()
  async createStrategy(@Param('campaignId') campaignId: string, @Body() input: CreateStrategyInput, @Req() req: any) {
    const tenantId = req.user?.tenantId || input.tenantId;
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }

    return this.strategyService.createStrategy(
      { ...input, campaignId, tenantId },
      req.user?.id || 'system',
    );
  }

  @Get('current')
  async getCurrentStrategy(@Param('campaignId') campaignId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.strategyService.getCurrentStrategy(campaignId, tenantId);
  }

  @Get(':version')
  async getStrategyByVersion(@Param('campaignId') campaignId: string, @Param('version') version: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.strategyService.getStrategyByVersion(campaignId, parseInt(version), tenantId);
  }

  @Get()
  async getStrategies(@Param('campaignId') campaignId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.strategyService.getStrategiesForCampaign(campaignId, tenantId);
  }

  @Post(':version/invalidate')
  async invalidateStrategy(
    @Param('campaignId') campaignId: string,
    @Param('version') version: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId;
    return this.strategyService.invalidateStrategy(campaignId, parseInt(version), tenantId, body.reason, req.user?.id || 'system');
  }

  @Post(':version/check-completeness')
  async checkCompleteness(@Param('campaignId') campaignId: string, @Param('version') version: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    const strategy = await this.strategyService.getStrategyByVersion(campaignId, parseInt(version), tenantId);
    return this.strategyService.checkStrategyCompleteness(strategy);
  }
}

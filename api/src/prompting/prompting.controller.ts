import { Controller, Get, Post, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PromptingEngineService } from './prompting-engine.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('campaigns/:campaignId/prompting')
@UseGuards(AuthGuard('jwt'))
export class PromptingController {
  constructor(private readonly promptingService: PromptingEngineService) {}

  @Get('evaluate')
  async evaluateCampaign(@Param('campaignId') campaignId: string) {
    return this.promptingService.evaluateCampaign(campaignId);
  }

  @Get('blockers')
  async getPublishingBlockers(@Param('campaignId') campaignId: string) {
    return this.promptingService.getPublishingBlockers(campaignId);
  }

  @Get('recommendation')
  async getRecommendation(@Param('campaignId') campaignId: string, @Query('field') field: string) {
    return this.promptingService.getRecommendation(campaignId, field);
  }

  @Post('record-response')
  async recordResponse(
    @Param('campaignId') campaignId: string,
    @Query('promptId') promptId: string,
    @Query('response') response: 'skip' | 'accept' | 'provide' | 'later',
  ) {
    await this.promptingService.recordPromptResponse(campaignId, promptId, response);
    return { success: true };
  }
}

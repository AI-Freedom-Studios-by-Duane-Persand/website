import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { MetaAdsService } from './meta-ads.service';

@Controller('meta-ads')
export class MetaAdsController {
  constructor(private readonly metaAdsService: MetaAdsService) {}

  @Get()
  health() {
    return { status: 'ok' };
  }

  @Post('campaigns')
  async createAdCampaign(@Body() campaignData: {
    name: string;
    objective: string;
    status: string;
    dailyBudget: number;
    accountId: string;
  }) {
    return this.metaAdsService.createAdCampaign(campaignData);
  }

  @Get('campaigns/:accountId')
  async getAdCampaigns(@Param('accountId') accountId: string) {
    this.metaAdsService.logMessage('log', `Fetching campaigns for account: ${accountId}`);
    const campaigns = await this.metaAdsService.getAdCampaigns(accountId);
    this.metaAdsService.logMessage('log', `Fetched campaigns: ${JSON.stringify(campaigns)}`);
    return campaigns;
  }

  @Put('campaigns/:campaignId')
  async updateAdCampaign(
    @Param('campaignId') campaignId: string,
    @Body() updateData: { name?: string; status?: string; dailyBudget?: number }
  ) {
    return this.metaAdsService.updateAdCampaign(campaignId, updateData);
  }

  @Delete('campaigns/:campaignId')
  async deleteAdCampaign(@Param('campaignId') campaignId: string) {
    return this.metaAdsService.deleteAdCampaign(campaignId);
  }
}
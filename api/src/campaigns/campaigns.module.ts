
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignSchema } from '../models/campaign.schema';
import { SubscriptionRequiredGuard } from '../auth/subscription-required.guard';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Campaign', schema: CampaignSchema }])],
  providers: [CampaignsService, SubscriptionRequiredGuard],
  controllers: [CampaignsController],
  exports: [CampaignsService],
})
export class CampaignsModule {}

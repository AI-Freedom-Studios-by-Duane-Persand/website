import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelsModule } from '../models/models.module';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignSchema } from '../models/campaign.schema';
import { EnginesModule } from '../engines/engines.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SubscriptionsV2Module } from '../subscriptions/subscriptionsV2.module';
import { StorageModule } from '../storage/storage.module';
import { StrategyService } from './services/strategy.service';
import { ApprovalService } from './services/approval.service';
import { ScheduleService } from './services/schedule.service';
import { AssetService } from './services/asset.service';
import { ContentService } from './services/content.service';
import { PromptingService } from './services/prompting.service';
import { CampaignRepository } from './repositories/campaign.repository';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

@Module({
  imports: [
    EnginesModule,
    ...( (process.env.USE_SUBSCRIPTIONS_V2 ?? 'true').toLowerCase() === 'true'
      ? [SubscriptionsV2Module]
      : [SubscriptionsModule]
    ),
    StorageModule,
    ModelsModule,
    InfrastructureModule,
  ],
  controllers: [CampaignsController],
  providers: [
    CampaignsService,
    CampaignRepository,
    StrategyService,
    ApprovalService,
    ScheduleService,
    AssetService,
    ContentService,
    PromptingService,
  ],
  exports: [
    CampaignsService,
    CampaignRepository,
    StrategyService,
    ApprovalService,
    ScheduleService,
    AssetService,
    ContentService,
    PromptingService,
  ],
})
export class CampaignsModule {}

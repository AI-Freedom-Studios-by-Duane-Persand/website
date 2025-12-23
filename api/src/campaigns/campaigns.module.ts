import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelsModule } from '../models/models.module';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignSchema } from '../models/campaign.schema';
import { EnginesModule } from '../engines/engines.module'; // Import EnginesModule
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { StorageModule } from '../storage/storage.module';
import { StrategyService } from './services/strategy.service';
import { ApprovalService } from './services/approval.service';
import { ScheduleService } from './services/schedule.service';
import { AssetService } from './services/asset.service';

@Module({
  imports: [
    EnginesModule, // Add EnginesModule to imports
    SubscriptionsModule, // Import SubscriptionsModule to provide SubscriptionsService
    StorageModule, // Import StorageModule to provide StorageService
    ModelsModule,
  ],
  controllers: [CampaignsController],
  providers: [
    CampaignsService,
    StrategyService,
    ApprovalService,
    ScheduleService,
    AssetService,
  ],
  exports: [
    CampaignsService,
    StrategyService,
    ApprovalService,
    ScheduleService,
    AssetService,
  ],
})
export class CampaignsModule {}

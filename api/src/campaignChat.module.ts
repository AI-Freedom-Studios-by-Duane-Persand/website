import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelsModule } from './models/models.module';
import { StorageModule } from './storage/storage.module';
import { WebsiteInsightsService } from './integrations/website-insights.service';
import { CampaignChatController } from './controllers/campaignChat.controller';
import { CampaignChatService } from './services/campaignChat.service';
import { CampaignSessionSchema } from './models/campaignSession.schema';
import { CampaignMessageSchema } from './models/campaignMessage.schema';
import { CampaignsModule } from './campaigns/campaigns.module';
import { EnginesModule } from './engines/engines.module';
import { CreativesModule } from './creatives/creatives.module';

@Module({
  imports: [
    forwardRef(() => CampaignsModule),
    forwardRef(() => EnginesModule),
    forwardRef(() => CreativesModule),
    ModelsModule,
    StorageModule,
  ],
  controllers: [CampaignChatController],
  providers: [CampaignChatService, WebsiteInsightsService],
  exports: [CampaignChatService],
})
export class CampaignChatModule {}

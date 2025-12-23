import { Module } from '@nestjs/common';
import { CampaignChatController } from './controllers/campaignChat.controller';
import { CampaignChatService } from './services/campaignChat.service';

@Module({
  imports: [],
  controllers: [
    CampaignChatController,
  ],
  providers: [
    CampaignChatService,
  ],
})
export class AppModule {}
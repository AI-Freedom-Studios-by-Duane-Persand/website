// api/src/scheduling/scheduling.module.ts

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulingService } from './scheduling.service';
import { SchedulingController } from './scheduling.controller';
import { AyrsharePublisher } from './social-publisher/ayrshare.publisher';
import { MetaDirectPublisher } from './social-publisher/meta-direct.publisher';
import { ConfigService } from '../integrations/config.service';
import { ModelsModule } from '../models/models.module';
import { SocialAccountsModule } from '../social/social-accounts.module';

@Module({
  imports: [ScheduleModule, ModelsModule, SocialAccountsModule],
  providers: [SchedulingService, AyrsharePublisher, MetaDirectPublisher, ConfigService],
  controllers: [SchedulingController],
  exports: [SchedulingService],
})
export class SchedulingModule {}

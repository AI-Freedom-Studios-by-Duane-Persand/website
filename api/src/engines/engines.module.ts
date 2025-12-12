// api/src/engines/engines.module.ts


import { Module } from '@nestjs/common';
import { EnginesService } from './engines.service';
import { EnginesController } from './engines.controller';
import { ConfigService } from '../integrations/config.service';
import { GeminiClient } from './gemini.client';
import { MongooseModule } from '@nestjs/mongoose';
import { EngineRun, EngineRunSchema } from '../models/engineRun.model';
import { Subscription, SubscriptionSchema } from '../models/subscriptionV2.model';
import { Package, PackageSchema } from '../models/package.model';
import { SubscriptionRequiredGuard } from '../auth/subscription-required.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EngineRun.name, schema: EngineRunSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Package.name, schema: PackageSchema },
    ]),
  ],
  providers: [EnginesService, ConfigService, GeminiClient, SubscriptionRequiredGuard],
  controllers: [EnginesController],
  exports: [EnginesService],
})
export class EnginesModule {}

import { MongooseModule } from '@nestjs/mongoose';
import { Subscription, SubscriptionSchema } from '../models/subscriptionV2.model';
import { Package, PackageSchema } from '../models/package.model';
// api/src/storage/storage.module.ts

import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ConfigService } from '../integrations/config.service';
import { StorageController } from './storage.controller';
import { SubscriptionRequiredGuard } from '../auth/subscription-required.guard';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ModelsModule } from '../models/models.module';

@Module({
  imports: [
    SubscriptionsModule,
    ModelsModule,
  ],
  providers: [StorageService, ConfigService, SubscriptionRequiredGuard],
  controllers: [StorageController],
  exports: [StorageService],
})
export class StorageModule {}

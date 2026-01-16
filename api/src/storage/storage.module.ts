import { MongooseModule } from '@nestjs/mongoose';
import { Subscription, SubscriptionSchema } from '../models/subscriptionV2.model';
import { Package, PackageSchema } from '../models/package.model';
// api/src/storage/storage.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ConfigService } from '../integrations/config.service';
import { StorageController } from './storage.controller';
import { SubscriptionRequiredGuard } from '../auth/subscription-required.guard';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SubscriptionsV2Module } from '../subscriptions/subscriptionsV2.module';
import { ModelsModule } from '../models/models.module';

@Module({
  imports: [
    forwardRef(() => ((process.env.USE_SUBSCRIPTIONS_V2 ?? 'true').toLowerCase() === 'true'
      ? SubscriptionsV2Module
      : SubscriptionsModule
    )),
    ModelsModule,
  ],
  providers: [StorageService, ConfigService, SubscriptionRequiredGuard],
  controllers: [StorageController],
  exports: [StorageService],
})
export class StorageModule {}

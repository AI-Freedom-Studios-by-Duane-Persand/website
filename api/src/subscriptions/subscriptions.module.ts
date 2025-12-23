// api/src/subscriptions/subscriptions.module.ts
import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelsModule } from '../models/models.module';
import { Subscription, SubscriptionSchema } from '../models/subscriptionV2.model';

@Module({
  imports: [ModelsModule],
  providers: [SubscriptionsService],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

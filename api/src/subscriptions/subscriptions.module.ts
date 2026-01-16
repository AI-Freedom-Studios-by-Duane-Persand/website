// api/src/subscriptions/subscriptions.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelsModule } from '../models/models.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { Subscription, SubscriptionSchema } from '../models/subscriptionV2.model';
import { SubscriptionRepository } from './repositories/subscription.repository';

@Module({
  imports: [ModelsModule, forwardRef(() => InfrastructureModule)],
  providers: [SubscriptionsService, SubscriptionRepository],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

// SubscriptionsModule scaffold
import { Module } from '@nestjs/common';
import { SubscriptionsService } from './src/subscriptions/subscriptions.service';
import { SubscriptionsController } from './src/subscriptions/subscriptions.controller';

@Module({
  providers: [SubscriptionsService],
  controllers: [SubscriptionsController],
})
export class SubscriptionsModule {}

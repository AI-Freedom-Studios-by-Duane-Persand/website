/**
 * Subscriptions Module - Barrel Export
 * 
 * Centralizes exports for the subscriptions feature module.
 * 
 * @example
 * import { SubscriptionsService, CreateSubscriptionDto, SubscriptionStatus } from '@app/subscriptions';
 */

// Module, Controller, Service
export { SubscriptionsModule } from './subscriptions.module';
export { SubscriptionsService } from './subscriptions.service';
export { SubscriptionsController } from './subscriptions.controller';

// Repository
export { SubscriptionRepository } from './repositories/subscription.repository';

// DTOs
export { 
  CreateSubscriptionDto, 
  UpdateSubscriptionDto,
  SubscriptionStatus
} from './dtos/subscription.dto';

export { Subscription as SubscriptionV2Dto } from './dtos/subscriptionV2.dto';

// Schemas
export { SubscriptionDocument, SubscriptionSchema } from './schemas/subscription.schema';

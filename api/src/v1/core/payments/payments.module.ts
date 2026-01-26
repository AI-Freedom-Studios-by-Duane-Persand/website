import { Module } from '@nestjs/common';
import { BillingModule as LegacyBillingModule } from '../../../billing/billing.module';
import { SubscriptionsV2Module as LegacySubscriptionsV2Module } from '../../../subscriptions/subscriptionsV2.module';

/**
 * PaymentsModule (V1)
 * 
 * Wraps existing billing and subscriptions modules for v1 API structure.
 * Consolidates payment-related functionality under unified module.
 * 
 * Features:
 * - Subscription management
 * - Billing and invoicing
 * - Payment processing
 */
@Module({
  imports: [LegacyBillingModule, LegacySubscriptionsV2Module],
  exports: [LegacyBillingModule, LegacySubscriptionsV2Module],
})
export class PaymentsModule {}

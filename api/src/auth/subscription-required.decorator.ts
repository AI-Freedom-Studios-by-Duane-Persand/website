// api/src/auth/subscription-required.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const SubscriptionRequired = (...features: string[]) => SetMetadata('subscriptionFeatures', features);

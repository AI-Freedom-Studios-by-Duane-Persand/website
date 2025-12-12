import { PartialType } from '@nestjs/mapped-types';
import { Subscription } from './types';

export type CreateSubscriptionDto = Omit<Subscription, '_id' | 'createdAt' | 'updatedAt'>;
export class UpdateSubscriptionDto extends PartialType(Object) {}

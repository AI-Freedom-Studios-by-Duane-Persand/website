import { Subscription } from './types';
export type CreateSubscriptionDto = Omit<Subscription, '_id' | 'createdAt' | 'updatedAt'>;
declare const UpdateSubscriptionDto_base: import("@nestjs/mapped-types").MappedType<Partial<Object>>;
export declare class UpdateSubscriptionDto extends UpdateSubscriptionDto_base {
}
export {};
//# sourceMappingURL=subscription.dto.d.ts.map
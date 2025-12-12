import { Document, Types } from 'mongoose';
export type SubscriptionDocument = Subscription & Document;
export declare class Subscription {
    userId: string;
    packageId: string;
    status: 'active' | 'pending' | 'cancelled' | 'expired';
    stripeSessionId?: string;
    paymentLink?: string;
    validUntil?: Date;
}
export declare const SubscriptionSchema: import("mongoose").Schema<Subscription, import("mongoose").Model<Subscription, any, any, any, Document<unknown, any, Subscription> & Omit<Subscription & {
    _id: Types.ObjectId;
}, never>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Subscription, Document<unknown, {}, import("mongoose").FlatRecord<Subscription>> & Omit<import("mongoose").FlatRecord<Subscription> & {
    _id: Types.ObjectId;
}, never>>;
//# sourceMappingURL=subscriptionV2.model.d.ts.map
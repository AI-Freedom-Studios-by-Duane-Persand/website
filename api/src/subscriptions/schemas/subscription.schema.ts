// api/src/subscriptions/schemas/subscription.schema.ts
import { Schema, Document, Types } from 'mongoose';

export interface SubscriptionDocument extends Document {
  tenantId: Types.ObjectId;
  planId: string;
  status: 'pending' | 'active' | 'expired' | 'canceled';
  billingInterval: 'monthly' | 'yearly';
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  lastStripePaymentId: string | null;
  amountPaid: number | null;
  currency: string | null;
  pendingCheckoutSessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const SubscriptionSchema = new Schema<SubscriptionDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  planId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'active', 'expired', 'canceled'], required: true },
  billingInterval: { type: String, enum: ['monthly', 'yearly'], required: true },
  currentPeriodStart: { type: Date, default: null },
  currentPeriodEnd: { type: Date, default: null },
  lastStripePaymentId: { type: String, default: null },
  amountPaid: { type: Number, default: null },
  currency: { type: String, default: null },
  pendingCheckoutSessionId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Do not export a compiled model here. Use MongooseModule.forFeature in modules.

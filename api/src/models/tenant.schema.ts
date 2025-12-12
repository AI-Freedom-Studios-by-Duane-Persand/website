// api/src/models/tenant.schema.ts
import { Schema, Document, model } from 'mongoose';

export interface TenantDocument extends Document {
  name: string;
  planId: string | null;
  stripeCustomerId: string | null;
  subscriptionStatus: 'active' | 'expired' | 'pending' | 'none';
  createdAt: Date;
  updatedAt: Date;
}

export const TenantSchema = new Schema<TenantDocument>({
  name: { type: String, required: true },
  planId: { type: String, default: null },
  stripeCustomerId: { type: String, default: null },
  subscriptionStatus: { type: String, enum: ['active', 'expired', 'pending', 'none'], default: 'none' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Do not export TenantModel directly; use MongooseModule.forFeature in your module instead.

// Mongoose schemas/models for core collections
import { Schema } from 'mongoose';

export const TenantSchema = new Schema({
  name: { type: String, required: true },
  domain: { type: String, required: true },
  ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
}, { timestamps: true });

export const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  roles: [{ type: String }],
}, { timestamps: true });

export const SubscriptionSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  plan: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'canceled'], required: true },
  stripeSessionId: { type: String },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

export const CampaignSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['draft', 'active', 'completed'], required: true },
  startDate: { type: Date },
  endDate: { type: Date },
}, { timestamps: true });

export const CreativeSchema = new Schema({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  type: { type: String, enum: ['image', 'video', 'text'], required: true },
  assetUrl: { type: String },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

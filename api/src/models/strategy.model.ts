import { Schema, Document, Types } from 'mongoose';

export interface StrategyDocument extends Document {
  tenantId: Types.ObjectId;
  campaignId: Types.ObjectId;
  version: number;
  platforms: string[];
  goals: string[];
  targetAudience: string;
  contentPillars: string[];
  brandTone: string;
  constraints?: string;
  cadence: string;
  adsConfig?: {
    enabled: boolean;
    budget?: number;
    bidStrategy?: string;
    optimization?: string;
    [key: string]: any;
  };
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  invalidated: boolean;
  invalidatedAt?: Date;
  invalidatedBy?: string;
  invalidationReason?: string;
}

export const StrategySchema = new Schema<StrategyDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  version: { type: Number, required: true },
  platforms: { type: [String], required: true },
  goals: { type: [String], required: true },
  targetAudience: { type: String, required: true },
  contentPillars: { type: [String], required: true },
  brandTone: { type: String, required: true },
  constraints: { type: String },
  cadence: { type: String, required: true },
  adsConfig: { type: Object },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
  invalidated: { type: Boolean, default: false },
  invalidatedAt: { type: Date },
  invalidatedBy: { type: String },
  invalidationReason: { type: String },
});

// Indexes
StrategySchema.index({ tenantId: 1, campaignId: 1, version: -1 });
StrategySchema.index({ campaignId: 1, invalidated: 1 });

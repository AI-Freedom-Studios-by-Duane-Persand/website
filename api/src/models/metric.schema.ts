// api/src/models/metric.schema.ts
import { Schema, Document, model, Types } from 'mongoose';

export interface MetricDocument extends Document {
  tenantId: Types.ObjectId;
  campaignId: Types.ObjectId | null;
  creativeId: Types.ObjectId | null;
  platform: string;
  platformObjectId: string;
  date: Date;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  raw: any;
  createdAt: Date;
}

export const MetricSchema = new Schema<MetricDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', default: null },
  creativeId: { type: Schema.Types.ObjectId, ref: 'Creative', default: null },
  platform: { type: String, required: true },
  platformObjectId: { type: String, required: true },
  date: { type: Date, required: true },
  impressions: { type: Number, required: true },
  clicks: { type: Number, required: true },
  conversions: { type: Number, required: true },
  spend: { type: Number, required: true },
  revenue: { type: Number, required: true },
  raw: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export const MetricModel = model<MetricDocument>('Metric', MetricSchema);

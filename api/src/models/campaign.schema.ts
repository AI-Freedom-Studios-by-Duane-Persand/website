// api/src/models/campaign.schema.ts
import { Schema, Document, model, Types } from 'mongoose';

export interface CampaignDocument extends Document {
  tenantId: Types.ObjectId;
  name: string;
  objective: 'awareness' | 'traffic' | 'leads' | 'sales';
  budget: number | null;
  startDate: Date | null;
  endDate: Date | null;
  status: 'draft' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export const CampaignSchema = new Schema<CampaignDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  objective: { type: String, enum: ['awareness', 'traffic', 'leads', 'sales'], required: true },
  budget: { type: Number, default: null },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  status: { type: String, enum: ['draft', 'active', 'completed'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const CampaignModel = model<CampaignDocument>('Campaign', CampaignSchema);

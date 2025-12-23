import { Schema, model, Document, Types } from 'mongoose';

export interface CampaignSessionDocument extends Document {
  campaignId?: Types.ObjectId;
  userId: Types.ObjectId | string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  state: string; // JSON stringified state for chatbot flow
}

export const CampaignSessionSchema = new Schema<CampaignSessionDocument>({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: false },
  userId: { type: Schema.Types.Mixed, required: true },
  tenantId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  state: { type: String, default: '{}' },
});

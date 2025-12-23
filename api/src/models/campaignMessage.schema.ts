import { Schema, model, Document, Types } from 'mongoose';

export interface CampaignMessageDocument extends Document {
  sessionId: Types.ObjectId;
  sender: 'user' | 'system';
  message: string;
  createdAt: Date;
  step?: string; // e.g., 'platforms', 'goals', etc.
}

export const CampaignMessageSchema = new Schema<CampaignMessageDocument>({
  sessionId: { type: Schema.Types.ObjectId, ref: 'CampaignSession', required: true },
  sender: { type: String, enum: ['user', 'system'], required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  step: { type: String, required: false, default: '' },
});

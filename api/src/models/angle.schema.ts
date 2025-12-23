// api/src/models/angle.schema.ts
import { Schema, Document, model, Types } from 'mongoose';

export interface AngleDocument extends Document {
  campaignId: Types.ObjectId;
  title: string;
  description: string;
  funnelStage: 'TOFU' | 'MOFU' | 'BOFU';
  createdAt: Date;
  updatedAt: Date;
}

export const AngleSchema = new Schema<AngleDocument>({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  funnelStage: { type: String, enum: ['TOFU', 'MOFU', 'BOFU'], required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Do not export compiled model. Use MongooseModule.forFeature in modules.

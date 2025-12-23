// api/src/models/engineRun.schema.ts
import { Schema, Document, model, Types } from 'mongoose';

export interface EngineRunDocument extends Document {
  tenantId: Types.ObjectId | null;
  campaignId: Types.ObjectId | null;
  engineName: string;
  version: string;
  input: any;
  output: any;
  score?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const EngineRunSchema = new Schema<EngineRunDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', default: null },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', default: null },
  engineName: { type: String, required: true },
  version: { type: String, required: true },
  input: { type: Schema.Types.Mixed, required: true },
  output: { type: Schema.Types.Mixed, required: true },
  score: { type: Number },
  updatedAt: { type: Date, default: Date.now },
});

// Do not export compiled model. Use MongooseModule.forFeature in modules.

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
}

export const EngineRunSchema = new Schema<EngineRunDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', default: null },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', default: null },
  engineName: { type: String, required: true },
  version: { type: String, required: true },
  input: { type: Schema.Types.Mixed, required: true },
  output: { type: Schema.Types.Mixed, required: true },
  score: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

export const EngineRunModel = model<EngineRunDocument>('EngineRun', EngineRunSchema);

// api/src/models/experiment.schema.ts
import { Schema, Document, model, Types } from 'mongoose';

export interface ExperimentDocument extends Document {
  campaignId: Types.ObjectId;
  hypothesis: string;
  creativeIds: Types.ObjectId[];
  status: 'running' | 'completed' | 'paused';
  resultsSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ExperimentSchema = new Schema<ExperimentDocument>({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  hypothesis: { type: String, required: true },
  creativeIds: [{ type: Schema.Types.ObjectId, ref: 'Creative', required: true }],
  status: { type: String, enum: ['running', 'completed', 'paused'], required: true },
  resultsSummary: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Do not export compiled model. Use MongooseModule.forFeature in modules.

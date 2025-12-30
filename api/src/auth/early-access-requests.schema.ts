// api/src/auth/early-access-requests.schema.ts
import { Schema, Document } from 'mongoose';

export interface EarlyAccessRequestDocument extends Document {
  email: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export const EarlyAccessRequestSchema = new Schema<EarlyAccessRequestDocument>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  requestedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  notes: { type: String },
});

EarlyAccessRequestSchema.index({ email: 1 }, { unique: true });

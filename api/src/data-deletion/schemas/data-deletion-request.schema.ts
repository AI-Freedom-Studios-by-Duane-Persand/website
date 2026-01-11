import { Schema } from 'mongoose';

export const DataDeletionRequestSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    reason: { type: String },
    requestedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

DataDeletionRequestSchema.index({ email: 1 });
DataDeletionRequestSchema.index({ status: 1 });
DataDeletionRequestSchema.index({ requestedAt: -1 });

// api/src/models/scheduledItem.schema.ts
import { Schema, Document, model, Types } from 'mongoose';

export interface ScheduledItemDocument extends Document {
  tenantId: Types.ObjectId;
  creativeId: Types.ObjectId;
  platform: string;
  channelType: 'organic' | 'ad';
  publisher: 'ayrshare' | 'metaDirect';
  scheduledAt: Date;
  status: 'pending' | 'inProgress' | 'published' | 'failed';
  platformPostId?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ScheduledItemSchema = new Schema<ScheduledItemDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  creativeId: { type: Schema.Types.ObjectId, ref: 'Creative', required: true },
  platform: { type: String, required: true },
  channelType: { type: String, enum: ['organic', 'ad'], required: true },
  publisher: { type: String, enum: ['ayrshare', 'metaDirect'], required: true },
  scheduledAt: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'inProgress', 'published', 'failed'], default: 'pending' },
  platformPostId: { type: String },
  error: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Do not export compiled model. Use MongooseModule.forFeature in modules.

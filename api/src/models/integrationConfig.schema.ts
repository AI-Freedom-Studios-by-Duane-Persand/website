// api/src/models/integrationConfig.schema.ts
import { Schema, Document, model, Types } from 'mongoose';

export interface IntegrationConfigDocument extends Document {
  scope: 'global' | 'tenant';
  tenantId: Types.ObjectId | null;
  service: 'gemini' | 'json2video' | 'ayrshare' | 'r2' | 'stripe' | 'meta';
  config: string;
  createdAt: Date;
  updatedAt: Date;
}

export const IntegrationConfigSchema = new Schema<IntegrationConfigDocument>({
  scope: { type: String, enum: ['global', 'tenant'], required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', default: null },
  service: { type: String, enum: ['gemini', 'json2video', 'ayrshare', 'r2', 'stripe', 'meta'], required: true },
  config: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const IntegrationConfigModel = model<IntegrationConfigDocument>('IntegrationConfig', IntegrationConfigSchema);

import { Schema } from 'mongoose';

export const AssetSchema = new Schema({
  tenantId: String,
  url: String,
  filename: String,
  uploadedAt: { type: Date, default: Date.now },
});

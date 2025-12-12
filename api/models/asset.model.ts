import { Schema, model } from 'mongoose';

const AssetSchema = new Schema({
  tenantId: String,
  url: String,
  filename: String,
  uploadedAt: { type: Date, default: Date.now },
});

export const AssetModel = model('Asset', AssetSchema);

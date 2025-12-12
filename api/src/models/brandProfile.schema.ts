// api/src/models/brandProfile.schema.ts
import { Schema, Document, model, Types } from 'mongoose';

export interface BrandProfileDocument extends Document {
  tenantId: Types.ObjectId;
  name: string;
  voiceGuidelines: string;
  targetAudiences: string[];
  brandAssets: {
    logos: string[];
    primaryColor?: string;
    secondaryColor?: string;
    fonts?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const BrandProfileSchema = new Schema<BrandProfileDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  voiceGuidelines: { type: String, required: true },
  targetAudiences: [{ type: String, required: true }],
  brandAssets: {
    logos: [{ type: String, required: true }],
    primaryColor: { type: String },
    secondaryColor: { type: String },
    fonts: [{ type: String }],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const BrandProfileModel = model<BrandProfileDocument>('BrandProfile', BrandProfileSchema);

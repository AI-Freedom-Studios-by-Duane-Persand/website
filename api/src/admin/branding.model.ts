import { Schema, Document } from 'mongoose';

export interface BrandingConfig extends Document {
  logoUrl: string;
  faviconUrl: string;
}

export const BrandingConfigSchema = new Schema<BrandingConfig>({
  logoUrl: { type: String, default: '' },
  faviconUrl: { type: String, default: '' },
});
// Do not export compiled model. Use MongooseModule.forFeature in modules.

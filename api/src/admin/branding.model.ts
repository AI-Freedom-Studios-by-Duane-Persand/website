import { Schema, model, Document } from 'mongoose';

export interface BrandingConfig extends Document {
  logoUrl: string;
  faviconUrl: string;
}

const BrandingConfigSchema = new Schema<BrandingConfig>({
  logoUrl: { type: String, default: '' },
  faviconUrl: { type: String, default: '' },
});

export const BrandingConfigModel = model<BrandingConfig>('BrandingConfig', BrandingConfigSchema);
export { BrandingConfigSchema };

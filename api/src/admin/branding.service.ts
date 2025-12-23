import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BrandingConfig } from './branding.model';

@Injectable()
export class BrandingService {
  constructor(
    @InjectModel('BrandingConfig') private readonly brandingConfigModel: Model<BrandingConfig>,
  ) {}

  async updateLogo(logoUrl: string) {
    await this.brandingConfigModel.updateOne({}, { $set: { logoUrl } }, { upsert: true });
  }

  async updateFavicon(faviconUrl: string) {
    await this.brandingConfigModel.updateOne({}, { $set: { faviconUrl } }, { upsert: true });
  }

  async getConfig(): Promise<BrandingConfig> {
    const config = await this.brandingConfigModel.findOne({});
    if (config) return config;
    return new this.brandingConfigModel({ logoUrl: '', faviconUrl: '' });
  }
}

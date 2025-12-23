import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService, encryptConfig } from './config.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IntegrationConfigDocument } from '../models/integrationConfig.schema';

@Injectable()
export class IntegrationConfigSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger('IntegrationConfigSeedService');

  constructor(
    private readonly configService: ConfigService,
    @InjectModel('IntegrationConfig') private readonly integrationConfigModel: Model<IntegrationConfigDocument>,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('[IntegrationConfigSeedService] Seeding integration configs if missing...');
    await this.seedR2Config();
    // Add more integration seeds here as needed
  }

  private async seedR2Config() {
    this.logger.log('[IntegrationConfigSeedService] Upserting R2 config from .env...');
    if (!process.env.R2_ACCESS_KEY || !process.env.R2_SECRET_KEY || !process.env.R2_BUCKET || !process.env.R2_S3_ENDPOINT) {
      this.logger.error('[IntegrationConfigSeedService] Missing required R2 env vars (R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET, R2_S3_ENDPOINT). Skipping seed.');
      return;
    }
    try {
      const encryptedConfig = encryptConfig({
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY,
        accountId: process.env.R2_ACCOUNT_ID,
        bucketName: process.env.R2_BUCKET,
        endpoint: process.env.R2_S3_ENDPOINT,
        publicBaseUrl: process.env.R2_S3_ENDPOINT ? `${process.env.R2_S3_ENDPOINT}/${process.env.R2_BUCKET}` : '',
      });
      await this.integrationConfigModel.findOneAndUpdate(
        { scope: 'global', service: 'r2' },
        {
          scope: 'global',
          service: 'r2',
          config: encryptedConfig,
        },
        { upsert: true }
      ).exec();
      this.logger.log('[IntegrationConfigSeedService] Upserted R2 config from env (forced)');
    } catch (err: any) {
      this.logger.error('[IntegrationConfigSeedService] Failed to seed R2 config', err);
      this.logger.error((err as Error).stack);
    }
  }
}

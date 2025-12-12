import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService, encryptConfig } from './config.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IntegrationConfigDocument } from '../models/integrationConfig.schema';

@Injectable()
export class R2ConfigSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger('R2ConfigSeedService');

  constructor(
    private readonly configService: ConfigService,
    @InjectModel('IntegrationConfig') private readonly integrationConfigModel: Model<IntegrationConfigDocument>,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('[R2ConfigSeedService] Starting R2 config seed...');
    this.logger.log('[R2ConfigSeedService] ENV R2_S3_ENDPOINT: ' + process.env.R2_S3_ENDPOINT);
    this.logger.log('[R2ConfigSeedService] ENV R2_ACCESS_KEY: ' + process.env.R2_ACCESS_KEY);
    this.logger.log('[R2ConfigSeedService] ENV R2_SECRET_KEY: ' + (process.env.R2_SECRET_KEY ? '[set]' : '[missing]'));
    this.logger.log('[R2ConfigSeedService] ENV R2_BUCKET: ' + process.env.R2_BUCKET);
    this.logger.log('[R2ConfigSeedService] ENV CONFIG_ENCRYPTION_KEY: ' + (process.env.CONFIG_ENCRYPTION_KEY ? '[set]' : '[missing]'));
    try {
      const encryptedConfig = encryptConfig({
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY,
        accountId: process.env.R2_ACCOUNT_ID,
        bucket: process.env.R2_BUCKET,
        endpoint: process.env.R2_S3_ENDPOINT,
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
      this.logger.log('Upserted R2 config from env');
    } catch (err: any) {
      this.logger.error('Failed to seed R2 config', err);
      this.logger.error((err as Error).stack);
      this.logger.debug('ENV DUMP: R2_ACCESS_KEY=' + (process.env.R2_ACCESS_KEY ? '[set]' : '[missing]'));
      this.logger.debug('ENV DUMP: R2_SECRET_KEY=' + (process.env.R2_SECRET_KEY ? '[set]' : '[missing]'));
      this.logger.debug('ENV DUMP: R2_BUCKET=' + (process.env.R2_BUCKET ? '[set]' : '[missing]'));
      this.logger.debug('ENV DUMP: R2_S3_ENDPOINT=' + (process.env.R2_S3_ENDPOINT ? '[set]' : '[missing]'));
      this.logger.debug('ENV DUMP: CONFIG_ENCRYPTION_KEY=' + (process.env.CONFIG_ENCRYPTION_KEY ? '[set]' : '[missing]'));
    }
  }
}

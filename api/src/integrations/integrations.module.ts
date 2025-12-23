// api/src/integrations/integrations.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ModelsModule } from '../models/models.module';
import { IntegrationConfigSeedService } from './r2-config-seed.service';

@Module({
  imports: [ModelsModule],
  providers: [ConfigService, IntegrationConfigSeedService],
  exports: [ConfigService, ModelsModule],
})
export class IntegrationsModule {}

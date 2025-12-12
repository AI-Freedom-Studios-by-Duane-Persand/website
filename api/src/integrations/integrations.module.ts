// api/src/integrations/integrations.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ModelsModule } from '../models/models.module';
import { R2ConfigSeedService } from './r2-config-seed.service';

@Module({
  imports: [ModelsModule],
  providers: [ConfigService, R2ConfigSeedService],
  exports: [ConfigService],
})
export class IntegrationsModule {}

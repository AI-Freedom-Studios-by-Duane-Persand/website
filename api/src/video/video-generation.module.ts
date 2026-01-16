import { Module } from '@nestjs/common';
import { VideoGenerationService } from './video-generation.service';
import { VideoGenerationController } from './video-generation.controller';
import { ReplicateClient } from '../engines/replicate.client';
import { StorageService } from '../storage/storage.service';
import { PoeClient } from '../engines/poe.client';
import { ModelsModule } from '../models/models.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [ModelsModule, IntegrationsModule],
  providers: [VideoGenerationService, ReplicateClient, StorageService, PoeClient],
  controllers: [VideoGenerationController],
  exports: [VideoGenerationService],
})
export class VideoGenerationModule {}

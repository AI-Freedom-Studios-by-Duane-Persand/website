// api/src\engines/engines.module.ts

/**
 * Engines Module
 * 
 * Provides AI-powered content generation engines.
 * Legacy module - most functionality moved to V1 architecture.
 * 
 * Remaining services:
 * - PoeClient: Direct POE API integration
 * - AIExtractorService: Content extraction utilities
 * - EnginesService: Legacy content routing (deprecated)
 */

import { Module } from '@nestjs/common';
import { EnginesService } from './engines.service';
import { EnginesController } from './engines.controller';
import { ConfigService } from '../integrations/config.service';
import { PoeClient } from './poe.client';
import { ModelsModule } from '../models/models.module';
import { SubscriptionRequiredGuard } from '../auth/subscription-required.guard';
import { IntegrationsModule } from '../integrations/integrations.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { AIExtractorService } from './ai-extractor.service';

@Module({
  imports: [
    IntegrationsModule,
    InfrastructureModule,
    ModelsModule,
  ],
  providers: [
    EnginesService,
    ConfigService,
    PoeClient,
    SubscriptionRequiredGuard,
    AIExtractorService,
  ],
  controllers: [EnginesController],
  exports: [
    EnginesService,
    PoeClient,
    AIExtractorService,
  ],
})
export class EnginesModule {}


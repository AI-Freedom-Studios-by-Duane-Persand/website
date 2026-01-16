// api/src/engines/engines.module.ts

/**
 * Engines Module
 * 
 * Provides AI-powered content generation engines.
 * Engines now depend on port interfaces (IContentGenerator, IStorageProvider)
 * instead of concrete implementations, following hexagonal architecture.
 */

import { Module } from '@nestjs/common';
import { EnginesService } from './engines.service';
import { EnginesController } from './engines.controller';
import { ConfigService } from '../integrations/config.service';
import { PoeClient } from './poe.client';
import { PoeController } from './poe.controller';
import { ReplicateClient } from './replicate.client';
import { ModelsModule } from '../models/models.module';
import { SubscriptionRequiredGuard } from '../auth/subscription-required.guard';
import { StrategyEngine } from './strategy.engine';
import { CopyEngine } from './copy.engine';
import { IntegrationsModule } from '../integrations/integrations.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module'; // Import infrastructure adapters
import { AIModelsService } from './ai-models.service';
import { AIModelsController } from './ai-models.controller';
import { AIExtractorService } from './ai-extractor.service';

@Module({
  imports: [
    IntegrationsModule,
    InfrastructureModule, // Provides IContentGenerator and IStorageProvider adapters
    ModelsModule,
  ],
  providers: [
    EnginesService,
    ConfigService,
    PoeClient,
    ReplicateClient,
    SubscriptionRequiredGuard,
    // Inject adapters into engines
    {
      provide: StrategyEngine,
      useFactory: (contentGenerator: any, storageProvider: any) => {
        return new StrategyEngine(contentGenerator, storageProvider);
      },
      inject: ['IContentGenerator', 'IStorageProvider'],
    },
    {
      provide: CopyEngine,
      useFactory: (contentGenerator: any, storageProvider: any) => {
        return new CopyEngine(contentGenerator, storageProvider);
      },
      inject: ['IContentGenerator', 'IStorageProvider'],
    },
    AIModelsService,
    AIExtractorService,
  ],
  controllers: [EnginesController, AIModelsController, PoeController],
  exports: [
    EnginesService,
    StrategyEngine,
    CopyEngine,
    PoeClient,
    ReplicateClient,
    AIModelsService,
    AIExtractorService,
  ],
})
export class EnginesModule {}


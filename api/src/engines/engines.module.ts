// api/src/engines/engines.module.ts


import { Module } from '@nestjs/common';
import { EnginesService } from './engines.service';
import { EnginesController } from './engines.controller';
import { ConfigService } from '../integrations/config.service';
import { PoeClient } from './poe.client';
import { PoeController } from './poe.controller';
import { ReplicateClient } from './replicate.client';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelsModule } from '../models/models.module';
import { EngineRun, EngineRunSchema } from '../models/engineRun.model';
import { Subscription, SubscriptionSchema } from '../models/subscriptionV2.model';
import { Package, PackageSchema } from '../models/package.model';
import { SubscriptionRequiredGuard } from '../auth/subscription-required.guard';
import { StrategyEngine } from './strategy.engine';
import { CopyEngine } from './copy.engine';
import { IntegrationsModule } from '../integrations/integrations.module'; // Importing IntegrationsModule
import { StorageModule } from '../storage/storage.module'; // Importing StorageModule
import { AIModelsService } from './ai-models.service'; // Importing AIModelsService
import { AIModelsController } from './ai-models.controller'; // Importing AIModelsController
import { AIExtractorService } from './ai-extractor.service'; // AI-powered conversation extractor


@Module({
  imports: [
    IntegrationsModule, // Imported IntegrationsModule to access IntegrationConfigModel
    StorageModule, // Import StorageModule to provide StorageService
    ModelsModule,
  ],
  providers: [
    EnginesService,
    ConfigService,
    PoeClient,
    ReplicateClient,
    SubscriptionRequiredGuard,
    StrategyEngine, // Added StrategyEngine
    CopyEngine, // Added CopyEngine
    AIModelsService, // Added AIModelsService to providers
    AIExtractorService, // AI conversation extractor
  ],
  controllers: [EnginesController, AIModelsController, PoeController],
  exports: [
    EnginesService,
    StrategyEngine, // Exported StrategyEngine
    CopyEngine, // Exported CopyEngine
    PoeClient, // Exported PoeClient for external use
    ReplicateClient, // Exported ReplicateClient for external use
    AIModelsService, // Exported AIModelsService for external use
    AIExtractorService, // Exported AI conversation extractor
  ],
})
export class EnginesModule {}

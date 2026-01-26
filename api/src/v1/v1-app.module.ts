import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { FeaturesModule } from './features/features.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';

/**
 * V1AppModule
 * 
 * Main application module for the /v1/ API.
 * Orchestrates all core, feature, and infrastructure modules.
 * 
 * Module Organization:
 * 
 * ├── CoreModule
 * │   ├── AuthModuleV1
 * │   ├── PaymentsModule (Billing + Subscriptions)
 * │   ├── TenantsModuleV1
 * │   ├── ContentModule (AI Content Service Client)
 * │   └── EnginesModuleV1
 * │
 * ├── FeaturesModule
 * │   ├── CampaignsModuleV1
 * │   ├── CreativesModuleV1
 * │   └── SocialModuleV1
 * │       ├── MetaPlatformModule
 * │       ├── TiktokPlatformModule
 * │       └── LinkedinPlatformModule
 * │
 * └── InfrastructureModule
 *     ├── StorageModule (R2 with tenant isolation)
 *     └── Integrations (external services)
 * 
 * Architecture Benefits:
 * - Clean separation of concerns (Core/Features/Infrastructure)
 * - Modular design allows independent scaling
 * - Clear dependency flow (Infrastructure < Core < Features)
 * - Easy to extend with new features or platforms
 * - Backward compatible with existing monolithic structure
 * - Ready for microservice extraction
 */
@Module({
  imports: [CoreModule, FeaturesModule, InfrastructureModule],
  exports: [CoreModule, FeaturesModule, InfrastructureModule],
})
export class V1AppModule {}

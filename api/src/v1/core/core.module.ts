import { Module } from '@nestjs/common';
import { AuthModuleV1 } from './auth/auth.module';
import { PaymentsModule } from './payments/payments.module';
import { TenantsModuleV1 } from './tenants/tenants.module';
import { ContentModule } from './content/content.module';
import { EnginesModuleV1 } from './engines/engines.module';

/**
 * CoreModule
 * 
 * Aggregates all core functionality modules for v1 API.
 * 
 * Sub-modules:
 * - AuthModuleV1: Authentication and authorization
 * - PaymentsModule: Billing and subscriptions
 * - TenantsModuleV1: Tenant management and administration
 * - ContentModule: Content generation service integration
 * - EnginesModuleV1: AI engine management
 * 
 * The CoreModule provides fundamental application services that are used
 * across all features. It maintains backward compatibility while providing
 * a clean organizational structure for the v1 API.
 */
@Module({
  imports: [
    AuthModuleV1,
    PaymentsModule,
    TenantsModuleV1,
    ContentModule,
    EnginesModuleV1,
  ],
  exports: [
    AuthModuleV1,
    PaymentsModule,
    TenantsModuleV1,
    ContentModule,
    EnginesModuleV1,
  ],
})
export class CoreModule {}

import { Module } from '@nestjs/common';
import { TenantsModule as LegacyTenantsModule } from '../../../tenants/tenants.module';
import { AdminModule as LegacyAdminModule } from '../../../admin/admin.module';

/**
 * TenantsModule (V1)
 * 
 * Wraps existing tenants and admin modules for v1 API structure.
 * Provides tenant management and administration capabilities.
 * 
 * Features:
 * - Tenant CRUD operations
 * - Tenant configuration
 * - Admin dashboard and controls
 */
@Module({
  imports: [LegacyTenantsModule, LegacyAdminModule],
  exports: [LegacyTenantsModule, LegacyAdminModule],
})
export class TenantsModuleV1 {}

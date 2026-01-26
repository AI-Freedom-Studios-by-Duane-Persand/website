import { Module } from '@nestjs/common';
import { StorageModule } from './storage/storage.module';

/**
 * InfrastructureModule
 * 
 * Aggregates all infrastructure and integration modules.
 * Provides shared services for storage, external integrations, and platform connectivity.
 * 
 * Sub-modules:
 * - StorageModule: R2 file storage with tenant isolation
 * - IntegrationsModule: External service integrations (Poe, Ayrshare, etc.)
 * 
 * The InfrastructureModule contains services that cut across multiple features
 * and provide foundational capabilities that the rest of the application depends on.
 */
@Module({
  imports: [StorageModule],
  exports: [StorageModule],
})
export class InfrastructureModule {}

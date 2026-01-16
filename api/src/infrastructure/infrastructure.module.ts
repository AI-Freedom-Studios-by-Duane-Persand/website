/**
 * Infrastructure Module
 * 
 * Provides concrete implementations of port interfaces (adapters).
 * This module bridges domain layer with external services.
 * 
 * Exports:
 * - IContentGenerator implementation (PoeContentGeneratorAdapter)
 * - IStorageProvider implementation (StorageServiceAdapter wraps existing StorageService)
 * - TenantContextService for multi-tenancy
 */

import { Module } from '@nestjs/common';
import { TenantContextService } from './context/tenant-context';
import { PoeContentGeneratorAdapter } from './adapters/poe-content-generator.adapter';
import { StorageServiceAdapter } from './adapters/storage-service.adapter';
import { PoeClient } from '../engines/poe.client';
import { StorageModule } from '../storage/storage.module'; // Import to get StorageService

@Module({
  imports: [StorageModule], // Import StorageModule to access StorageService
  providers: [
    TenantContextService,
    PoeClient, // Needed by PoeContentGeneratorAdapter
    // Provide adapters with interface tokens
    {
      provide: 'IContentGenerator',
      useClass: PoeContentGeneratorAdapter,
    },
    {
      provide: 'IStorageProvider',
      useClass: StorageServiceAdapter,
    },
  ],
  exports: [
    TenantContextService,
    'IContentGenerator',
    'IStorageProvider',
  ],
})
export class InfrastructureModule {}




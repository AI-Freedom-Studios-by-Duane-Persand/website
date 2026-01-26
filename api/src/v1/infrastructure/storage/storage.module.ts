import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

/**
 * StorageModule
 * 
 * Centralized storage management for all generated assets.
 * Handles uploads to R2 (Cloudflare) with tenant-based path prefixing.
 * 
 * Features:
 * - Image storage and retrieval
 * - Video storage and retrieval
 * - Document storage
 * - Tenant-isolated storage paths
 * - CDN URL generation
 */
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}

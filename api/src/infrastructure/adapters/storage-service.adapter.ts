/**
 * Storage Service Adapter
 * 
 * Adapts the existing StorageService to IStorageProvider interface.
 * This is a temporary adapter to bridge the existing storage implementation
 * with the new port/adapter architecture.
 * 
 * Future: Replace with direct R2StorageAdapter once S3 client injection is resolved.
 */

import { Injectable } from '@nestjs/common';
import { IStorageProvider, StorageMetadata, StorageReference } from '../../domain/ports/storage-provider.interface';
import { StorageService } from '../../storage/storage.service';

@Injectable()
export class StorageServiceAdapter implements IStorageProvider {
  constructor(private readonly storageService: StorageService) {}

  async upload(
    buffer: Buffer,
    key: string,
    metadata: Partial<StorageMetadata> = {},
  ): Promise<StorageReference> {
    // Use existing StorageService.uploadFile
    const url = await this.storageService.uploadFile(
      buffer,
      {
        key,
        contentType: metadata.mimeType,
        tags: [], // StorageService expects tags
        metadata: metadata.custom || {},
      },
    );

    return {
      key,
      url,
      metadata: {
        name: metadata.name || key,
        mimeType: metadata.mimeType || 'application/octet-stream',
        size: buffer.length,
        uploadedAt: metadata.uploadedAt || new Date(),
        custom: metadata.custom,
      },
    };
  }

  async download(key: string): Promise<Buffer> {
    // Not implemented - engines don't need download functionality yet
    throw new Error('Download not yet implemented in StorageServiceAdapter');
  }

  async delete(key: string): Promise<boolean> {
    // Not implemented - engines don't need delete functionality yet
    throw new Error('Delete not yet implemented in StorageServiceAdapter');
  }

  async exists(key: string): Promise<boolean> {
    // Not implemented - engines don't need exists check yet
    throw new Error('Exists check not yet implemented in StorageServiceAdapter');
  }

  async getMetadata(key: string): Promise<StorageMetadata> {
    // Not implemented - engines don't need metadata retrieval yet
    throw new Error('GetMetadata not yet implemented in StorageServiceAdapter');
  }

  async listFiles(prefix?: string): Promise<StorageReference[]> {
    // Not implemented - engines don't need file listing yet
    throw new Error('listFiles not yet implemented in StorageServiceAdapter');
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<StorageReference> {
    // Not implemented - engines use public URLs, not signed URLs
    throw new Error('getSignedUrl not yet implemented in StorageServiceAdapter');
  }

  async deleteMany(keys: string[]): Promise<number> {
    // Not implemented - engines don't need bulk delete yet
    throw new Error('deleteMany not yet implemented in StorageServiceAdapter');
  }

  async listByPrefix(prefix: string, options?: { skip?: number; limit?: number }): Promise<string[]> {
    // Not implemented - engines don't need prefix listing yet
    throw new Error('listByPrefix not yet implemented in StorageServiceAdapter');
  }

  async copy(sourceKey: string, destinationKey: string): Promise<StorageReference> {
    // Not implemented - engines don't need file copying yet
    throw new Error('copy not yet implemented in StorageServiceAdapter');
  }

  async move(sourceKey: string, destinationKey: string): Promise<StorageReference> {
    // Not implemented - engines don't need file moving yet
    throw new Error('move not yet implemented in StorageServiceAdapter');
  }
}

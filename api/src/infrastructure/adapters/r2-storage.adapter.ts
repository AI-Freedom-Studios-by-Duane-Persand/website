/**
 * R2 Storage Adapter
 * 
 * Implements IStorageProvider interface for Cloudflare R2.
 * Provides file upload, download, and metadata management using S3-compatible API.
 * 
 * Usage:
 * - Inject via NestJS DI
 * - Used by domain services (e.g., AssetManagementService, CampaignService)
 * - Can be swapped with other implementations (S3StorageAdapter, AzureBlobAdapter, etc.)
 */

import { Injectable } from '@nestjs/common';
import { IStorageProvider, StorageMetadata, StorageReference } from '../../domain/ports/storage-provider.interface';

/**
 * S3/R2 Client type (adjust based on AWS SDK or actual R2 client interface)
 */
interface S3Client {
  putObject(params: any): Promise<any>;
  getObject(params: any): Promise<any>;
  headObject(params: any): Promise<any>;
  deleteObject(params: any): Promise<any>;
  deleteObjects(params: any): Promise<any>;
  listObjectsV2(params: any): Promise<any>;
  getSignedUrl(operation: string, params: any): Promise<string>;
  copyObject(params: any): Promise<any>;
}

/**
 * R2 Storage Adapter
 * Adapts Cloudflare R2 (S3-compatible) to IStorageProvider interface
 */
@Injectable()
export class R2StorageAdapter implements IStorageProvider {
  /**
   * Inject the S3 client configured for R2
   */
  constructor(
    private readonly s3Client: S3Client,
    private readonly bucketName: string = process.env.R2_BUCKET_NAME || 'ai-freedom-studios',
    private readonly baseUrl: string = process.env.R2_PUBLIC_URL || '',
  ) {}

  /**
   * Upload a file to R2
   */
  async upload(
    buffer: Buffer,
    key: string,
    metadata: Partial<StorageMetadata> = {},
  ): Promise<StorageReference> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: metadata.mimeType || 'application/octet-stream',
        Metadata: {
          'uploaded-by': 'ai-freedom-studios',
          'upload-date': new Date().toISOString(),
          ...this.flattenMetadata(metadata.custom || {}),
        },
      };

      await this.s3Client.putObject(params);

      const url = `${this.baseUrl}/${key}`;
      const signedUrlRef = await this.getSignedUrl(key, 3600); // 1 hour

      return {
        key,
        url,
        signedUrl: signedUrlRef.signedUrl,
        signedUrlExpires: signedUrlRef.signedUrlExpires,
        metadata: {
          name: metadata.name || key,
          mimeType: metadata.mimeType || 'application/octet-stream',
          size: buffer.length,
          uploadedAt: new Date(),
          custom: metadata.custom,
        },
      };
    } catch (error) {
      throw new Error(`R2 upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Download a file from R2
   */
  async download(key: string): Promise<Buffer> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
      };

      const response = await this.s3Client.getObject(params);
      
      // Convert stream to buffer if needed
      if (response.Body instanceof Buffer) {
        return response.Body;
      }

      return Buffer.from(response.Body);
    } catch (error) {
      throw new Error(`R2 download failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get metadata for a file
   */
  async getMetadata(key: string): Promise<StorageMetadata> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
      };

      const response = await this.s3Client.headObject(params);

      return {
        name: key,
        mimeType: response.ContentType || 'application/octet-stream',
        size: response.ContentLength || 0,
        uploadedAt: response.LastModified || new Date(),
        custom: this.unflattenMetadata(response.Metadata || {}),
      };
    } catch (error) {
      throw new Error(`Failed to get metadata for ${key}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if a file exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.getMetadata(key);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete a single file
   */
  async delete(key: string): Promise<boolean> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
      };

      await this.s3Client.deleteObject(params);
      return true;
    } catch (error) {
      throw new Error(`R2 delete failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMany(keys: string[]): Promise<number> {
    try {
      if (keys.length === 0) return 0;

      const params = {
        Bucket: this.bucketName,
        Delete: {
          Objects: keys.map((key) => ({ Key: key })),
        },
      };

      const response = await this.s3Client.deleteObjects(params);
      return response.Deleted?.length || 0;
    } catch (error) {
      throw new Error(`R2 bulk delete failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List files by prefix (folder path)
   */
  async listByPrefix(prefix: string, options?: { skip?: number; limit?: number }): Promise<string[]> {
    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: options?.limit || 100,
      };

      const response = await this.s3Client.listObjectsV2(params);
      const objects = response.Contents || [];

      // Skip if needed
      const skipped = options?.skip ? objects.slice(options.skip) : objects;

      return skipped.map((obj: any) => obj.Key);
    } catch (error) {
      throw new Error(`R2 list failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a signed URL for temporary access
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<StorageReference> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn,
      };

      const signedUrl = await this.s3Client.getSignedUrl('getObject', params);
      const metadata = await this.getMetadata(key);

      return {
        key,
        url: `${this.baseUrl}/${key}`,
        signedUrl,
        signedUrlExpires: new Date(Date.now() + expiresIn * 1000),
        metadata,
      };
    } catch (error) {
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Copy a file to a new location
   */
  async copy(sourceKey: string, destinationKey: string): Promise<StorageReference> {
    try {
      const params = {
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey,
      };

      await this.s3Client.copyObject(params);

      const metadata = await this.getMetadata(destinationKey);
      const signedUrlRef = await this.getSignedUrl(destinationKey, 3600);

      return {
        key: destinationKey,
        url: `${this.baseUrl}/${destinationKey}`,
        signedUrl: signedUrlRef.signedUrl,
        signedUrlExpires: signedUrlRef.signedUrlExpires,
        metadata,
      };
    } catch (error) {
      throw new Error(
        `R2 copy failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Move a file (copy + delete)
   */
  async move(sourceKey: string, destinationKey: string): Promise<StorageReference> {
    try {
      const result = await this.copy(sourceKey, destinationKey);
      await this.delete(sourceKey);
      return result;
    } catch (error) {
      throw new Error(`R2 move failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Flatten custom metadata object for S3
   */
  private flattenMetadata(custom: Record<string, any>): Record<string, string> {
    const flattened: Record<string, string> = {};
    Object.keys(custom).forEach((key) => {
      flattened[`x-amz-meta-${key}`] = String(custom[key]);
    });
    return flattened;
  }

  /**
   * Unflatten S3 metadata back to custom object
   */
  private unflattenMetadata(metadata: Record<string, string>): Record<string, any> {
    const unflattened: Record<string, any> = {};
    Object.keys(metadata).forEach((key) => {
      if (key.startsWith('x-amz-meta-')) {
        const cleanKey = key.replace('x-amz-meta-', '');
        unflattened[cleanKey] = metadata[key];
      }
    });
    return unflattened;
  }
}

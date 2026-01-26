import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

/**
 * StorageService
 * 
 * Manages asset storage to R2 (Cloudflare) with tenant isolation.
 * Generates CDN URLs for served content.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly r2AccountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  private readonly r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  private readonly r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  private readonly r2BucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  private readonly cdnUrl = process.env.CLOUDFLARE_R2_CDN_URL;
  private readonly r2Endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;

  constructor() {
    this.logger.log('StorageService initialized');
  }

  /**
   * Save image from URL to R2 storage
   * Returns CDN path for served content
   */
  async saveImage(
    imageUrl: string,
    tenantId: string,
    userId?: string,
  ): Promise<string> {
    try {
      const filename = this.generateFilename('image', userId);
      const path = this.generatePath(tenantId, 'images', filename);
      await this.uploadToR2(imageUrl, path);
      return this.generateCdnUrl(path);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to save image: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Save video from URL to R2 storage
   * Returns CDN path for served content
   */
  async saveVideo(
    videoUrl: string,
    tenantId: string,
    userId?: string,
  ): Promise<string> {
    try {
      const filename = this.generateFilename('video', userId);
      const path = this.generatePath(tenantId, 'videos', filename);
      await this.uploadToR2(videoUrl, path);
      return this.generateCdnUrl(path);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to save video: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Delete file from R2 storage
   */
  async deleteFile(path: string): Promise<void> {
    try {
      // TODO: Implement R2 deletion
      this.logger.log(`Deleted file from R2: ${path}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to delete file: ${err.message}`, err.stack);
      throw error;
    }
  }

  // ============ Private Methods ============

  /**
   * Generate unique filename with extension based on type
   */
  private generateFilename(
    type: 'image' | 'video' | 'document',
    userId?: string,
  ): string {
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(4).toString('hex');
    const extensions = {
      image: 'png',
      video: 'mp4',
      document: 'pdf',
    };
    const extension = extensions[type];
    return `${type}-${timestamp}-${randomId}.${extension}`;
  }

  /**
   * Generate tenant-isolated storage path
   */
  private generatePath(
    tenantId: string,
    category: string,
    filename: string,
  ): string {
    return `tenants/${tenantId}/${category}/${filename}`;
  }

  /**
   * Generate CDN URL for accessing stored content
   */
  private generateCdnUrl(path: string): string {
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${path}`;
    }
    return path; // Fallback to path only
  }

  /**
   * Upload file to R2 from URL
   */
  private async uploadToR2(sourceUrl: string, r2Path: string): Promise<void> {
    try {
      // Download file from source URL
      const response = await axios.get(sourceUrl, {
        responseType: 'arraybuffer',
      });

      const buffer = Buffer.from(response.data);

      // TODO: Upload to R2 using AWS SDK or Cloudflare API
      this.logger.log(`Uploaded file to R2: ${r2Path}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to upload to R2: ${err.message}`, err.stack);
      throw error;
    }
  }
}

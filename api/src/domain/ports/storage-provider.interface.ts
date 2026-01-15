/**
 * Storage Provider Port Interface
 * 
 * Defines the contract for file storage operations.
 * This abstraction allows swapping storage backends (R2, S3, etc.)
 * without affecting domain logic.
 */

export interface StorageMetadata {
  /** File name */
  name: string;
  
  /** MIME type */
  mimeType: string;
  
  /** File size in bytes */
  size: number;
  
  /** Upload timestamp */
  uploadedAt: Date;
  
  /** Custom metadata */
  custom?: Record<string, any>;
}

export interface StorageReference {
  /** Storage key/path */
  key: string;
  
  /** Public URL if accessible */
  url: string;
  
  /** Signed URL (if authentication required) */
  signedUrl?: string;
  
  /** Signed URL expiration */
  signedUrlExpires?: Date;
  
  /** File metadata */
  metadata: StorageMetadata;
}

export interface IStorageProvider {
  /**
   * Upload file to storage
   * 
   * @param buffer File buffer
   * @param key Storage key (path)
   * @param metadata File metadata
   * @returns Storage reference with URL
   */
  upload(
    buffer: Buffer,
    key: string,
    metadata: Partial<StorageMetadata>
  ): Promise<StorageReference>;

  /**
   * Download file from storage
   * 
   * @param key Storage key (path)
   * @returns File buffer
   */
  download(key: string): Promise<Buffer>;

  /**
   * Get file metadata without downloading
   * 
   * @param key Storage key (path)
   * @returns File metadata
   */
  getMetadata(key: string): Promise<StorageMetadata>;

  /**
   * Check if file exists
   * 
   * @param key Storage key (path)
   * @returns True if file exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Delete file from storage
   * 
   * @param key Storage key (path)
   * @returns True if deleted, false if not found
   */
  delete(key: string): Promise<boolean>;

  /**
   * Delete multiple files
   * 
   * @param keys Array of storage keys
   * @returns Number of files deleted
   */
  deleteMany(keys: string[]): Promise<number>;

  /**
   * List files by prefix
   * 
   * @param prefix Prefix to filter by
   * @param options List options (skip, limit)
   * @returns Array of file keys
   */
  listByPrefix(
    prefix: string,
    options?: {
      skip?: number;
      limit?: number;
    }
  ): Promise<string[]>;

  /**
   * Get signed URL for private file access
   * 
   * @param key Storage key (path)
   * @param expiresIn Expiration time in seconds
   * @returns Signed URL with expiration
   */
  getSignedUrl(key: string, expiresIn?: number): Promise<StorageReference>;

  /**
   * Copy file within storage
   * 
   * @param sourceKey Source storage key
   * @param destinationKey Destination storage key
   * @returns Storage reference for copied file
   */
  copy(sourceKey: string, destinationKey: string): Promise<StorageReference>;

  /**
   * Move file within storage
   * 
   * @param sourceKey Source storage key
   * @param destinationKey Destination storage key
   * @returns Storage reference for moved file
   */
  move(sourceKey: string, destinationKey: string): Promise<StorageReference>;
}

import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Encryption Service for securing sensitive data like access tokens
 * Uses AES-256-GCM for encryption
 */
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly authTagLength = 16; // 128 bits
  private readonly encoding: BufferEncoding = 'hex';
  
  private encryptionKey: Buffer;

  constructor() {
    // Get encryption key from environment or generate one (should be in env)
    const keyString = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-key-change-in-production';
    
    // Derive a proper 32-byte key from the string
    this.encryptionKey = crypto
      .createHash('sha256')
      .update(keyString)
      .digest();
  }

  /**
   * Encrypt a string
   * @param text Plain text to encrypt
   * @returns Encrypted string in format: iv:authTag:encryptedData
   */
  encrypt(text: string): string {
    try {
      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
      
      // Encrypt the text
      let encrypted = cipher.update(text, 'utf8', this.encoding);
      encrypted += cipher.final(this.encoding);
      
      // Get auth tag for GCM mode
      const authTag = cipher.getAuthTag();
      
      // Combine iv, authTag, and encrypted data
      return `${iv.toString(this.encoding)}:${authTag.toString(this.encoding)}:${encrypted}`;
    } catch (error: any) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt a string
   * @param encryptedText Encrypted string in format: iv:authTag:encryptedData
   * @returns Decrypted plain text
   */
  decrypt(encryptedText: string): string {
    try {
      // Split the encrypted text
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
      }
      
      const [ivHex, authTagHex, encrypted] = parts;
      
      // Convert hex strings back to buffers
      const iv = Buffer.from(ivHex, this.encoding);
      const authTag = Buffer.from(authTagHex, this.encoding);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt the text
      let decrypted = decipher.update(encrypted, this.encoding, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error: any) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash a string (one-way)
   * @param text Text to hash
   * @returns SHA-256 hash
   */
  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Compare a plain text with a hash
   * @param text Plain text
   * @param hash Hash to compare with
   * @returns True if match
   */
  compareHash(text: string, hash: string): boolean {
    return this.hash(text) === hash;
  }
}

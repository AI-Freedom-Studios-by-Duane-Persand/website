// ConfigService for encrypted integration configs (AES-256-GCM)
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class ConfigService {
  private key = Buffer.from(process.env.CONFIG_ENCRYPTION_KEY!, 'hex');

  encryptConfig(data: object): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  }

  decryptConfig(encrypted: string): object {
    const [ivHex, tagHex, encryptedData] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }
}

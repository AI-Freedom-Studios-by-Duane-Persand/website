// api/src/integrations/config.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IntegrationConfigDocument } from '../models/integrationConfig.schema';
import * as crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const CONFIG_ENCRYPTION_KEY = '6a2d5f92db7204bc68eab445a23866922d10572a064838d2c4f6e2683e8d4347';
const KEY = Buffer.from(CONFIG_ENCRYPTION_KEY, 'hex');
const IV_LENGTH = 12;

export function encryptConfig(obj: any): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  let enc = cipher.update(JSON.stringify(obj), 'utf8', 'base64');
  enc += cipher.final('base64');
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${enc}`;
}

function decryptConfig(str: string): any {
  const [ivB64, tagB64, enc] = str.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  let dec = decipher.update(enc, 'base64', 'utf8');
  dec += decipher.final('utf8');
  return JSON.parse(dec);
}

@Injectable()
export class ConfigService {
  private cache = new Map<string, { value: any; expires: number }>();
  private ttl = 5 * 60 * 1000; // 5 min
  constructor(
    @InjectModel('IntegrationConfig') private readonly integrationConfigModel: Model<IntegrationConfigDocument>,
  ) {}

  // Validate encryption key at startup to fail fast with a clear message
  private static validateKey() {
    const raw = process.env.CONFIG_ENCRYPTION_KEY || '';
    if (!raw) {
      throw new Error('CONFIG_ENCRYPTION_KEY is not set. Please provide a 64-hex character key (32 bytes).');
    }
    if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
      const len = raw.length;
      throw new Error(
        `CONFIG_ENCRYPTION_KEY must be 64 hex chars (32 bytes). Found ${len} chars. Ensure it is a hex string (no 0x prefix) and exactly 64 characters.`
      );
    }
    if (KEY.length !== 32) {
      throw new Error(`CONFIG_ENCRYPTION_KEY decoded length is ${KEY.length} bytes; expected 32 bytes.`);
    }
  }

  // Run validation synchronously when module is loaded
  private _ = ConfigService.validateKey();

  async getConfig(service: string, tenantId?: string) {
    const cacheKey = `${service}:${tenantId || 'global'}`;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > now) return cached.value;
    let doc = null;
    if (tenantId) {
      doc = await this.integrationConfigModel.findOne({ scope: 'tenant', tenantId, service }).exec();
    }
    if (!doc) {
      doc = await this.integrationConfigModel.findOne({ scope: 'global', service }).exec();
    }
    if (!doc) throw new InternalServerErrorException('Integration config not found');
    const value = decryptConfig(doc.config);
    this.cache.set(cacheKey, { value, expires: now + this.ttl });
    return value;
  }

  async setConfig(scope: 'global' | 'tenant', service: string, configObj: any, tenantId?: string) {
    const enc = encryptConfig(configObj);
    await this.integrationConfigModel.findOneAndUpdate(
      { scope, service, tenantId: scope === 'tenant' ? tenantId : null },
      { config: enc },
      { upsert: true }
    ).exec();
    this.cache.delete(`${service}:${tenantId || 'global'}`);
  }
}


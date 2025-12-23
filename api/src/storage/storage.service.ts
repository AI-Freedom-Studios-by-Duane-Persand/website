// api/src/storage/storage.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '../integrations/config.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client | null = null;
  private bucket: string = '';
  private publicBaseUrl: string = '';

  constructor(private readonly configService: ConfigService) {
    this.logger.log('StorageService initialized');
  }

  async init(tenantId?: string) {
    const config = await this.configService.getConfig('r2', tenantId);
    if (!config?.bucketName || !config?.endpoint) {
      this.logger.error('[init] Missing R2 config values', { bucketName: config?.bucketName, endpoint: config?.endpoint });
      throw new InternalServerErrorException('R2 storage configuration is incomplete (bucket/endpoint).');
    }
    this.logger.log('[init] R2 config loaded', {
      endpoint: config.endpoint,
      bucketName: config.bucketName,
      publicBaseUrl: config.publicBaseUrl,
    });
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    this.bucket = config.bucketName;
    this.publicBaseUrl = config.publicBaseUrl;
    this.logger.log(`[init] S3 client ready for bucket ${this.bucket}`);
  }

  async uploadFile(buffer: Buffer, key?: string, contentType?: string, tenantId?: string) {
    if (!this.s3) await this.init(tenantId);
    if (!this.bucket) {
      this.logger.error('[uploadFile] bucket not set');
      throw new InternalServerErrorException('R2 bucket not configured');
    }
    const fileKey = key || uuidv4();
    this.logger.log(`[uploadFile] Uploading key=${fileKey} bucket=${this.bucket}`);
    const putCmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    });
    try {
      await this.s3!.send(putCmd);
    } catch (err: any) {
      this.logger.error('[uploadFile] Upload failed', {
        errorMessage: err?.message,
        errorCode: err?.Code,
        httpStatus: err?.$metadata?.httpStatusCode,
        bucket: this.bucket,
      });
      throw err;
    }
    const url = `${this.publicBaseUrl}/${fileKey}`;
    this.logger.log(`[uploadFile] Upload successful url=${url}`);
    return url;
  }
}

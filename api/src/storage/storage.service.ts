// api/src/storage/storage.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '../integrations/config.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private s3: S3Client | null = null;
  private bucket: string = '';
  private publicBaseUrl: string = '';

  constructor(private readonly configService: ConfigService) {}

  async init(tenantId?: string) {
    const config = await this.configService.getConfig('r2', tenantId);
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
  }

  async uploadFile(buffer: Buffer, key?: string, contentType?: string, tenantId?: string) {
    if (!this.s3) await this.init(tenantId);
    const fileKey = key || uuidv4();
    const putCmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    });
    await this.s3!.send(putCmd);
    return `${this.publicBaseUrl}/${fileKey}`;
  }
}

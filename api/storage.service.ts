// StorageService for Cloudflare R2 (S3-compatible)
import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private s3 = new S3Client({
    region: process.env.R2_REGION,
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
    forcePathStyle: true,
  });

  async uploadFiles(files: Express.Multer.File[]) {
    const bucket = process.env.R2_BUCKET;
    const results = [];
    for (const file of files) {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype,
      });
      await this.s3.send(command);
      results.push({
        url: `${process.env.R2_PUBLIC_URL}/${file.originalname}`,
        filename: file.originalname,
      });
    }
    return results;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { AyrshareService } from './ayrshare.service';

@Injectable()
export class SocialPublisher {
  private readonly logger = new Logger(SocialPublisher.name);

  constructor(private readonly ayrshareService: AyrshareService) {}

  async publishToMeta(content: string, metaPageId: string): Promise<any> {
    try {
      this.logger.log('Publishing content to Meta via Ayrshare...');
      const response = await this.ayrshareService.createMetaPost(content, metaPageId);
      this.logger.log('Content published successfully to Meta');
      return response;
    } catch (error: any) {
      if (error.response) {
        this.logger.error(
          `Error publishing content to Meta: ${error.response.status} - ${error.response.data}`,
        );
      } else {
        this.logger.error(`Error publishing content to Meta: ${error.message}`);
      }
      throw error;
    }
  }
}
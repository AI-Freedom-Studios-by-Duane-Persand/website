import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VideoService } from '../creatives/video.service';

@Injectable()
export class VideoRenderWorker {
  private readonly logger = new Logger(VideoRenderWorker.name);

  constructor(private readonly videoService: VideoService) {}

  // Runs every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processPendingRenders() {
    this.logger.log('Checking for pending video renders');
    try {
      const count = await this.videoService.processPendingRenders();
      this.logger.log(`Processed ${count} pending video renders`);
    } catch (err) {
      this.logger.error('Error processing video renders', (err instanceof Error ? err.stack : String(err)));
    }
  }
}

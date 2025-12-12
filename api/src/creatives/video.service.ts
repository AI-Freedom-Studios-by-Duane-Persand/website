import { Injectable, Logger } from '@nestjs/common';
import { CreativeModel } from '../models/creative.schema';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  /**
   * Process all creatives of type 'video' with status 'scheduled'.
   * Simulate rendering, update status to 'published', and log results.
   * Returns the number of videos processed.
   */
  async processPendingRenders(): Promise<number> {
    const pendingVideos = await CreativeModel.find({ type: 'video', status: 'scheduled' });
    let processed = 0;
    for (const creative of pendingVideos) {
      try {
        // Simulate video rendering (replace with real logic as needed)
        this.logger.log(`Rendering video creative ${creative._id}`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        creative.status = 'published';
        creative.updatedAt = new Date();
        await creative.save();
        processed++;
        this.logger.log(`Published video creative ${creative._id}`);
      } catch (err) {
        this.logger.error(`Failed to render video creative ${creative._id}: ${(err instanceof Error ? err.message : String(err))}`);
      }
    }
    return processed;
  }
}

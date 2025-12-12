// api/src/jobs/scheduling.worker.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SchedulingService } from '../scheduling/scheduling.service';

@Injectable()
export class SchedulingWorker {
  private readonly logger = new Logger(SchedulingWorker.name);

  constructor(private readonly schedulingService: SchedulingService) {}

  // Runs every minute
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledPosts() {
    this.logger.log('Running scheduled posts worker...');
    await this.schedulingService.processScheduledPosts();
  }
}

// api/src/scheduling/scheduling.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ScheduledItemModel } from '../models/scheduledItem.schema';
import { AyrsharePublisher } from './social-publisher/ayrshare.publisher';
import { CreativeModel } from '../models/creative.schema';

@Injectable()
export class SchedulingService {
  constructor(private readonly ayrsharePublisher: AyrsharePublisher) {}

  async scheduleCreative({ tenantId, creativeId, platforms, scheduledAt, publisher }: any) {
    return ScheduledItemModel.create({
      tenantId,
      creativeId,
      platform: platforms[0], // for simplicity, one per item
      channelType: 'organic',
      publisher,
      scheduledAt,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }



  async processScheduledPosts(): Promise<void> {
    // Find all scheduled items that are due to be published
    const now = new Date();
    const items = await ScheduledItemModel.find({ status: 'pending', scheduledAt: { $lte: now } });
    for (const item of items) {
      const creative = await CreativeModel.findById(item.creativeId);
      if (!creative) continue;
      try {
        const result = await this.ayrsharePublisher.publishOrganicPost({
          tenantId: item.tenantId,
          creative,
          platforms: [item.platform],
        });
        item.status = 'published';
        item.platformPostId = result.platformIds[item.platform];
      } catch (e: any) {
        item.status = 'failed';
        item.error = (e instanceof Error ? e.message : 'Unknown error');
      }
      item.updatedAt = new Date();
      await item.save();
    }
  }
}

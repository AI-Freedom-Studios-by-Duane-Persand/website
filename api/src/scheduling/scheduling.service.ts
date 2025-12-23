// api/src/scheduling/scheduling.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AyrsharePublisher } from './social-publisher/ayrshare.publisher';
import { CreativeDocument } from '../creatives/schemas/creative.schema';

@Injectable()
export class SchedulingService {
  constructor(
    private readonly ayrsharePublisher: AyrsharePublisher,
    @InjectModel('Creative') private readonly creativeModel: Model<CreativeDocument>,
    @InjectModel('ScheduledItem') private readonly scheduledItemModel: Model<any>,
  ) {}

  async scheduleCreative({ tenantId, creativeId, platforms, scheduledAt, publisher }: any) {
    return this.scheduledItemModel.create({
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
    const items = await this.scheduledItemModel.find({ status: 'pending', scheduledAt: { $lte: now } });
    for (const item of items) {
      const creative = await this.creativeModel.findById(item.creativeId);
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

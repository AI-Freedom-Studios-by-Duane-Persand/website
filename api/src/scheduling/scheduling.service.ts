// api/src/scheduling/scheduling.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AyrsharePublisher } from './social-publisher/ayrshare.publisher';
import { MetaDirectPublisher } from './social-publisher/meta-direct.publisher';
import { CreativeDocument } from '../creatives/schemas/creative.schema';
import { ScheduledItemDocument } from '../models/scheduledItem.schema';

@Injectable()
export class SchedulingService {
  constructor(
    private readonly ayrsharePublisher: AyrsharePublisher,
    private readonly metaDirectPublisher: MetaDirectPublisher,
    @InjectModel('Creative') private readonly creativeModel: Model<CreativeDocument>,
    @InjectModel('ScheduledItem') private readonly scheduledItemModel: Model<ScheduledItemDocument>,
  ) {}

  async listScheduledItems({
    tenantId,
    status,
    from,
    to,
    limit = 50,
  }: {
    tenantId?: string;
    status?: ScheduledItemDocument['status'];
    from?: Date;
    to?: Date;
    limit?: number;
  }) {
    const query: any = {};
    if (tenantId) query.tenantId = tenantId;
    if (status) query.status = status;
    if (from || to) {
      query.scheduledAt = {};
      if (from) query.scheduledAt.$gte = from;
      if (to) query.scheduledAt.$lte = to;
    }

    return this.scheduledItemModel
      .find(query)
      .sort({ scheduledAt: 1 })
      .limit(limit)
      .lean();
  }

  async scheduleCreative({ tenantId, userId, creativeId, platforms, scheduledAt, publisher }: any) {
    return this.scheduledItemModel.create({
      tenantId,
      userId,
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
        // Use MetaDirectPublisher for Facebook/Instagram, Ayrshare for others
        const publisher = (item.platform === 'facebook' || item.platform === 'instagram')
          ? this.metaDirectPublisher
          : this.ayrsharePublisher;
        
        const result = await publisher.publishOrganicPost({
          tenantId: item.tenantId,
          userId: item.userId,
          creative: creative as any,
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

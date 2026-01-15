import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dtos/subscription.dto';
import { Subscription, SubscriptionDocument } from '../models/subscriptionV2.model';
import { Logger } from 'winston';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name) private readonly subscriptionModel: Model<SubscriptionDocument>,
    @Inject('winston') private readonly logger: Logger,
  ) {}

  // Find subscription by userId (for /subscriptions/my)
  async findByUserId(userId: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findOne({ userId }).exec();
  }


  async findAll(query: any): Promise<SubscriptionDocument[]> {
    return this.subscriptionModel.find(query).exec();
  }


  async findOne(id: string, userId?: string): Promise<SubscriptionDocument> {
    if (id === 'my') {
      if (!userId) {
        throw new Error('User ID is required to fetch the subscription.');
      }
      const subscription = await this.findByUserId(userId);
      if (!subscription) throw new NotFoundException('Subscription not found');
      return subscription;
    }

    if (id === 'subscription-status' || id === 'status') {
      if (!userId) {
        throw new Error('User ID is required to fetch the subscription status.');
      }
      const subscription = await this.findByUserId(userId);
      if (!subscription) throw new NotFoundException('Subscription not found');
      return subscription;
    }

    const subscription = await this.subscriptionModel.findById(id).exec();
    if (!subscription) throw new NotFoundException('Subscription not found');
    return subscription;
  }


  async create(createSubscriptionDto: CreateSubscriptionDto): Promise<SubscriptionDocument> {
    const createdSubscription = new this.subscriptionModel(createSubscriptionDto);
    return createdSubscription.save();
  }


  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto): Promise<SubscriptionDocument> {
    const subscription = await this.subscriptionModel.findByIdAndUpdate(id, updateSubscriptionDto, { new: true }).exec();
    if (!subscription) throw new NotFoundException('Subscription not found');
    return subscription;
  }


  async remove(id: string): Promise<{ deleted: boolean }> {
    const res = await this.subscriptionModel.deleteOne({ _id: id }).exec();
    return { deleted: res.deletedCount > 0 };
  }

  async getSubscriptionStatus(userId: string): Promise<{ status: string }> {
    this.logger.info('Fetching subscription status', { userId });
    const subscription = await this.findByUserId(userId);
    if (!subscription || subscription.status !== 'active') {
      this.logger.warn('No active subscription found', { userId });
      return { status: 'inactive' };
    }
    this.logger.info('Active subscription found', { userId, subscriptionId: subscription._id });
    return { status: 'active' };
  }

  async updateSubscriptionStatus(subscriptionId: string, status: string): Promise<void> {
    await this.subscriptionModel.findByIdAndUpdate(subscriptionId, { status }).exec();
  }
}

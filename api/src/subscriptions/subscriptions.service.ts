// ...imports remain at the top...
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
// Removed legacy Subscription type import
import { CreateSubscriptionDto, UpdateSubscriptionDto } from '../../../shared/subscription.dto';
import { Subscription, SubscriptionDocument } from '../models/subscriptionV2.model';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name) private readonly subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  // Find subscription by userId (for /subscriptions/my)
  async findByUserId(userId: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findOne({ userId }).exec();
  }


  async findAll(query: any): Promise<SubscriptionDocument[]> {
    return this.subscriptionModel.find(query).exec();
  }


  async findOne(id: string): Promise<SubscriptionDocument> {
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
}

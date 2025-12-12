import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { UserJwt } from '../../../shared/user-jwt.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Subscription, SubscriptionDocument } from '../models/subscriptionV2.model';
import { Package, PackageDocument } from '../models/package.model';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Package.name) private packageModel: Model<PackageDocument>,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMySubscription(@Req() req: { user: UserJwt }) {
    return this.subscriptionModel.findOne({ userId: req.user.sub }).populate('packageId');
  }

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createSubscription(@Req() req: { user: UserJwt }, @Body() body: { packageId: string }) {
    // Create a pending subscription and generate a Stripe payment link
    // (Stub: replace with real Stripe integration)
    const pkg = await this.packageModel.findById(body.packageId);
    if (!pkg) throw new Error('Package not found');
    const paymentLink = `https://buy.stripe.com/test_payment_link_for_${pkg._id}`;
    const sub = await this.subscriptionModel.create({
      userId: req.user.sub,
      packageId: pkg._id,
      status: 'pending',
      paymentLink,
    });
    return sub;
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm')
  async confirmPayment(@Req() req: any, @Body() body: { subscriptionId: string }) {
    // In real implementation, verify payment with Stripe API
    const sub = await this.subscriptionModel.findOneAndUpdate(
      { _id: body.subscriptionId, userId: req.user.sub },
      { status: 'active', validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      { new: true }
    );
    return sub;
  }
}

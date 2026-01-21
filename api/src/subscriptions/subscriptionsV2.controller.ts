import * as dotenv from 'dotenv';
import { Controller, Post, Get, Body, Req, UseGuards, Inject, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Subscription, SubscriptionDocument } from '../models/subscriptionV2.model';
import { Package, PackageDocument } from '../models/package.model';
import { UserJwt } from '../../../shared/user-jwt.interface';
import winston, { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';
import { TenantDocument } from '../tenants/schemas/tenant.schema';

// Load environment variables from .env file (only log in constructor, not at module load)
dotenv.config();

@Controller('subscriptions')
export class SubscriptionsController {
  private readonly loggerWinston: winston.Logger;

  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Package.name)
    private readonly packageModel: Model<PackageDocument>,
    @InjectModel('Tenant')
    private readonly tenantModel: Model<TenantDocument>,
    private readonly configService: ConfigService,
  ) {
    this.loggerWinston = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.Console(),
      ],
    });

    // Test log to confirm logger is functioning
    this.loggerWinston.info('SubscriptionsController initialized');
  }

  private getUserId(req: { user: any }): string {
    const userId = req.user?.sub || req.user?.userId;
    if (!userId) throw new BadRequestException('User ID not found in request');
    return userId;
  }

  @Get('packages')
  async listPackages() {
    return this.packageModel.find({ active: true }).lean();
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription-status')
  async getSubscriptionStatus(@Req() req: { user: UserJwt }) {
    const userId = this.getUserId(req);
    const subscription = await this.subscriptionModel.findOne({ userId }).lean();
    if (!subscription || subscription.status !== 'active') {
      return { status: 'inactive' };
    }
    return { status: 'active' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMySubscription(@Req() req: { user: UserJwt }) {
    const userId = this.getUserId(req);
    return this.subscriptionModel.findOne({ userId }).populate('packageId');
  }

  @UseGuards(JwtAuthGuard)
  @Get('current')
  async getCurrentSubscription(@Req() req: { user: UserJwt }) {
    const userId = this.getUserId(req);
    return this.subscriptionModel.findOne({ userId }).populate('packageId');
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createSubscriptionDirect(
    @Req() req: { user: UserJwt },
    @Body() body: { packageId: string },
  ) {
    return this.createSubscription(req, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createSubscription(
    @Req() req: { user: UserJwt },
    @Body() body: { packageId: string },
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    if (!frontendUrl || !/^https?:\/\//.test(frontendUrl)) {
      this.loggerWinston.error(`Invalid FRONTEND_URL: ${frontendUrl}`);
      throw new InternalServerErrorException(
        'Invalid FRONTEND_URL environment variable. Ensure it includes the scheme (e.g., https://).',
      );
    }

    this.loggerWinston.info(`Using FRONTEND_URL: ${frontendUrl}`);

    try {
      const userId = this.getUserId(req);
      const pkg = await this.packageModel.findById(body.packageId);
      if (!pkg) throw new BadRequestException('Package not found');

      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const successUrl = `${frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${frontendUrl}/billing/cancel?session_id={CHECKOUT_SESSION_ID}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: { name: pkg.name },
              unit_amount: pkg.price * 100, // Convert dollars to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      const subscription = await this.subscriptionModel.create({
        userId,
        packageId: pkg._id,
        status: 'pending',
        paymentLink: session.url,
      });

      // Debug log to confirm userId before tenant update
      this.loggerWinston.debug('Attempting to update tenant subscription status', { userId });

      const tenantUpdate = await this.tenantModel.findOneAndUpdate(
        { ownerId: userId },
        { subscriptionStatus: 'active' },
        { new: true }
      );

      if (!tenantUpdate) {
        this.loggerWinston.warn('Tenant update failed: No tenant found for ownerId', { ownerId: userId });
        throw new InternalServerErrorException('Failed to update tenant subscription status: No matching tenant found');
      }
      this.loggerWinston.info('Tenant subscription status updated successfully', { userId });

      // Ensure subscription status is updated to active
      const subscriptionUpdate = await this.subscriptionModel.findByIdAndUpdate(
        subscription._id,
        { status: 'active' },
        { new: true }
      );

      if (!subscriptionUpdate) {
        this.loggerWinston.warn('Subscription update failed', { subscriptionId: subscription._id });
        throw new InternalServerErrorException('Failed to update subscription status');
      }
      this.loggerWinston.info('Subscription status updated successfully', { subscriptionId: subscription._id });

      this.loggerWinston.info('Subscription created successfully', { subscriptionId: subscription._id });
      return {
        message: 'Subscription created successfully',
        subscription,
        paymentLink: session.url, // Changed from checkoutUrl to paymentLink
      };
    } catch (error: any) {
      this.loggerWinston.error('Error creating subscription', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.sub || 'unknown',
        packageId: body.packageId,
      });
      if (error?.type === 'StripeCardError') {
        throw new BadRequestException('Payment failed: ' + error.message);
      }
      throw new InternalServerErrorException('An error occurred while creating the subscription');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm')
  async confirmPayment(
    @Req() req: { user: UserJwt },
    @Body() body: { subscriptionId: string },
  ) {
    try {
      const userId = this.getUserId(req);
      const sub = await this.subscriptionModel.findOneAndUpdate(
        { _id: body.subscriptionId, userId },
        { status: 'active', validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        { new: true },
      );
      if (!sub) {
        this.loggerWinston.warn('Subscription not found or update failed', { subscriptionId: body.subscriptionId, userId });
        throw new NotFoundException('Subscription not found');
      }
      this.loggerWinston.info('Subscription updated successfully', { subscriptionId: body.subscriptionId, userId });
      return sub;
    } catch (error) {
      this.loggerWinston.error('Error while confirming the payment', { error });
      throw new InternalServerErrorException('An error occurred while confirming the payment');
    }
  }
}

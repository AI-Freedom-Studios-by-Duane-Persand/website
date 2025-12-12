// api/src/billing/billing.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { InjectModel } from '@nestjs/mongoose';
import { Subscription, SubscriptionDocument } from '../models/subscriptionV2.model';
import { Model } from 'mongoose';
import { TenantsService } from '../tenants/tenants.service';
import { TenantDocument } from '../models/tenant.schema';
import { plans } from '../config/plans';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

@Injectable()
export class BillingService {
  constructor(
    private readonly tenantsService: TenantsService,
    @InjectModel(Subscription.name) private readonly subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  async createCheckoutSession(planId: string, tenantId: string, successUrl: string, cancelUrl: string) {
    const plan = plans.find(p => p.planId === planId);
    if (!plan) throw new BadRequestException('Invalid plan');
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: plan.name },
          unit_amount: plan.priceCents,
        },
        quantity: 1,
      }],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
    });
    await this.subscriptionModel.findOneAndUpdate(
      { userId: tenantId },
      {
        packageId: plan.planId,
        status: 'pending',
        // Add other fields as needed for your new schema
        stripeSessionId: session.id,
      },
      { upsert: true }
    );
    return session.url;
  }

  async verifyCheckoutSession(sessionId: string, tenantId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') throw new BadRequestException('Payment not completed');
    const subscription = await this.subscriptionModel.findOne({ userId: tenantId, stripeSessionId: sessionId });
    if (!subscription) throw new BadRequestException('Subscription not found');
    const plan = plans.find(p => p.planId === subscription.packageId);
    if (!plan) throw new BadRequestException('Plan not found');
    const now = new Date();
    let validUntil = now;
    if (subscription.status === 'active' && subscription.validUntil && subscription.validUntil > now) {
      // Extend
      validUntil = new Date(subscription.validUntil);
      if (plan.interval === 'monthly') validUntil.setMonth(validUntil.getMonth() + 1);
      else validUntil.setFullYear(validUntil.getFullYear() + 1);
    } else {
      // New or expired
      if (plan.interval === 'monthly') validUntil.setMonth(now.getMonth() + 1);
      else validUntil.setFullYear(now.getFullYear() + 1);
    }
    subscription.status = 'active';
    subscription.validUntil = validUntil;
    subscription.stripeSessionId = session.payment_intent as string || session.id;
    // Add other fields as needed for your new schema
    await subscription.save();
    return { status: 'active', validUntil };
  }
    // Use this.tenantsService.findAll({}) inside appropriate async methods as needed
}

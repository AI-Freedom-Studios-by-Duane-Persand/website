// StripeService for one-time payment flows (no webhooks)
import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2022-11-15' });

  async createCheckoutSession() {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID ?? '',
        quantity: 1,
      }],
      mode: 'payment',
      success_url: process.env.STRIPE_SUCCESS_URL ?? '',
      cancel_url: process.env.STRIPE_CANCEL_URL ?? '',
    });
    return { url: session.url };
  }

  async verifyCheckoutSession(sessionId: string) {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid' && session.status === 'complete') {
      return { paid: true, session };
    }
    return { paid: false, session };
  }
}

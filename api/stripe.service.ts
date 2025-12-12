// StripeService for one-time payment flows (no webhooks)
import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe = new Stripe(String(process.env.STRIPE_SECRET_KEY), { apiVersion: '2022-11-15' });

  async createCheckoutSession() {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: String(process.env.STRIPE_PRICE_ID),
        quantity: 1,
      }],
      mode: 'payment',
      success_url: String(process.env.STRIPE_SUCCESS_URL),
      cancel_url: String(process.env.STRIPE_CANCEL_URL),
    });
    return { url: session.url };
  }
}

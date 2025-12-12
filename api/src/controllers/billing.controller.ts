
import { Controller, Get, Post, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { UserJwt } from '../../../shared/user-jwt.interface';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';
import { StripeService } from '../services/stripe.service';
import { SubscriptionModel } from '../models';

@Controller('billing')
export class BillingController {
  constructor(private readonly stripeService: StripeService) {}

  @Roles('tenant')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('info')
  async getBillingInfo(@Request() req: { user: UserJwt }) {
    const tenantId = req.user.tenantId;
    try {
      const sub = await SubscriptionModel.findOne({ tenantId });
      if (!sub) return { plan: 'None', renewal: null };
      return { plan: sub.plan, renewal: sub.renewal };
    } catch (err) {
      throw new BadRequestException('Failed to fetch billing info.');
    }
  }

  @Roles('tenant')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('checkout')
  async createCheckoutSession() {
    try {
      return await this.stripeService.createCheckoutSession();
    } catch (err) {
      throw new BadRequestException('Failed to create Stripe checkout session.');
    }
  }

  @Roles('tenant')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('verify')
  async verifyCheckoutSession(@Request() req: { user: UserJwt, body: { sessionId: string } }) {
    const { sessionId } = req.body;
    if (!sessionId) throw new BadRequestException('Missing sessionId');
    try {
      const result = await this.stripeService.verifyCheckoutSession(sessionId);
      if (result.paid) {
        // Update subscription state in MongoDB (example for legacy SubscriptionModel)
        await SubscriptionModel.updateOne(
          { tenantId: req.user.tenantId },
          { $set: { plan: 'paid', renewal: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
          { upsert: true }
        );
      }
      return result;
    } catch (err) {
      throw new BadRequestException('Failed to verify Stripe session.');
    }
  }
}

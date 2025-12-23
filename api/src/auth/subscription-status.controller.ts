import { Controller, Get } from '@nestjs/common';

@Controller('subscription-status')
export class SubscriptionStatusController {
  @Get()
  async checkSubscriptionStatus() {
    // Placeholder: Replace with actual logic to check subscription status
    return { isSubscribed: true };
  }
}
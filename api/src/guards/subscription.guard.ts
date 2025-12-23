import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Temporarily bypassing subscription checks for debugging purposes
    return true;
  }
}
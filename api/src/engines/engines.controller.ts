// api/src/engines/engines.controller.ts

import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { UserJwt } from '../../../shared/user-jwt.interface';
import { EnginesService } from './engines.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionRequired } from '../auth/subscription-required.decorator';
import { SubscriptionRequiredGuard } from '../auth/subscription-required.guard';

@Controller('engines')
@UseGuards(JwtAuthGuard)
export class EnginesController {
  constructor(private readonly enginesService: EnginesService) {}

  @Post('strategy')
  @SubscriptionRequired('strategy-engine')
  @UseGuards(SubscriptionRequiredGuard)
  async runStrategy(@Body() body: any, @Req() req: { user: UserJwt }) {
    // Attach userId for gating
    return this.enginesService.runStrategyEngine({ ...body, userId: req.user.sub });
  }

  @Post('copy')
  @SubscriptionRequired('copy-engine')
  @UseGuards(SubscriptionRequiredGuard)
  async runCopy(@Body() body: any, @Req() req: { user: UserJwt }) {
    // Attach userId for gating
    return this.enginesService.runCopyEngine({ ...body, userId: req.user.sub });
  }
}

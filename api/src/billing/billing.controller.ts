// api/src/billing/billing.controller.ts
import { Controller, Post, Get, Body, Query, Req, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async createCheckout(@Body() body: { planId: string; successUrl: string; cancelUrl: string }, @Req() req: import('express').Request) {
    const tenantId = (req.user && 'tenantId' in req.user) ? (req.user as any).tenantId : undefined;
    return { url: await this.billingService.createCheckoutSession(body.planId, tenantId, body.successUrl, body.cancelUrl) };
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify')
  async verifyCheckout(@Query('session_id') sessionId: string, @Req() req: import('express').Request) {
    const tenantId = (req.user && 'tenantId' in req.user) ? (req.user as any).tenantId : undefined;
    return await this.billingService.verifyCheckoutSession(sessionId, tenantId);
  }
}

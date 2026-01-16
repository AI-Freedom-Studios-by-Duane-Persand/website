import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { UserJwt } from '../../../shared/user-jwt.interface';
import { AuthGuard } from '@nestjs/passport';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dtos/subscription.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.subscriptionsService.findAll(query);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('current')
  async getCurrentSubscription(@Request() req: ExpressRequest) {
    const user = req.user as any;
    const userId: string | undefined = user?.sub;
    const tenantId: string | undefined = user?.tenantId;

    console.debug('[SubscriptionsController][getCurrentSubscription] userId:', userId, 'tenantId:', tenantId);

    if (!userId) {
      throw new Error('User ID not found in request.');
    }

    // Fetch by userId while explicitly providing tenantId to avoid relying on TenantContextService
    return this.subscriptionsService.findByUserId(userId, tenantId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: ExpressRequest) {
    const user = req.user as any; // or as UserJwt if it matches
    const userId: string | undefined = user?.sub; // Correctly map sub property

    // Debugging log for userId
    console.debug('[SubscriptionsController][findOne] userId:', userId);

    return this.subscriptionsService.findOne(id, userId);
  }

  @Post()
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    const subscription = await this.subscriptionsService.create(createSubscriptionDto);

    // Update subscription status to active
    await this.subscriptionsService.updateSubscriptionStatus(subscription._id.toString(), 'active');

    return subscription;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(id, updateSubscriptionDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('subscription-status')
  async getSubscriptionStatus(@Request() req: ExpressRequest) {
    const user = req.user as any; // or as UserJwt if it matches
    const userId: string | undefined = user?.sub; // Correctly map sub property

    if (!userId) {
      throw new Error('User ID not found in request.');
    }

    return this.subscriptionsService.getSubscriptionStatus(userId);
  }
}

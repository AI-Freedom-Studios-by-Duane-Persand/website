import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { UserJwt } from '../../../shared/user-jwt.interface';
import { AuthGuard } from '@nestjs/passport';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from '../../../shared/subscription.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.subscriptionsService.findAll(query);
  }


  @UseGuards(AuthGuard('jwt'))
  @Get('my')
  async getMySubscription(@Request() req: ExpressRequest) {
    // In production, get userId from JWT (populated by AuthGuard)
    const user = req.user as UserJwt;
    const userId: string | undefined = user?.sub;
    if (!userId) {
      throw new Error('User ID not found in request.');
    }
    return this.subscriptionsService.findByUserId(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Post()
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(id, updateSubscriptionDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }
}

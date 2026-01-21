// api/src/scheduling/scheduling.controller.ts
import { Controller, Post, Body, UseGuards, Req, Get, Query } from '@nestjs/common';
import { UserJwt } from '../../../shared/user-jwt.interface';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('scheduling')
@UseGuards(JwtAuthGuard)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get()
  async listScheduled(
    @Req() req: import('express').Request,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.schedulingService.listScheduledItems({
      tenantId: req.user && 'tenantId' in req.user ? (req.user as UserJwt).tenantId : undefined,
      status: status as any,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? Number(limit) : 50,
    });
  }

  @Post('schedule')
  async scheduleCreative(@Body() body: { creativeId: string; platforms: string[]; scheduledAt: string; publisher: string }, @Req() req: import('express').Request) {
    const user = req.user as UserJwt;
    return this.schedulingService.scheduleCreative({
      tenantId: user?.tenantId,
      userId: user?.sub, // 'sub' is the user ID in JWT
      creativeId: body.creativeId,
      platforms: body.platforms,
      scheduledAt: new Date(body.scheduledAt),
      publisher: body.publisher,
    });
  }
}

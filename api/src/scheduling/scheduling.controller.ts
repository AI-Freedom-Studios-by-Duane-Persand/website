// api/src/scheduling/scheduling.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { UserJwt } from '../../../shared/user-jwt.interface';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('scheduling')
@UseGuards(JwtAuthGuard)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post('schedule')
  async scheduleCreative(@Body() body: { creativeId: string; platforms: string[]; scheduledAt: string; publisher: string }, @Req() req: import('express').Request) {
    return this.schedulingService.scheduleCreative({
      tenantId: (req.user && 'tenantId' in req.user) ? (req.user as UserJwt).tenantId : undefined,
      creativeId: body.creativeId,
      platforms: body.platforms,
      scheduledAt: new Date(body.scheduledAt),
      publisher: body.publisher,
    });
  }
}

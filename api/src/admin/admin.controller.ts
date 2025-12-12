import { BadRequestException, Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Inject } from '@nestjs/common';
import { Headers, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Package, PackageDocument } from '../models/package.model';
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: any,
    @InjectModel(Package.name) private readonly packageModel: Model<PackageDocument>,
  ) {}

  @Roles('admin')
  @Get('plans')
  async getPlans() {
    try {
      const plans = await this.packageModel.find({ active: true }).select('_id name').lean();
      return plans.map((p: any) => ({ id: p._id, name: p.name }));
    } catch (err) {
      throw new BadRequestException('Failed to fetch plans.');
    }
  }
  @Get('users')
  async listUsers() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id/roles')
  async updateUserRoles(@Param('id') id: string, @Body() body: { roles: string[] }) {
    return this.adminService.updateUserRoles(id, body.roles);
  }

  @Get('integrations')
  async listIntegrations() {
    return this.adminService.listIntegrations();
  }

  @Post('integrations/set')
  async setIntegrationConfig(@Body() body: { scope: 'global' | 'tenant'; service: string; config: any; tenantId?: string }) {
    return this.adminService.setIntegrationConfig(body.scope, body.service, body.config, body.tenantId);
  }

  @Get('summary')
  async getAdminSummary(
    @Body() body: any = {},
    @Param() params: any = {},
    @Query() query: any = {},
    @Headers() headers: any,
    @Req() req: any
  ) {
    // Log incoming request headers and cookies for diagnostics
    this.logger?.debug?.('[AdminController] /api/admin/summary request', {
      context: 'AdminController',
      timestamp: new Date().toISOString(),
      headers,
      cookies: req?.cookies,
      body,
      params,
      query,
      url: req?.url,
      method: req?.method,
    });
    return this.adminService.getAdminSummary();
  }
}

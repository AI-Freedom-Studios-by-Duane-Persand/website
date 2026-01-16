import { BadRequestException, Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Inject } from '@nestjs/common';
import { Headers, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: any,
  ) {}

  @Roles('admin')
  @Get('plans')
  async getPlans() {
    return this.adminService.getPlans();
  }

  @Get('users')
  async listUsers() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id/roles')
  async updateUserRoles(@Param('id') id: string, @Body() body: { roles: string[] }) {
    return this.adminService.updateUserRoles(id, body.roles);
  }

  @Get('tenants')
  @Roles('admin')
  async listTenants() {
    return this.adminService.listTenants();
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

  // Admin Subscriptions (list all without tenant filtering)
  @Get('subscriptions')
  async listAdminSubscriptions() {
    return this.adminService.listAdminSubscriptions();
  }

  @Get('subscriptions/:id')
  async getAdminSubscription(@Param('id') id: string) {
    return this.adminService.getAdminSubscription(id);
  }

  @Post('subscriptions')
  async createAdminSubscription(@Body() payload: any) {
    return this.adminService.createAdminSubscription(payload);
  }

  @Patch('subscriptions/:id')
  async updateAdminSubscription(@Param('id') id: string, @Body() payload: any) {
    return this.adminService.updateAdminSubscription(id, payload);
  }

  @Delete('subscriptions/:id')
  async deleteAdminSubscription(@Param('id') id: string) {
    return this.adminService.deleteAdminSubscription(id);
  }
}

export { }

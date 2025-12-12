import { Controller, Get, Post, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';
import { TenantModel, SubscriptionModel } from '../models';

@Controller('admin')
export class AdminController {

    @Roles('admin')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Get('plans')
    async getPlans() {
      try {
        const { Package } = require('../models');
        // Only return id and name for dropdowns
        const plans = await Package.find({ active: true }).select('_id name').lean();
        return plans.map((p: any) => ({ id: p._id, name: p.name }));
      } catch (err) {
        throw new BadRequestException('Failed to fetch plans.');
      }
    }
  @Roles('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('tenants')
  async getTenants() {
    try {
      // Join tenants with their primary user (admin) email
      const tenants = await TenantModel.find().lean();
      // For each tenant, find the first user with matching tenantId and role 'admin' or 'superadmin'
      const { UserModel } = require('../models/user.schema');
      const tenantsWithEmail = await Promise.all(
        tenants.map(async (tenant: any) => {
          const user = await UserModel.findOne({ tenantId: tenant._id, roles: { $in: ['admin', 'superadmin'] } }).lean();
          return {
            ...tenant,
            email: user?.email || '',
          };
        })
      );
      return tenantsWithEmail;
    } catch (err) {
      throw new BadRequestException('Failed to fetch tenants.');
    }
  }

  @Roles('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('integration-configs/:tenantId')
  async getIntegrationConfigs(@Param('tenantId') tenantId: string) {
    try {
      const tenant = await TenantModel.findById(tenantId);
      return tenant?.integrationConfigs || [];
    } catch (err) {
      throw new BadRequestException('Failed to fetch integration configs.');
    }
  }

  @Roles('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('subscription-override/:tenantId')
  async overrideSubscription(@Param('tenantId') tenantId: string, @Body() body: any) {
    try {
      const update: any = {};
      if (body.plan) update.plan = body.plan;
      if (body.renewal) update.renewal = body.renewal;
      if (body.status) update.status = body.status;
      await SubscriptionModel.updateOne({ tenantId }, update);
      return { success: true };
    } catch (err) {
      throw new BadRequestException('Failed to override subscription.');
    }
  }
}

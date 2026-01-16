// api/src/admin/admin.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '../integrations/config.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TenantsService } from '../tenants/tenants.service';
import { UserDocument } from '../users/schemas/user.schema';
import { CampaignDocument } from '../models/campaign.schema';
import { CreativeDocument } from '../creatives/schemas/creative.schema';
import { Subscription, SubscriptionDocument } from '../models/subscriptionV2.model';
import { TenantDocument } from '../tenants/schemas/tenant.schema';
import { EngineRunDocument } from '../models/engineRun.schema';
import { IntegrationConfigDocument } from '../models/integrationConfig.schema';
import { Package, PackageDocument } from '../models/package.model';

@Injectable()
export class AdminService {
  constructor(
    private readonly configService: ConfigService,
    private readonly tenantsService: TenantsService,
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    @InjectModel('Campaign') private readonly campaignModel: Model<CampaignDocument>,
    @InjectModel('Creative') private readonly creativeModel: Model<CreativeDocument>,
    @InjectModel(Subscription.name) private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel('Tenant') private readonly tenantModel: Model<TenantDocument>,
    @InjectModel('EngineRun') private readonly engineRunModel: Model<EngineRunDocument>,
    @InjectModel('IntegrationConfig') private readonly integrationConfigModel: Model<IntegrationConfigDocument>,
    @InjectModel(Package.name) private readonly packageModel: Model<PackageDocument>,
  ) {}


  async listUsers() {
    return this.userModel.find({}, { passwordHash: 0 });
  }

  async getPlans() {
    const plans = await this.packageModel.find({ active: true }).select('_id name').lean();
    return plans.map((p: any) => ({ id: p._id, name: p.name }));
  }

  async updateUserRoles(userId: string, roles: string[]) {
    return this.userModel.findByIdAndUpdate(userId, { roles }, { new: true, projection: { passwordHash: 0 } });
  }

  async listIntegrations() {
    return this.integrationConfigModel.find();
  }

  async setIntegrationConfig(scope: 'global' | 'tenant', service: string, configObj: any, tenantId?: string) {
    return this.configService.setConfig(scope, service, configObj, tenantId);
  }

  async listTenants() {
    return this.tenantsService.findAll({});
  }

  async listAdminSubscriptions() {
    return this.subscriptionModel.find({});
  }

  async getAdminSubscription(id: string) {
    return this.subscriptionModel.findById(id);
  }

  async updateAdminSubscription(id: string, update: any) {
    return this.subscriptionModel.findByIdAndUpdate(id, update, { new: true });
  }

  async deleteAdminSubscription(id: string) {
    return this.subscriptionModel.findByIdAndDelete(id);
  }

  async createAdminSubscription(payload: any) {
    return this.subscriptionModel.create(payload);
  }

  async updateTenantSubscription(tenantId: string, update: any) {
    return this.subscriptionModel.findOneAndUpdate({ tenantId }, update, { new: true });
  }

  async getAdminSummary() {
    const tenants = await this.tenantsService.findAll({});
    const users = await this.userModel.countDocuments();
    const campaigns = await this.campaignModel.countDocuments();
    const creatives = await this.creativeModel.countDocuments();
    const activeSubscriptions = await this.subscriptionModel.countDocuments({ status: 'active' });
    const totalRevenueAgg = await this.subscriptionModel.aggregate([
      { $match: { status: 'active', amountPaid: { $ne: null } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;
    // Asset uploads: sum of all creatives' imageUrls and videoUrls
    const assetCounts = await this.creativeModel.aggregate([
      {
        $group: {
          _id: null,
          imageCount: { $sum: { $size: { $ifNull: ['$assets.imageUrls', []] } } },
          videoCount: { $sum: { $cond: [{ $ifNull: ['$assets.videoUrl', false] }, 1, 0] } },
        },
      },
    ]);
    const assetsUploaded = (assetCounts[0]?.imageCount || 0) + (assetCounts[0]?.videoCount || 0);
    // Engines run: count of engineRun documents
    const enginesRun = await this.engineRunModel.countDocuments();
    return {
      tenants: tenants.length,
      users,
      campaigns,
      creatives,
      totalRevenue,
      activeSubscriptions,
      assetsUploaded,
      enginesRun,
    };
  }
}

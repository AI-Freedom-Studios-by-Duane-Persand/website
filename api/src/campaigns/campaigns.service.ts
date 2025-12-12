import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign } from '../../../shared/types';
import { CreateCampaignDto, UpdateCampaignDto } from '../../../shared/campaign.dto';
import { CampaignDocument } from '../models/campaign.schema';
import { InjectModel as InjectTenantModel } from '@nestjs/mongoose';
import { TenantDocument } from '../models/tenant.schema';
import { plans } from '../config/plans';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectModel('Campaign') private readonly campaignModel: Model<CampaignDocument>,
    @InjectTenantModel('Tenant') private readonly tenantModel: Model<TenantDocument>,
  ) {}

  async findAll(query: any): Promise<Campaign[]> {
    return this.campaignModel.find(query).exec();
  }

  async findOne(id: string): Promise<Campaign> {
    const campaign = await this.campaignModel.findById(id).exec();
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async create(createCampaignDto: CreateCampaignDto): Promise<Campaign> {
    // Enforce plan limits and subscription gating
    const tenant = await this.tenantModel.findById(createCampaignDto.tenantId).exec();
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (tenant.subscriptionStatus !== 'active') {
      throw new Error('Subscription inactive. Please renew to create campaigns.');
    }
    const plan = plans.find(p => p.planId === tenant.planId);
    if (!plan) throw new Error('Plan not found for tenant.');
    const campaignCount = await this.campaignModel.countDocuments({ tenantId: tenant._id });
    if (campaignCount >= plan.limits.campaigns) {
      throw new Error('Campaign limit reached for your plan.');
    }
    const createdCampaign = new this.campaignModel(createCampaignDto);
    return createdCampaign.save();
  }

  async update(id: string, updateCampaignDto: UpdateCampaignDto): Promise<Campaign> {
    const campaign = await this.campaignModel.findByIdAndUpdate(id, updateCampaignDto, { new: true }).exec();
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const res = await this.campaignModel.deleteOne({ _id: id }).exec();
    return { deleted: res.deletedCount > 0 };
  }
}

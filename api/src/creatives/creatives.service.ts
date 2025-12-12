import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Creative } from '../../../shared/types';
import { CreateCreativeDto, UpdateCreativeDto } from '../../../shared/creative.dto';
import { CreativeDocument } from '../models/creative.schema';
import { InjectModel as InjectTenantModel } from '@nestjs/mongoose';
import { TenantDocument } from '../models/tenant.schema';

@Injectable()
export class CreativesService {
  constructor(
    @InjectModel('Creative') private readonly creativeModel: Model<CreativeDocument>,
    @InjectTenantModel('Tenant') private readonly tenantModel: Model<TenantDocument>,
  ) {}

  async findAll(query: any): Promise<Creative[]> {
    return this.creativeModel.find(query).exec();
  }

  async findOne(id: string): Promise<Creative> {
    const creative = await this.creativeModel.findById(id).exec();
    if (!creative) throw new NotFoundException('Creative not found');
    return creative;
  }

  async create(createCreativeDto: CreateCreativeDto): Promise<Creative> {
    // Enforce subscription gating
    const tenant = await this.tenantModel.findById(createCreativeDto.tenantId).exec();
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (tenant.subscriptionStatus !== 'active') {
      throw new Error('Subscription inactive. Please renew to create creatives.');
    }
    const createdCreative = new this.creativeModel(createCreativeDto);
    return createdCreative.save();
  }

  async update(id: string, updateCreativeDto: UpdateCreativeDto): Promise<Creative> {
    const creative = await this.creativeModel.findByIdAndUpdate(id, updateCreativeDto, { new: true }).exec();
    if (!creative) throw new NotFoundException('Creative not found');
    return creative;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const res = await this.creativeModel.deleteOne({ _id: id }).exec();
    return { deleted: res.deletedCount > 0 };
  }
}

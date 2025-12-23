// (removed duplicate misplaced method)
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from '../../../shared/types';
import { CreateTenantDto, UpdateTenantDto } from '../../../shared/tenant.dto';
import { TenantDocument } from './schemas/tenant.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class TenantsService {
    // ...existing methods...

    async getTenantIdByName(name: string): Promise<string> {
      const tenant = await this.tenantModel.findOne({ name }).exec();
      if (!tenant) throw new NotFoundException('Tenant not found');
      return tenant._id.toString();
    }

    // Atomically find or create a tenant by name
    async findOrCreateByName(name: string, ownerEmail: string, session?: any): Promise<Tenant> {
      const update = {
        $setOnInsert: {
          name,
          subscriptionStatus: 'pending',
          planId: null,
          stripeCustomerId: null,
          ownerId: null,
          userIds: [],
        },
      };
      const options = { upsert: true, new: true, setDefaultsOnInsert: true, session };
      const tenant = await this.tenantModel.findOneAndUpdate({ name }, update, options).exec();
      if (!tenant) throw new NotFoundException('Tenant could not be created or found');
      return tenant as any;
    }

    async startTransaction(): Promise<any> {
      const session = await this.tenantModel.db.startSession();
      session.startTransaction();
      return session;
    }

    isValidTenantName(name: string): boolean {
      const regex = /^[a-zA-Z0-9_-]{3,50}$/; // Example validation
      return regex.test(name);
    }

    async update(id: string, updateTenantDto: UpdateTenantDto, session?: any): Promise<Tenant> {
      const options = { new: true, session };
      const tenant = await this.tenantModel.findByIdAndUpdate(id, updateTenantDto, options).exec();
      if (!tenant) throw new NotFoundException('Tenant not found');
      return tenant;
    }
  constructor(
    @InjectModel('Tenant') private readonly tenantModel: Model<TenantDocument>,
    private readonly usersService: UsersService,
  ) {}


  async findAll(query: any): Promise<Tenant[]> {
    return this.tenantModel.find(query).exec();
  }

  // Fetch only specific fields for efficiency (used by ids-names endpoint)
  async findAllFieldsOnly(fields: string[]): Promise<Partial<Tenant>[]> {
    return this.tenantModel.find({}, fields.reduce((acc, f) => ({ ...acc, [f]: 1 }), {})).exec();
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantModel.findById(id).exec();
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const createdTenant = new this.tenantModel(createTenantDto);
    return createdTenant.save();
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const res = await this.tenantModel.deleteOne({ _id: id }).exec();
    return { deleted: res.deletedCount > 0 };
  }

  async isReplicaSet(): Promise<boolean> {
    const admin = this.tenantModel.db.db.admin(); // Corrected access to admin
    const { replSetName } = await admin.command({ isMaster: 1 });
    return !!replSetName;
  }
}

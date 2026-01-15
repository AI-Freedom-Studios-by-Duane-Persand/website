/**
 * Campaign Repository
 * 
 * Concrete implementation of campaign data access layer.
 * Extends MongooseBaseRepository with campaign-specific queries.
 * 
 * All queries are automatically scoped to the current tenant via tenantId parameter.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign } from '../schemas/campaign.schema';
import { AdvancedMongooseRepository } from '../../infrastructure/repositories/base.repository';

/**
 * CampaignRepository - Data access for campaigns
 * Provides all CRUD operations plus campaign-specific queries
 */
@Injectable()
export class CampaignRepository extends AdvancedMongooseRepository<Campaign> {
  constructor(
    @InjectModel(Campaign.name) private readonly campaignModel: Model<Campaign>,
  ) {
    super(campaignModel);
  }

  /**
   * Find campaigns by status
   */
  async findByStatus(
    status: string,
    tenantId: string,
    options?: { skip?: number; limit?: number },
  ): Promise<Campaign[]> {
    return this.find({ status } as any, tenantId, options);
  }

  /**
   * Find active campaigns (draft or in progress)
   */
  async findActive(tenantId: string, options?: { skip?: number; limit?: number }): Promise<Campaign[]> {
    const filter = {
      status: { $in: ['draft', 'in_progress'] },
    };
    return this.find(filter as any, tenantId, options);
  }

  /**
   * Find campaigns by strategy ID
   */
  async findByStrategyId(strategyId: string, tenantId: string): Promise<Campaign[]> {
    return this.find({ strategyId } as any, tenantId);
  }

  /**
   * Find campaigns by user (creator)
   */
  async findByUserId(userId: string, tenantId: string, options?: { skip?: number; limit?: number }): Promise<Campaign[]> {
    return this.find({ createdBy: userId } as any, tenantId, options);
  }

  /**
   * Get campaign statistics for a tenant
   */
  async getStatistics(tenantId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    active: number;
    published: number;
  }> {
    const total = await this.count({}, tenantId);
    
    const statuses = await this.aggregate(
      [
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ],
      tenantId,
    );

    const byStatus: Record<string, number> = {};
    statuses.forEach((stat: any) => {
      byStatus[stat._id] = stat.count;
    });

    const active = await this.count({ status: { $in: ['draft', 'in_progress'] } } as any, tenantId);
    const published = await this.count({ status: 'published' } as any, tenantId);

    return {
      total,
      byStatus,
      active,
      published,
    };
  }

  /**
   * Find campaigns created in a date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<Campaign[]> {
    return this.find(
      {
        createdAt: { $gte: startDate, $lte: endDate },
      } as any,
      tenantId,
    );
  }

  /**
   * Search campaigns by name or description (case-insensitive)
   */
  async search(query: string, tenantId: string): Promise<Campaign[]> {
    const searchFilter = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    };
    return this.find(searchFilter as any, tenantId);
  }

  /**
   * Get campaigns with pagination and sorting
   */
  async getPaginated(
    tenantId: string,
    page: number = 1,
    pageSize: number = 10,
    filter?: { status?: string; strategyId?: string },
    sortBy: string = 'createdAt',
    sortOrder: 1 | -1 = -1,
  ) {
    const skip = (page - 1) * pageSize;
    const sort = { [sortBy]: sortOrder };

    return this.findWithPagination(filter || {}, tenantId, page, pageSize, sort);
  }
}

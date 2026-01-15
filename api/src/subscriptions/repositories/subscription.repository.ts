/**
 * Subscription Repository
 * 
 * Concrete implementation of subscription data access layer.
 * Extends MongooseBaseRepository with subscription-specific queries.
 * 
 * All queries are automatically scoped to the current tenant via tenantId parameter.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { AdvancedMongooseRepository } from '../../infrastructure/repositories/base.repository';

// Subscription document type (use generic Document if Subscription class not available)
export interface ISubscription extends Document {
  userId: string;
  planId: string;
  status: string;
  expiresAt: Date;
  autoRenew?: boolean;
  tenantId: string;
  price?: number;
  createdAt?: Date;
  renewedAt?: Date;
  cancelledAt?: Date;
}

type Subscription = ISubscription;

/**
 * SubscriptionRepository - Data access for subscriptions
 * Provides all CRUD operations plus subscription-specific queries
 */
@Injectable()
export class SubscriptionRepository extends AdvancedMongooseRepository<Subscription> {
  constructor(
    @InjectModel('Subscription') private readonly subscriptionModel: Model<Subscription>,
  ) {
    super(subscriptionModel);
  }

  /**
   * Find active subscriptions
   */
  async findActive(tenantId: string, options?: { skip?: number; limit?: number }): Promise<Subscription[]> {
    return this.find(
      {
        status: 'active',
        expiresAt: { $gt: new Date() },
      } as any,
      tenantId,
      options,
    );
  }

  /**
   * Find expired subscriptions
   */
  async findExpired(tenantId: string): Promise<Subscription[]> {
    return this.find(
      {
        expiresAt: { $lte: new Date() },
      } as any,
      tenantId,
    );
  }

  /**
   * Find subscriptions by status
   */
  async findByStatus(
    status: string,
    tenantId: string,
    options?: { skip?: number; limit?: number },
  ): Promise<Subscription[]> {
    return this.find({ status } as any, tenantId, options);
  }

  /**
   * Find subscription by user ID
   */
  async findByUserId(userId: string, tenantId: string): Promise<Subscription | null> {
    return this.findOne({ userId } as any, tenantId);
  }

  /**
   * Find subscriptions by plan ID
   */
  async findByPlanId(planId: string, tenantId: string): Promise<Subscription[]> {
    return this.find({ planId } as any, tenantId);
  }

  /**
   * Find subscriptions expiring soon (within X days)
   */
  async findExpiringBefore(days: number, tenantId: string): Promise<Subscription[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    return this.find(
      {
        expiresAt: {
          $gt: new Date(),
          $lte: expiryDate,
        },
        status: 'active',
      } as any,
      tenantId,
    );
  }

  /**
   * Find subscriptions by renewal status
   */
  async findByRenewalStatus(autoRenew: boolean, tenantId: string): Promise<Subscription[]> {
    return this.find({ autoRenew } as any, tenantId);
  }

  /**
   * Get subscription statistics for a tenant
   */
  async getStatistics(tenantId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    autoRenewing: number;
    byPlan: Record<string, number>;
    totalRevenue: number;
  }> {
    const total = await this.count({}, tenantId);
    const active = await this.count(
      {
        status: 'active',
        expiresAt: { $gt: new Date() },
      } as any,
      tenantId,
    );
    const expired = await this.count(
      {
        expiresAt: { $lte: new Date() },
      } as any,
      tenantId,
    );
    const autoRenewing = await this.count({ autoRenew: true } as any, tenantId);

    const planStats = await this.aggregate(
      [
        {
          $group: {
            _id: '$planId',
            count: { $sum: 1 },
          },
        },
      ],
      tenantId,
    );

    const byPlan: Record<string, number> = {};
    planStats.forEach((stat: any) => {
      byPlan[stat._id] = stat.count;
    });

    const revenueStats = await this.aggregate(
      [
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$price' },
          },
        },
      ],
      tenantId,
    );

    const totalRevenue = revenueStats[0]?.totalRevenue || 0;

    return {
      total,
      active,
      expired,
      autoRenewing,
      byPlan,
      totalRevenue,
    };
  }

  /**
   * Find subscriptions created in a date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<Subscription[]> {
    return this.find(
      {
        createdAt: { $gte: startDate, $lte: endDate },
      } as any,
      tenantId,
    );
  }

  /**
   * Get subscriptions with pagination
   */
  async getPaginated(
    tenantId: string,
    page: number = 1,
    pageSize: number = 10,
    filter?: { status?: string; planId?: string; autoRenew?: boolean },
    sortBy: string = 'createdAt',
    sortOrder: 1 | -1 = -1,
  ) {
    const sort = { [sortBy]: sortOrder };
    return this.findWithPagination(filter || {}, tenantId, page, pageSize, sort);
  }

  /**
   * Mark subscription as expired
   */
  async markExpired(subscriptionId: string, tenantId: string): Promise<Subscription | null> {
    return this.updateById(subscriptionId, { status: 'expired' } as any, tenantId);
  }

  /**
   * Renew subscription
   */
  async renewSubscription(subscriptionId: string, newExpiryDate: Date, tenantId: string): Promise<Subscription | null> {
    return this.updateById(
      subscriptionId,
      {
        status: 'active',
        expiresAt: newExpiryDate,
        renewedAt: new Date(),
      } as any,
      tenantId,
    );
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, tenantId: string): Promise<Subscription | null> {
    return this.updateById(
      subscriptionId,
      {
        status: 'cancelled',
        cancelledAt: new Date(),
      } as any,
      tenantId,
    );
  }

  /**
   * Protected method for error handling
   */
  protected handleError(error: any, context: string): Error {
    return super.handleError(error, context);
  }
}

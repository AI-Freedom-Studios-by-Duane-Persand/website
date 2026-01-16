/**
 * User Repository
 * 
 * Concrete implementation of user data access layer.
 * Extends MongooseBaseRepository with user-specific queries.
 * 
 * All queries are automatically scoped to the current tenant via tenantId parameter.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { AdvancedMongooseRepository } from '../../infrastructure/repositories/base.repository';

// User document type (use generic Document if User class not available)
export interface IUser extends Document {
  email: string;
  name?: string;
  role?: string;
  tenantId: string;
  isDeactivated?: boolean;
  lastLoginAt?: Date;
  subscriptionStatus?: string;
  createdAt?: Date;
}

type User = IUser;

/**
 * UserRepository - Data access for users
 * Provides all CRUD operations plus user-specific queries
 */
@Injectable()
export class UserRepository extends AdvancedMongooseRepository<User> {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
  ) {
    super(userModel);
  }

  /**
   * Find user by email within a tenant
   */
  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    return this.findOne({ email } as any, tenantId);
  }

  /**
   * Find user by email globally (across all tenants)
   * Used for authentication checks
   */
  async findByEmailGlobal(email: string): Promise<User | null> {
    try {
      return await this.model.findOne({ email }).exec();
    } catch (error) {
      throw this.handleError(error, `Failed to find user by email: ${email}`);
    }
  }

  /**
   * Find user by ID globally (across all tenants)
   * Used for /api/auth/me endpoint where user is already authenticated
   */
  async findByIdGlobal(id: string): Promise<User | null> {
    try {
      return await this.model.findById(id).exec();
    } catch (error) {
      throw this.handleError(error, `Failed to find user by ID: ${id}`);
    }
  }

  /**
   * Find users by role
   */
  async findByRole(role: string, tenantId: string): Promise<User[]> {
    return this.find({ role } as any, tenantId);
  }

  /**
   * Find active users (not deactivated)
   */
  async findActive(tenantId: string, options?: { skip?: number; limit?: number }): Promise<User[]> {
    return this.find({ isDeactivated: false } as any, tenantId, options);
  }

  /**
   * Find users by subscription status
   */
  async findBySubscriptionStatus(status: string, tenantId: string): Promise<User[]> {
    return this.find({ subscriptionStatus: status } as any, tenantId);
  }

  /**
   * Find users created in a date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<User[]> {
    return this.find(
      {
        createdAt: { $gte: startDate, $lte: endDate },
      } as any,
      tenantId,
    );
  }

  /**
   * Search users by name or email (case-insensitive)
   */
  async search(query: string, tenantId: string): Promise<User[]> {
    const searchFilter = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    };
    return this.find(searchFilter as any, tenantId);
  }

  /**
   * Get users with pagination
   */
  async getPaginated(
    tenantId: string,
    page: number = 1,
    pageSize: number = 10,
    filter?: { role?: string; isDeactivated?: boolean },
    sortBy: string = 'createdAt',
    sortOrder: 1 | -1 = -1,
  ) {
    const sort = { [sortBy]: sortOrder };
    return this.findWithPagination(filter || {}, tenantId, page, pageSize, sort);
  }

  /**
   * Get user statistics for a tenant
   */
  async getStatistics(tenantId: string): Promise<{
    total: number;
    active: number;
    deactivated: number;
    byRole: Record<string, number>;
  }> {
    const total = await this.count({}, tenantId);
    const active = await this.count({ isDeactivated: false } as any, tenantId);
    const deactivated = await this.count({ isDeactivated: true } as any, tenantId);

    const roleStats = await this.aggregate(
      [
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
      ],
      tenantId,
    );

    const byRole: Record<string, number> = {};
    roleStats.forEach((stat: any) => {
      byRole[stat._id] = stat.count;
    });

    return {
      total,
      active,
      deactivated,
      byRole,
    };
  }

  /**
   * Find users who haven't logged in for X days
   */
  async findInactiveUsers(days: number, tenantId: string): Promise<User[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.find(
      {
        lastLoginAt: { $lt: cutoffDate },
      } as any,
      tenantId,
    );
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string, tenantId: string): Promise<User | null> {
    return this.updateById(userId, { lastLoginAt: new Date() } as any, tenantId);
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId: string, tenantId: string): Promise<User | null> {
    return this.updateById(userId, { isDeactivated: true } as any, tenantId);
  }

  /**
   * Reactivate user
   */
  async reactivateUser(userId: string, tenantId: string): Promise<User | null> {
    return this.updateById(userId, { isDeactivated: false } as any, tenantId);
  }

  /**
   * Protected method for error handling
   */
  protected handleError(error: any, context: string): Error {
    return super.handleError(error, context);
  }
}

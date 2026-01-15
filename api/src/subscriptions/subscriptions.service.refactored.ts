/**
 * Refactored Subscriptions Service
 * 
 * Now uses SubscriptionRepository instead of direct model injection.
 * Automatically gets tenant context from TenantContextService.
 * Uses @Transactional decorator for transaction management.
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { TenantContextService } from '../../infrastructure/context/tenant-context';
import { Transactional } from '../../infrastructure/decorators/transactional.decorator';
import { CreateSubscriptionDto } from '../dtos/create-subscription.dto';
import { UpdateSubscriptionDto } from '../dtos/update-subscription.dto';
import { SubscriptionDto } from '../dtos/subscription.dto';

/**
 * SubscriptionsService - Business logic for subscription management
 * 
 * Now uses:
 * - SubscriptionRepository for data access (no direct model injection)
 * - TenantContextService for automatic tenant scoping
 * - @Transactional decorator for session/transaction management
 */
@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Create a new subscription
   * Uses @Transactional for automatic session management
   */
  @Transactional()
  async create(createDto: CreateSubscriptionDto): Promise<SubscriptionDto> {
    try {
      const tenantId = this.tenantContext.getTenantId();
      const userId = this.tenantContext.getUserId();

      // Validate subscription plan exists
      if (!createDto.planId) {
        throw new BadRequestException('Plan ID is required');
      }

      // Create new subscription
      const subscription = await this.subscriptionRepository.create(
        {
          userId,
          planId: createDto.planId,
          status: 'active',
          tenantId,
          startDate: new Date(),
          endDate: this.calculateEndDate(createDto.planId),
          autoRenew: createDto.autoRenew !== false,
          createdAt: new Date(),
        } as any,
        tenantId,
      );

      this.logger.log(`Subscription created: ${subscription._id}`);
      return this.mapToSubscriptionDto(subscription);
    } catch (error) {
      this.logger.error('Subscription creation failed', error);
      throw error;
    }
  }

  /**
   * Get subscription by ID
   * Automatically scoped to tenant
   */
  async findById(subscriptionId: string): Promise<SubscriptionDto> {
    const tenantId = this.tenantContext.getTenantId();
    const subscription = await this.subscriptionRepository.findById(subscriptionId, tenantId);

    if (!subscription) {
      throw new NotFoundException(`Subscription ${subscriptionId} not found`);
    }

    return this.mapToSubscriptionDto(subscription);
  }

  /**
   * Get all active subscriptions for user
   */
  async findActiveForUser(): Promise<SubscriptionDto[]> {
    const tenantId = this.tenantContext.getTenantId();
    const userId = this.tenantContext.getUserId();

    const subscriptions = await this.subscriptionRepository.findByUserId(userId, tenantId);
    const active = subscriptions.filter((s) => s.status === 'active');

    return active.map((s) => this.mapToSubscriptionDto(s));
  }

  /**
   * Get all subscriptions for the current tenant
   * Uses built-in pagination support
   */
  async findAll(
    page: number = 1,
    pageSize: number = 10,
    filter?: { status?: string; planId?: string },
  ): Promise<{ items: SubscriptionDto[]; total: number; page: number; pageSize: number }> {
    const tenantId = this.tenantContext.getTenantId();

    const result = await this.subscriptionRepository.getPaginated(
      tenantId,
      page,
      pageSize,
      filter,
    );

    return {
      items: result.items.map((s) => this.mapToSubscriptionDto(s)),
      total: result.pagination.total,
      page: result.pagination.page,
      pageSize: result.pagination.pageSize,
    };
  }

  /**
   * Get active subscriptions
   */
  async findActive(page: number = 1, pageSize: number = 10): Promise<SubscriptionDto[]> {
    const tenantId = this.tenantContext.getTenantId();

    const subscriptions = await this.subscriptionRepository.findActive(tenantId);
    const paginated = subscriptions.slice((page - 1) * pageSize, page * pageSize);

    return paginated.map((s) => this.mapToSubscriptionDto(s));
  }

  /**
   * Get expired subscriptions
   */
  async findExpired(): Promise<SubscriptionDto[]> {
    const tenantId = this.tenantContext.getTenantId();

    const subscriptions = await this.subscriptionRepository.findExpired(tenantId);
    return subscriptions.map((s) => this.mapToSubscriptionDto(s));
  }

  /**
   * Get subscriptions expiring before a certain date
   * Useful for renewal notifications
   */
  async findExpiringBefore(expiryDate: Date): Promise<SubscriptionDto[]> {
    const tenantId = this.tenantContext.getTenantId();

    const subscriptions = await this.subscriptionRepository.findExpiringBefore(
      expiryDate,
      tenantId,
    );

    return subscriptions.map((s) => this.mapToSubscriptionDto(s));
  }

  /**
   * Get subscriptions by status
   */
  async findByStatus(status: string): Promise<SubscriptionDto[]> {
    const tenantId = this.tenantContext.getTenantId();

    const subscriptions = await this.subscriptionRepository.findByStatus(status, tenantId);
    return subscriptions.map((s) => this.mapToSubscriptionDto(s));
  }

  /**
   * Get subscriptions by plan
   */
  async findByPlanId(planId: string): Promise<SubscriptionDto[]> {
    const tenantId = this.tenantContext.getTenantId();

    const subscriptions = await this.subscriptionRepository.findByPlanId(planId, tenantId);
    return subscriptions.map((s) => this.mapToSubscriptionDto(s));
  }

  /**
   * Get subscription statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    expired: number;
    autoRenewing: number;
    byPlan: Record<string, number>;
    totalRevenue: number;
  }> {
    const tenantId = this.tenantContext.getTenantId();
    return this.subscriptionRepository.getStatistics(tenantId);
  }

  /**
   * Renew subscription
   * Uses @Transactional for automatic session management
   */
  @Transactional()
  async renew(subscriptionId: string): Promise<SubscriptionDto> {
    const tenantId = this.tenantContext.getTenantId();

    // Verify ownership before renewing
    const subscription = await this.subscriptionRepository.findById(subscriptionId, tenantId);
    if (!subscription) {
      throw new NotFoundException(`Subscription ${subscriptionId} not found`);
    }

    // Calculate new end date
    const newEndDate = this.calculateEndDate(subscription.planId);

    const updated = await this.subscriptionRepository.renewSubscription(
      subscriptionId,
      newEndDate,
      tenantId,
    );

    if (!updated) {
      throw new NotFoundException(`Failed to renew subscription ${subscriptionId}`);
    }

    this.logger.log(`Subscription renewed: ${subscriptionId}`);
    return this.mapToSubscriptionDto(updated);
  }

  /**
   * Cancel subscription
   * Uses @Transactional for automatic session management
   */
  @Transactional()
  async cancel(subscriptionId: string): Promise<SubscriptionDto> {
    const tenantId = this.tenantContext.getTenantId();

    // Verify ownership before canceling
    const subscription = await this.subscriptionRepository.findById(subscriptionId, tenantId);
    if (!subscription) {
      throw new NotFoundException(`Subscription ${subscriptionId} not found`);
    }

    const updated = await this.subscriptionRepository.cancelSubscription(subscriptionId, tenantId);

    if (!updated) {
      throw new NotFoundException(`Failed to cancel subscription ${subscriptionId}`);
    }

    this.logger.log(`Subscription canceled: ${subscriptionId}`);
    return this.mapToSubscriptionDto(updated);
  }

  /**
   * Mark subscription as expired
   * Uses @Transactional for automatic session management
   */
  @Transactional()
  async markExpired(subscriptionId: string): Promise<SubscriptionDto> {
    const tenantId = this.tenantContext.getTenantId();

    const updated = await this.subscriptionRepository.markExpired(subscriptionId, tenantId);

    if (!updated) {
      throw new NotFoundException(`Subscription ${subscriptionId} not found`);
    }

    this.logger.log(`Subscription marked as expired: ${subscriptionId}`);
    return this.mapToSubscriptionDto(updated);
  }

  /**
   * Update subscription
   * Uses @Transactional for automatic session management
   */
  @Transactional()
  async update(subscriptionId: string, updateDto: UpdateSubscriptionDto): Promise<SubscriptionDto> {
    const tenantId = this.tenantContext.getTenantId();

    // Verify ownership before update
    const subscription = await this.subscriptionRepository.findById(subscriptionId, tenantId);
    if (!subscription) {
      throw new NotFoundException(`Subscription ${subscriptionId} not found`);
    }

    const updated = await this.subscriptionRepository.updateById(
      subscriptionId,
      updateDto as any,
      tenantId,
    );

    if (!updated) {
      throw new NotFoundException(`Failed to update subscription ${subscriptionId}`);
    }

    this.logger.log(`Subscription updated: ${subscriptionId}`);
    return this.mapToSubscriptionDto(updated);
  }

  /**
   * Delete subscription
   * Uses @Transactional for automatic session management
   */
  @Transactional()
  async delete(subscriptionId: string): Promise<boolean> {
    const tenantId = this.tenantContext.getTenantId();

    // Verify ownership before delete
    const exists = await this.subscriptionRepository.findById(subscriptionId, tenantId);
    if (!exists) {
      throw new NotFoundException(`Subscription ${subscriptionId} not found`);
    }

    const deleted = await this.subscriptionRepository.deleteById(subscriptionId, tenantId);

    if (deleted) {
      this.logger.log(`Subscription deleted: ${subscriptionId}`);
    }

    return deleted;
  }

  /**
   * Calculate subscription end date based on plan
   * @TODO: Replace with actual plan pricing tier logic
   */
  private calculateEndDate(planId: string): Date {
    const endDate = new Date();

    // Default to 1 month from now
    endDate.setMonth(endDate.getMonth() + 1);

    // @TODO: Use plan configuration to determine duration
    // For now, return default 30-day subscription
    return endDate;
  }

  /**
   * Map subscription document to DTO
   */
  private mapToSubscriptionDto(subscription: any): SubscriptionDto {
    return {
      id: subscription._id?.toString(),
      userId: subscription.userId,
      planId: subscription.planId,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      autoRenew: subscription.autoRenew,
      createdAt: subscription.createdAt,
      tenantId: subscription.tenantId,
    } as SubscriptionDto;
  }
}

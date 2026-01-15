/**
 * Refactored Subscriptions Service Template
 * 
 * This is a reference template showing how to refactor services to use the repository pattern.
 * FILE LOCATION: docs/code-examples/subscriptions.service.refactored.ts
 * 
 * Do NOT place this file in the actual source tree, as it will be compiled.
 * Use it as a reference when refactoring api/src/subscriptions/subscriptions.service.ts
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { TenantContextService } from '../../infrastructure/context/tenant-context';
import { Transactional } from '../../infrastructure/decorators/transactional.decorator';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Transactional()
  async create(createDto: any): Promise<any> {
    try {
      const tenantId = this.tenantContext.getTenantId();
      const userId = this.tenantContext.getUserId();

      if (!createDto.planId) {
        throw new BadRequestException('Plan ID is required');
      }

      const subscription = await this.subscriptionRepository.create(
        {
          userId,
          planId: createDto.planId,
          status: 'active',
          tenantId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
          autoRenew: createDto.autoRenew !== false,
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

  async findById(subscriptionId: string): Promise<any> {
    const tenantId = this.tenantContext.getTenantId();
    const subscription = await this.subscriptionRepository.findById(subscriptionId, tenantId);

    if (!subscription) {
      throw new NotFoundException(`Subscription ${subscriptionId} not found`);
    }

    return this.mapToSubscriptionDto(subscription);
  }

  async findActiveForUser(): Promise<any[]> {
    const tenantId = this.tenantContext.getTenantId();
    const userId = this.tenantContext.getUserId();

    const subscriptions = await this.subscriptionRepository.findByUserId(userId, tenantId);
    const active = subscriptions ? subscriptions.filter((s) => s.status === 'active') : [];

    return active.map((s) => this.mapToSubscriptionDto(s));
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    filter?: any,
  ): Promise<{ items: any[]; total: number; page: number; pageSize: number }> {
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

  async findActive(page: number = 1, pageSize: number = 10): Promise<any[]> {
    const tenantId = this.tenantContext.getTenantId();

    const subscriptions = await this.subscriptionRepository.findActive(tenantId);
    const paginated = subscriptions.slice((page - 1) * pageSize, page * pageSize);

    return paginated.map((s) => this.mapToSubscriptionDto(s));
  }

  async findExpired(): Promise<any[]> {
    const tenantId = this.tenantContext.getTenantId();

    const subscriptions = await this.subscriptionRepository.findExpired(tenantId);
    return subscriptions.map((s) => this.mapToSubscriptionDto(s));
  }

  async findByStatus(status: string): Promise<any[]> {
    const tenantId = this.tenantContext.getTenantId();

    const subscriptions = await this.subscriptionRepository.findByStatus(status, tenantId);
    return subscriptions.map((s) => this.mapToSubscriptionDto(s));
  }

  async getStatistics(): Promise<any> {
    const tenantId = this.tenantContext.getTenantId();
    return this.subscriptionRepository.getStatistics(tenantId);
  }

  @Transactional()
  async renew(subscriptionId: string): Promise<any> {
    const tenantId = this.tenantContext.getTenantId();

    const subscription = await this.subscriptionRepository.findById(subscriptionId, tenantId);
    if (!subscription) {
      throw new NotFoundException(`Subscription ${subscriptionId} not found`);
    }

    const newEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

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

  @Transactional()
  async cancel(subscriptionId: string): Promise<any> {
    const tenantId = this.tenantContext.getTenantId();

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

  @Transactional()
  async delete(subscriptionId: string): Promise<boolean> {
    const tenantId = this.tenantContext.getTenantId();

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

  private mapToSubscriptionDto(subscription: any): any {
    return {
      id: subscription._id?.toString(),
      userId: subscription.userId,
      planId: subscription.planId,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      autoRenew: subscription.autoRenew,
      tenantId: subscription.tenantId,
      createdAt: subscription.createdAt,
    };
  }
}

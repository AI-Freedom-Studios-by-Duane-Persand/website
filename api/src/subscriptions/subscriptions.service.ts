import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dtos/subscription.dto';
import { Subscription, SubscriptionDocument } from '../models/subscriptionV2.model';
import { Logger } from 'winston';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { TenantContextService } from '../infrastructure/context/tenant-context';
import { Transactional } from '../infrastructure/decorators/transactional.decorator';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly tenantContext: TenantContextService,
    @Inject('winston') private readonly logger: Logger,
  ) {}

  // Find subscription by userId (for /subscriptions/my)
  async findByUserId(userId: string, tenantId?: string): Promise<SubscriptionDocument | null> {
    const resolvedTenantId = tenantId || this.tenantContext.getTenantId();
    return (await this.subscriptionRepository.findOne({ userId } as any, resolvedTenantId)) as any;
  }

  async findAll(query?: any, tenantId?: string): Promise<SubscriptionDocument[]> {
    const resolvedTenantId = tenantId || this.tenantContext.getTenantId();
    const filter = query || {};
    return (await this.subscriptionRepository.find(filter as any, resolvedTenantId)) as any;
  }

  async findOne(id: string, userId?: string, tenantId?: string): Promise<SubscriptionDocument> {
    const resolvedTenantId = tenantId || this.tenantContext.getTenantId();

    if (id === 'my') {
      if (!userId) {
        throw new Error('User ID is required to fetch the subscription.');
      }
      const subscription = await this.findByUserId(userId, resolvedTenantId);
      if (!subscription) throw new NotFoundException('Subscription not found');
      return subscription as any;
    }

    if (id === 'subscription-status' || id === 'status') {
      if (!userId) {
        throw new Error('User ID is required to fetch the subscription status.');
      }
      const subscription = await this.findByUserId(userId, resolvedTenantId);
      if (!subscription) throw new NotFoundException('Subscription not found');
      return subscription as any;
    }

    const subscription = await this.subscriptionRepository.findById(id, resolvedTenantId);
    if (!subscription) throw new NotFoundException('Subscription not found');
    return subscription as any;
  }

  @Transactional()
  async create(createSubscriptionDto: CreateSubscriptionDto, tenantId?: string): Promise<SubscriptionDocument> {
    const resolvedTenantId = tenantId || this.tenantContext.getTenantId();
    const subscriptionData = { ...createSubscriptionDto, tenantId: resolvedTenantId };
    return (await this.subscriptionRepository.create(subscriptionData as any, resolvedTenantId)) as any;
  }

  @Transactional()
  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto, tenantId?: string): Promise<SubscriptionDocument> {
    const resolvedTenantId = tenantId || this.tenantContext.getTenantId();
    const subscription = await this.subscriptionRepository.updateById(id, updateSubscriptionDto as any, resolvedTenantId);
    if (!subscription) throw new NotFoundException('Subscription not found');
    return subscription as any;
  }

  @Transactional()
  async remove(id: string, tenantId?: string): Promise<{ deleted: boolean }> {
    const resolvedTenantId = tenantId || this.tenantContext.getTenantId();
    const result = await this.subscriptionRepository.deleteById(id, resolvedTenantId);
    return { deleted: result };
  }

  async getSubscriptionStatus(userId: string, tenantId?: string): Promise<{ status: string }> {
    const resolvedTenantId = tenantId || this.tenantContext.getTenantId();
    this.logger.info('Fetching subscription status', { userId });
    const subscription = await this.findByUserId(userId, resolvedTenantId);
    if (!subscription || (subscription as any).status !== 'active') {
      this.logger.warn('No active subscription found', { userId });
      return { status: 'inactive' };
    }
    this.logger.info('Active subscription found', { userId, subscriptionId: (subscription as any)._id });
    return { status: 'active' };
  }

  @Transactional()
  async updateSubscriptionStatus(subscriptionId: string, status: string, tenantId?: string): Promise<void> {
    const resolvedTenantId = tenantId || this.tenantContext.getTenantId();
    await this.subscriptionRepository.updateById(subscriptionId, { status } as any, resolvedTenantId);
  }
}

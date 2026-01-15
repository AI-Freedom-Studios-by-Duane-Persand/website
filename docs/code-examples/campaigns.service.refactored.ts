/**
 * Refactored Campaigns Service Template
 * 
 * This is a reference template showing how to refactor services to use the repository pattern.
 * FILE LOCATION: docs/code-examples/campaigns.service.refactored.ts
 * 
 * Do NOT place this file in the actual source tree, as it will be compiled.
 * Use it as a reference when refactoring api/src/campaigns/campaigns.service.ts
 * 
 * Key Changes:
 * 1. Remove: @InjectModel('Campaign') injection
 * 2. Add: CampaignRepository + TenantContextService injection
 * 3. Replace: All model.find() with repository.findActive() etc.
 * 4. Add: @Transactional() on write operations
 * 5. Add: tenantId extraction from TenantContextService
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { CampaignRepository } from './repositories/campaign.repository';
import { TenantContextService } from '../../infrastructure/context/tenant-context';
import { Transactional } from '../../infrastructure/decorators/transactional.decorator';

/**
 * CampaignsService - Business logic for campaign management
 * 
 * Now uses:
 * - CampaignRepository for data access (no direct model injection)
 * - TenantContextService for automatic tenant scoping
 * - @Transactional decorator for session/transaction management
 */
@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Create a new campaign
   * Uses @Transactional for automatic session management
   */
  @Transactional()
  async create(createDto: any): Promise<any> {
    try {
      const tenantId = this.tenantContext.getTenantId();

      // Create new campaign
      const campaign = await this.campaignRepository.create(
        { ...createDto, tenantId } as any,
        tenantId,
      );

      this.logger.log(`Campaign created: ${campaign._id}`);
      return this.mapToCampaignDto(campaign);
    } catch (error) {
      this.logger.error('Campaign creation failed', error);
      throw error;
    }
  }

  /**
   * Get campaign by ID
   * Automatically scoped to tenant
   */
  async findById(id: string): Promise<any> {
    const tenantId = this.tenantContext.getTenantId();
    const campaign = await this.campaignRepository.findById(id, tenantId);

    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    return this.mapToCampaignDto(campaign);
  }

  /**
   * Get all campaigns for the current tenant
   * Uses built-in pagination support
   */
  async findAll(
    page: number = 1,
    pageSize: number = 10,
    filter?: any,
  ): Promise<{ items: any[]; total: number; page: number; pageSize: number }> {
    const tenantId = this.tenantContext.getTenantId();

    const result = await this.campaignRepository.getPaginated(
      tenantId,
      page,
      pageSize,
      filter,
    );

    return {
      items: result.items.map((c) => this.mapToCampaignDto(c)),
      total: result.pagination.total,
      page: result.pagination.page,
      pageSize: result.pagination.pageSize,
    };
  }

  /**
   * Get active campaigns
   */
  async findActive(page: number = 1, pageSize: number = 10): Promise<any[]> {
    const tenantId = this.tenantContext.getTenantId();

    const campaigns = await this.campaignRepository.findActive(tenantId);
    const paginated = campaigns.slice((page - 1) * pageSize, page * pageSize);

    return paginated.map((c) => this.mapToCampaignDto(c));
  }

  /**
   * Get campaigns by status
   */
  async findByStatus(status: string): Promise<any[]> {
    const tenantId = this.tenantContext.getTenantId();

    const campaigns = await this.campaignRepository.findByStatus(status, tenantId);
    return campaigns.map((c) => this.mapToCampaignDto(c));
  }

  /**
   * Search campaigns
   */
  async search(query: string): Promise<any[]> {
    const tenantId = this.tenantContext.getTenantId();

    const campaigns = await this.campaignRepository.search(query, tenantId);
    return campaigns.map((c) => this.mapToCampaignDto(c));
  }

  /**
   * Get campaign statistics
   */
  async getStatistics(): Promise<any> {
    const tenantId = this.tenantContext.getTenantId();
    return this.campaignRepository.getStatistics(tenantId);
  }

  /**
   * Update campaign
   * Uses @Transactional for automatic session management
   */
  @Transactional()
  async update(id: string, updateDto: any): Promise<any> {
    const tenantId = this.tenantContext.getTenantId();

    // Verify ownership before update
    const campaign = await this.campaignRepository.findById(id, tenantId);
    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    const updated = await this.campaignRepository.updateById(id, updateDto as any, tenantId);

    if (!updated) {
      throw new NotFoundException(`Failed to update campaign ${id}`);
    }

    this.logger.log(`Campaign updated: ${id}`);
    return this.mapToCampaignDto(updated);
  }

  /**
   * Delete campaign
   * Uses @Transactional for automatic session management
   */
  @Transactional()
  async delete(id: string): Promise<boolean> {
    const tenantId = this.tenantContext.getTenantId();

    // Verify ownership before delete
    const exists = await this.campaignRepository.findById(id, tenantId);
    if (!exists) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    const deleted = await this.campaignRepository.deleteById(id, tenantId);

    if (deleted) {
      this.logger.log(`Campaign deleted: ${id}`);
    }

    return deleted;
  }

  /**
   * Map campaign document to DTO
   */
  private mapToCampaignDto(campaign: any): any {
    return {
      id: campaign._id?.toString(),
      name: campaign.name,
      status: campaign.status,
      tenantId: campaign.tenantId,
      createdAt: campaign.createdAt,
      // ... map other fields
    };
  }
}

/**
 * Refactored Campaigns Service
 * 
 * Now uses CampaignRepository instead of direct model injection.
 * Automatically gets tenant context from TenantContextService.
 * Uses @Transactional decorator for transaction management.
 * 
 * This is a template showing how to refactor services.
 * Apply the same pattern to other services.
 */

import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { CampaignRepository } from './repositories/campaign.repository';
import { TenantContextService } from '../../infrastructure/context/tenant-context';
import { Transactional } from '../../infrastructure/decorators/transactional.decorator';
import { CreateCampaignDto } from '../dtos/create-campaign.dto';
import { UpdateCampaignDto } from '../dtos/update-campaign.dto';
import { CampaignDto } from '../dtos/campaign.dto';
import { StrategyEngine } from '../../engines/strategy.engine';
import { CopyEngine } from '../../engines/copy.engine';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { IStorageProvider } from '../../domain/ports/storage-provider.interface';

/**
 * CampaignsService - Business logic for campaign management
 * 
 * Now uses:
 * - CampaignRepository for data access (no direct model injection)
 * - TenantContextService for automatic tenant scoping
 * - @Transactional decorator for session/transaction management
 * - Port interfaces for external services (IStorageProvider)
 */
@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    // Use repository instead of model
    private readonly campaignRepository: CampaignRepository,
    // Use TenantContextService to get tenant ID from request
    private readonly tenantContext: TenantContextService,
    // Keep domain engines for business logic
    private readonly strategyEngine: StrategyEngine,
    private readonly copyEngine: CopyEngine,
    // Keep service dependencies
    private readonly subscriptionsService: SubscriptionsService,
    // Use port interface instead of concrete service
    @Inject('IStorageProvider')
    private readonly storageProvider: IStorageProvider,
  ) {}

  /**
   * Create a new campaign
   * Automatically uses tenant context and transaction management
   */
  @Transactional()
  async create(createCampaignDto: CreateCampaignDto & { createdBy: string }): Promise<CampaignDto> {
    try {
      this.logger.log('Starting campaign creation process');
      const tenantId = this.tenantContext.getTenantId();

      // Patch required fields for DTO compatibility
      const patchedDto = {
        ...createCampaignDto,
        title: createCampaignDto.title || createCampaignDto.name || 'Untitled',
        description: createCampaignDto.description || '',
        budget: createCampaignDto.budget || 0,
        userId: createCampaignDto.createdBy,
        tenantId,
      };

      // Generate initial strategy with fallback
      let strategy: string;
      try {
        this.logger.log('[StrategyEngine] Requesting strategy generation');
        strategy = await this.strategyEngine.generate(patchedDto);
        this.logger.log('[StrategyEngine] Strategy generated successfully');
      } catch (err) {
        this.logger.error('[StrategyEngine] Generation failed, using fallback', err);
        strategy = 'Default strategy content';
      }

      // Generate initial copy with fallback
      let copy: string;
      try {
        this.logger.log('[CopyEngine] Requesting copy generation');
        copy = await this.copyEngine.generate(patchedDto);
        this.logger.log('[CopyEngine] Copy generated successfully');
      } catch (err) {
        this.logger.error('[CopyEngine] Generation failed, using fallback', err);
        copy = 'Default copy content';
      }

      // Use generated campaignId or fallback
      const campaignId = `${createCampaignDto.name.replace(/\s+/g, '-')}-${Date.now()}`;

      // Upload to storage using port interface
      let strategyUrl: string, copyUrl: string;
      try {
        const strategyRef = await this.storageProvider.upload(
          Buffer.from(strategy, 'utf-8'),
          `${campaignId}-strategy-v1.txt`,
          { mimeType: 'text/plain' },
        );
        strategyUrl = strategyRef.url;
        this.logger.log(`[Storage] Strategy uploaded: ${strategyUrl}`);

        const copyRef = await this.storageProvider.upload(
          Buffer.from(copy, 'utf-8'),
          `${campaignId}-copy-v1.txt`,
          { mimeType: 'text/plain' },
        );
        copyUrl = copyRef.url;
        this.logger.log(`[Storage] Copy uploaded: ${copyUrl}`);
      } catch (err) {
        this.logger.error('[Storage] Upload failed', err);
        throw new Error(`Failed to upload campaign content to storage: ${err instanceof Error ? err.message : String(err)}`);
      }

      // Create campaign using repository (automatically scoped to tenant)
      const campaign = await this.campaignRepository.create(
        {
          name: createCampaignDto.name,
          title: patchedDto.title,
          description: patchedDto.description,
          budget: patchedDto.budget,
          strategy: strategyUrl,
          copy: copyUrl,
          createdBy: createCampaignDto.createdBy,
          status: 'draft',
          createdAt: new Date(),
          tenantId, // Automatically included by repository
        } as any,
        tenantId,
      );

      this.logger.log(`Campaign created successfully: ${campaign._id}`);
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
  async findById(campaignId: string): Promise<CampaignDto> {
    const tenantId = this.tenantContext.getTenantId();
    const campaign = await this.campaignRepository.findById(campaignId, tenantId);
    
    if (!campaign) {
      throw new NotFoundException(`Campaign ${campaignId} not found`);
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
    filter?: { status?: string },
  ): Promise<{ items: CampaignDto[]; total: number; page: number; pageSize: number }> {
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
   * Get active campaigns (draft/in_progress)
   * Uses repository-level query optimization
   */
  async findActive(page: number = 1, pageSize: number = 10): Promise<CampaignDto[]> {
    const tenantId = this.tenantContext.getTenantId();
    const campaigns = await this.campaignRepository.findActive(
      tenantId,
      { skip: (page - 1) * pageSize, limit: pageSize },
    );
    return campaigns.map((c) => this.mapToCampaignDto(c));
  }

  /**
   * Search campaigns by name or description
   */
  async search(query: string): Promise<CampaignDto[]> {
    const tenantId = this.tenantContext.getTenantId();
    const campaigns = await this.campaignRepository.search(query, tenantId);
    return campaigns.map((c) => this.mapToCampaignDto(c));
  }

  /**
   * Get campaign statistics
   * Aggregation-based query using repository support
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    published: number;
    byStatus: Record<string, number>;
  }> {
    const tenantId = this.tenantContext.getTenantId();
    return this.campaignRepository.getStatistics(tenantId);
  }

  /**
   * Update campaign
   * Uses @Transactional for automatic session management
   */
  @Transactional()
  async update(campaignId: string, updateDto: UpdateCampaignDto): Promise<CampaignDto> {
    const tenantId = this.tenantContext.getTenantId();
    
    // Verify ownership before update
    const campaign = await this.campaignRepository.findById(campaignId, tenantId);
    if (!campaign) {
      throw new NotFoundException(`Campaign ${campaignId} not found`);
    }

    const updated = await this.campaignRepository.updateById(
      campaignId,
      updateDto as any,
      tenantId,
    );

    if (!updated) {
      throw new NotFoundException(`Failed to update campaign ${campaignId}`);
    }

    this.logger.log(`Campaign updated: ${campaignId}`);
    return this.mapToCampaignDto(updated);
  }

  /**
   * Delete campaign
   * Uses @Transactional for automatic session management
   */
  @Transactional()
  async delete(campaignId: string): Promise<boolean> {
    const tenantId = this.tenantContext.getTenantId();
    
    // Verify ownership before delete
    const exists = await this.campaignRepository.findById(campaignId, tenantId);
    if (!exists) {
      throw new NotFoundException(`Campaign ${campaignId} not found`);
    }

    const deleted = await this.campaignRepository.deleteById(campaignId, tenantId);
    
    if (deleted) {
      this.logger.log(`Campaign deleted: ${campaignId}`);
    }
    
    return deleted;
  }

  /**
   * Get campaigns by user ID
   */
  async findByUserId(userId: string, page: number = 1, pageSize: number = 10): Promise<CampaignDto[]> {
    const tenantId = this.tenantContext.getTenantId();
    const campaigns = await this.campaignRepository.findByUserId(
      userId,
      tenantId,
      { skip: (page - 1) * pageSize, limit: pageSize },
    );
    return campaigns.map((c) => this.mapToCampaignDto(c));
  }

  /**
   * Get campaigns by strategy ID
   */
  async findByStrategyId(strategyId: string): Promise<CampaignDto[]> {
    const tenantId = this.tenantContext.getTenantId();
    const campaigns = await this.campaignRepository.findByStrategyId(strategyId, tenantId);
    return campaigns.map((c) => this.mapToCampaignDto(c));
  }

  /**
   * Map campaign document to DTO
   */
  private mapToCampaignDto(campaign: any): CampaignDto {
    return {
      id: campaign._id?.toString(),
      name: campaign.name,
      title: campaign.title,
      description: campaign.description,
      budget: campaign.budget,
      status: campaign.status,
      createdBy: campaign.createdBy,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      tenantId: campaign.tenantId,
    } as CampaignDto;
  }
}

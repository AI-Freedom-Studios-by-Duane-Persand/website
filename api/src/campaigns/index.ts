/**
 * Campaigns Module - Barrel Export
 * 
 * Centralizes exports for the campaigns feature module.
 * Use this for clean imports across the application.
 * 
 * @example
 * import { CampaignsService, CreateCampaignDto, CampaignStatus } from '@app/campaigns';
 */

// Module, Controller, Service
export { CampaignsModule } from './campaigns.module';
export { CampaignsService } from './campaigns.service';
export { CampaignsController } from './campaigns.controller';

// Repository
export { CampaignRepository } from './repositories/campaign.repository';

// DTOs - Campaign
export { 
  CreateCampaignDto, 
  UpdateCampaignDto,
  CampaignMode,
  CampaignStatus
} from './dtos/campaign.dto';

// DTOs - Branding
export { BrandingConfig } from './dtos/branding.dto';

// DTOs - Content Version
export { 
  CreateContentVersionDto, 
  AddContentVersionDto, 
  ContentMode 
} from './dtos/content-version.dto';

// DTOs - Strategy Version
export { 
  CreateStrategyVersionDto, 
  AddStrategyVersionDto 
} from './dtos/strategy-version.dto';

// DTOs - Schedule
export { 
  CreateScheduleSlotDto, 
  AddScheduleDto, 
  UpdateScheduleSlotDto, 
  LockScheduleSlotDto, 
  UnlockScheduleSlotDto 
} from './dtos/schedule.dto';

// Services
export { StrategyService } from './services/strategy.service';
export { ApprovalService } from './services/approval.service';
export { ScheduleService } from './services/schedule.service';
export { AssetService } from './services/asset.service';
export { ContentService } from './services/content.service';
export { PromptingService } from './services/prompting.service';

// Schemas
export { Campaign, CampaignSchema } from './schemas/campaign.schema';

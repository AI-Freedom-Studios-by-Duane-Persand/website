// Campaign Module Exports
export { CampaignsModule } from './campaigns.module';
export { CampaignsService } from './campaigns.service';
export { CampaignsController } from './campaigns.controller';

// DTOs
export { CreateCampaignDto, UpdateCampaignDto } from './dtos/campaign.dto';
export { BrandingConfig } from './dtos/branding.dto';
export { CreateContentVersionDto, AddContentVersionDto, ContentMode } from './dtos/content-version.dto';
export { CreateStrategyVersionDto, AddStrategyVersionDto } from './dtos/strategy-version.dto';
export { CreateScheduleSlotDto, AddScheduleDto, UpdateScheduleSlotDto, LockScheduleSlotDto, UnlockScheduleSlotDto } from './dtos/schedule.dto';

// Services
export { StrategyService } from './services/strategy.service';
export { ApprovalService } from './services/approval.service';
export { ScheduleService } from './services/schedule.service';
export { AssetService } from './services/asset.service';
export { ContentService } from './services/content.service';
export { PromptingService } from './services/prompting.service';

// Schemas
export { Campaign, CampaignSchema } from './schemas/campaign.schema';

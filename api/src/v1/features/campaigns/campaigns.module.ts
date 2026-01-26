import { Module } from '@nestjs/common';
import { CampaignsModule as LegacyCampaignsModule } from '../../../campaigns/campaigns.module';

/**
 * CampaignsModuleV1
 * 
 * Wraps existing campaigns module for v1 API structure.
 * Manages marketing campaigns and campaign orchestration.
 */
@Module({
  imports: [LegacyCampaignsModule],
  exports: [LegacyCampaignsModule],
})
export class CampaignsModuleV1 {}

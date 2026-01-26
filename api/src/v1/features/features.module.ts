import { Module } from '@nestjs/common';
import { CampaignsModuleV1 } from './campaigns/campaigns.module';
import { CreativesModuleV1 } from './creatives/creatives.module';
import { SocialModuleV1 } from './social/social.module';

/**
 * FeaturesModule
 * 
 * Aggregates all feature modules for v1 API.
 * Features are high-level business capabilities built on top of core services.
 * 
 * Sub-modules:
 * - CampaignsModuleV1: Marketing campaign management
 * - CreativesModuleV1: Content and creative asset management
 * - SocialModuleV1: Social media platform integration
 * 
 * The FeaturesModule organizes domain-specific functionality in a way that
 * reflects the business use cases while maintaining clear separation of concerns.
 */
@Module({
  imports: [CampaignsModuleV1, CreativesModuleV1, SocialModuleV1],
  exports: [CampaignsModuleV1, CreativesModuleV1, SocialModuleV1],
})
export class FeaturesModule {}

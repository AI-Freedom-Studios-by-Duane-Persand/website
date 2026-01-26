import { Module } from '@nestjs/common';
import { MetaPlatformModule } from './meta/meta.module';
// import { TiktokPlatformModule } from './tiktok/tiktok.module';
// import { LinkedinPlatformModule } from './linkedin/linkedin.module';

/**
 * SocialModuleV1
 * 
 * Aggregates all social media platform integrations.
 * 
 * Sub-modules:
 * - MetaPlatformModule: Facebook and Instagram integration
 * - TiktokPlatformModule: TikTok integration (placeholder for future)
 * - LinkedinPlatformModule: LinkedIn integration (placeholder for future)
 * 
 * The SocialModule provides platform-specific implementations while maintaining
 * a unified interface for posting, scheduling, and analytics.
 */
@Module({
  imports: [MetaPlatformModule /*, TiktokPlatformModule, LinkedinPlatformModule*/],
  exports: [MetaPlatformModule /* TiktokPlatformModule, LinkedinPlatformModule*/],
})
export class SocialModuleV1 {}

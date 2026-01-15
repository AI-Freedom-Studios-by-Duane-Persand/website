/**
 * DEPRECATED: Shared Index (Temporary Re-exports during Phase 0 Migration)
 * 
 * This file maintains backward compatibility during the DTO migration from shared/ to module-scoped folders.
 * ALL EXPORTS HERE ARE TEMPORARILY DEPRECATED.
 * 
 * MIGRATION STATUS:
 * ✅ Campaign DTOs moved to api/src/campaigns/dtos/
 * ✅ User DTOs moved to api/src/users/dtos/
 * ✅ Subscription DTOs moved to api/src/subscriptions/dtos/
 * ✅ Creative DTOs moved to api/src/creatives/dtos/
 * ✅ Tenant DTOs moved to api/src/tenants/dtos/
 * ✅ Approval DTOs moved to api/src/approvals/dtos/
 * ✅ Meta Ads DTOs moved to api/src/meta-ads/dtos/
 * ✅ Storage/Asset DTOs moved to api/src/storage/dtos/
 * ✅ Billing/Package DTOs moved to api/src/billing/dtos/
 * 
 * DEPRECATION TIMELINE:
 * - Phase 0.7 (NOW): Maintained for backward compatibility
 * - Phase 1 (Week 3-4): Deprecation warnings added
 * - Phase 2 (Week 5-6): Re-exports removed, direct module imports required
 * 
 * NEW IMPORT PATTERN (preferred):
 *   import { CampaignDto, CampaignsService } from 'api/src/campaigns'
 *   import { UserDto, UsersService } from 'api/src/users'
 * 
 * OLD IMPORT PATTERN (deprecated):
 *   import { CampaignDto } from 'shared'  // ⚠️ DO NOT USE
 */

// ============================================================================
// CAMPAIGN DTOs (moved to api/src/campaigns/dtos/)
// ============================================================================
export * from './campaign.dto';
export * from './strategy-version.dto';
export * from './content-version.dto';
export * from './schedule.dto';
export * from './branding.dto';

// ============================================================================
// USER DTOs (moved to api/src/users/dtos/)
// ============================================================================
export * from './user.dto';
export * from './user-jwt.interface';

// ============================================================================
// TENANT DTOs (moved to api/src/tenants/dtos/)
// ============================================================================
export * from './tenant.dto';

// ============================================================================
// SUBSCRIPTION DTOs (moved to api/src/subscriptions/dtos/)
// ============================================================================
export * from './subscription.dto';
export * from './subscriptionV2.dto';
export * from './package.dto';

// ============================================================================
// CREATIVE DTOs (moved to api/src/creatives/dtos/)
// ============================================================================
export * from './creative.dto';

// ============================================================================
// APPROVAL DTOs (moved to api/src/approvals/dtos/)
// ============================================================================
export * from './approval.dto';

// ============================================================================
// META ADS DTOs (moved to api/src/meta-ads/dtos/)
// ============================================================================
export * from './meta-ads.dto';

// ============================================================================
// STORAGE/ASSET DTOs (moved to api/src/storage/dtos/)
// ============================================================================
export * from './asset.dto';

// ============================================================================
// ERROR RESPONSE (cross-cutting concern, stays in shared/)
// ============================================================================
export * from './error-response';

// ============================================================================
// CROSS-CUTTING TYPES (remain in shared/)
// These types are used across multiple modules and don't belong to any single module
// ============================================================================
export type { 
  User, 
  Tenant, 
  Subscription as SubscriptionType, 
  BrandProfile, 
  Campaign, 
  CampaignBrief, 
  Angle, 
  Creative, 
  ScheduledItem, 
  Metric, 
  Experiment,
  EngineRun, 
  StrategyEngine, 
  CopyEngine, 
  IntegrationConfig, 
  Plan
} from './types';

export * from './interfaces';
export * from './engines';


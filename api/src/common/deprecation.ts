/**
 * Deprecation utilities for Phase 0 DTO migration
 * 
 * Usage in code:
 * ```typescript
 * import { deprecatedImport } from '@app/common/deprecation'
 * 
 * export const MyService = deprecatedImport(
 *   'MyService',
 *   'shared',
 *   'api/src/campaigns',
 *   () => require('api/src/campaigns').MyService
 * );
 * ```
 */

export function deprecatedImport(
  name: string,
  fromModule: string,
  toModule: string,
  implementation: () => any
): any {
  const result = implementation();
  
  // Log deprecation warning once per import
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `⚠️  DEPRECATION WARNING: Importing '${name}' from '${fromModule}' is deprecated.\n` +
      `📦 Use 'import { ${name} } from '${toModule}'' instead.\n` +
      `📅 Timeline: Phase 0.7 (current) → Phase 1 (warnings) → Phase 2 (removed)`
    );
  }
  
  return result;
}

/**
 * Deprecation notice for imports from shared/
 * 
 * Phase 0 Migration Status:
 * - Phase 0.1-0.5: DTO relocation and frontend structure
 * - Phase 0.6: Component reorganization and API client
 * - Phase 0.7: Compatibility layer (current phase)
 * - Phase 1: Layering & infrastructure abstraction
 * 
 * Files moved from shared/ to module-scoped folders:
 * 
 * Campaigns Module:
 *   - campaign.dto.ts
 *   - create-campaign.dto.ts
 *   - update-campaign.dto.ts
 *   - branding.dto.ts
 *   - content-version.dto.ts
 *   - strategy-version.dto.ts
 *   - schedule.dto.ts
 * 
 * Users Module:
 *   - user.dto.ts
 *   - create-user.dto.ts
 *   - update-user.dto.ts
 * 
 * Subscriptions Module:
 *   - subscription.dto.ts
 *   - subscriptionV2.dto.ts
 *   - package.dto.ts
 * 
 * Creatives Module:
 *   - creative.dto.ts
 *   - create-creative.dto.ts
 *   - update-creative.dto.ts
 * 
 * Tenants Module:
 *   - tenant.dto.ts
 *   - create-tenant.dto.ts
 *   - update-tenant.dto.ts
 * 
 * Approvals Module:
 *   - approval.dto.ts
 * 
 * Meta Ads Module:
 *   - meta-ads.dto.ts
 * 
 * Storage Module:
 *   - asset.dto.ts
 * 
 * Billing Module:
 *   - package.dto.ts
 */

export const PHASE_0_MIGRATION_NOTICE = `
╔════════════════════════════════════════════════════════════════╗
║          AI Freedom Studios - Architecture Migration           ║
║                    Phase 0: Structural Reorganization          ║
╚════════════════════════════════════════════════════════════════╝

🔄 CURRENT STATUS: Phase 0.7 - Compatibility Layer

📋 What changed:
   • DTOs relocated from shared/ to module-scoped folders
   • Barrel exports created for each module
   • Compatibility re-exports maintained in shared/index.ts
   • Frontend components reorganized with UI primitives
   • Centralized API client and hooks created

⚠️  DEPRECATION TIMELINE:

   Phase 0.7 (NOW - Week 2):
   ✅ Old imports still work (via re-exports)
   ✅ New imports available (module-scoped)
   ⚠️  No warnings yet (grace period)
   
   Phase 1 (Week 3-4):
   ⚠️  Deprecation warnings added to console
   ⚠️  Old imports still functional
   ✅ New imports recommended
   
   Phase 2 (Week 5-6):
   ❌ Old imports removed
   ✅ New imports required

📦 NEW IMPORT PATTERN (Recommended):

   // Campaigns
   import { CampaignsModule, CampaignDto, CampaignsService } 
     from 'api/src/campaigns'
   
   // Users
   import { UsersModule, UserDto, UsersService } 
     from 'api/src/users'
   
   // Subscriptions
   import { SubscriptionsModule, SubscriptionDto, SubscriptionsService } 
     from 'api/src/subscriptions'
   
   // Creatives
   import { CreativesModule, CreativeDto, CreativesService } 
     from 'api/src/creatives'
   
   // And so on for other modules...

🔗 OLD IMPORT PATTERN (DEPRECATED):

   import { CampaignDto } from 'shared'  // ⚠️ Use module imports instead

📚 Documentation:
   See: docs/architecture/module-structure.md

For questions or issues, refer to the architecture plan:
   .github/prompts/plan-architectureComplianceReview.prompt.md
`;

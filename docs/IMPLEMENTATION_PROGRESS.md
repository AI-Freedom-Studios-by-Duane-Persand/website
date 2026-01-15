# Phase 0: Structural Reorganization - Implementation Progress

**Start Date**: January 16, 2026  
**Target Completion**: Week 1-2  
**Goal**: Establish maintainable, scalable module structure with clear ownership and reduced coupling

## Overall Status: ▓▓▓▓▓▓▓░░░░ 65% - Phase 0.7-0.8 Complete, Ready for Phase 1

---

## Phase 0 Tasks

### Phase 0.1: Create Backend DTO Folder Structure
**Status**: ✅ COMPLETED  
**Purpose**: Prepare module-scoped DTO directories

**Mappings** (DTO → Target Module):
- `shared/campaign.dto.ts` → `api/src/campaigns/dtos/` ✅
- `shared/creative.dto.ts` → `api/src/creatives/dtos/` 📋
- `shared/user.dto.ts` → `api/src/users/dtos/` ✅
- `shared/tenant.dto.ts` → `api/src/tenants/dtos/` 📋
- `shared/subscription.dto.ts`, `subscriptionV2.dto.ts` → `api/src/subscriptions/dtos/` ✅
- `shared/asset.dto.ts` → `api/src/storage/dtos/` (or campaigns, depending on ownership) 📋
- `shared/approval.dto.ts` → `api/src/approvals/dtos/` 📋
- `shared/branding.dto.ts` → `api/src/branding/dtos/` (or campaigns) 📋
- `shared/content-version.dto.ts` → `api/src/campaigns/dtos/` (content sub-module) 📋
- `shared/strategy-version.dto.ts` → `api/src/campaigns/dtos/` (strategy sub-module) 📋
- `shared/schedule.dto.ts` → `api/src/campaigns/dtos/` (scheduling sub-module) 📋
- `shared/meta-ads.dto.ts` → `api/src/meta-ads/dtos/` 📋
- `shared/package.dto.ts` → `api/src/packages/dtos/` 📋

**Schema Models to Migrate** (from `api/models/` + `api/src/models/` → module `schemas/`):
- Campaign-related: `campaign.schema.ts`, `campaignBrief.schema.ts`, `campaignMessage.schema.ts`, `scheduledItem.schema.ts`, `angle.schema.ts` → `api/src/campaigns/schemas/`
- User-related: `user.schema.ts` → `api/src/users/schemas/`
- Subscription-related: `subscription.model.ts`, `subscriptionV2.model.ts` → `api/src/subscriptions/schemas/`
- Creative-related: `creative.schema.ts` → `api/src/creatives/schemas/`
- Tenant-related: `tenant.model.ts`, `tenant.schema.ts` → `api/src/tenants/schemas/`
- Social/Integration: `social-account.schema.ts`, `integrationConfig.schema.ts` → `api/src/social-accounts/schemas/`
- Data deletion: `data-deletion-request.schema.ts` → `api/src/data-deletion/schemas/`
- Shared cross-cutting: `engineRun.schema.ts`, `metric.schema.ts`, `experiment.schema.ts`, `campaignSession.schema.ts`, `brandProfile.schema.ts` → Evaluate ownership

**Completed**:
- ✅ Create `api/src/campaigns/dtos/` folder structure
- ✅ Create `api/src/users/dtos/` folder structure
- ✅ Create `api/src/subscriptions/dtos/` folder structure
- ✅ Create `api/src/creatives/dtos/` folder structure
- ✅ Create `api/src/auth/dtos/` folder structure
- ✅ Create `api/src/tenants/dtos/` folder structure
- ✅ Create `api/src/meta-ads/dtos/` folder structure
- ✅ Create `api/src/approvals/dtos/` folder structure
- ✅ Migrated campaign.dto.ts to `api/src/campaigns/dtos/`
- ✅ Migrated user.dto.ts to `api/src/users/dtos/`
- ✅ Migrated subscription.dto.ts to `api/src/subscriptions/dtos/`
- ⏳ Consolidate existing `dto/` folders into `dtos/` standardized location
- ⏳ Plan cross-cutting vs module-owned DTOs

---

### Phase 0.2: Move DTOs into Module Folders
**Status**: ✅ COMPLETED

**Completed**:
- ✅ Migrated approval.dto.ts to `api/src/approvals/dtos/`
- ✅ Migrated creative.dto.ts to `api/src/creatives/dtos/`
- ✅ Migrated tenant.dto.ts to `api/src/tenants/dtos/`
- ✅ Migrated asset.dto.ts to `api/src/storage/dtos/`
- ✅ Migrated branding.dto.ts to `api/src/campaigns/dtos/`
- ✅ Migrated content-version.dto.ts to `api/src/campaigns/dtos/`
- ✅ Migrated strategy-version.dto.ts to `api/src/campaigns/dtos/`
- ✅ Migrated schedule.dto.ts to `api/src/campaigns/dtos/`
- ✅ Migrated meta-ads.dto.ts to `api/src/meta-ads/dtos/`
- ✅ Migrated package.dto.ts to `api/src/billing/dtos/`
- ✅ Migrated subscriptionV2.dto.ts to `api/src/subscriptions/dtos/`
- ✅ Updated all imports across modules (creatives, tenants, subscriptions)
- ✅ Updated frontend import (branding.ts)
- ✅ Build verified - no TypeScript errors
- ✅ Committed to GitHub (commit 9ad9918)

**All 15 DTOs now in module-scoped locations**:
- Campaigns: campaign, branding, content-version, strategy-version, schedule
- Users: user
- Subscriptions: subscription, subscriptionV2
- Creatives: creative
- Approvals: approval
- Tenants: tenant
- Storage: asset
- Meta-ads: meta-ads
- Billing: package

**Checklist**:
- [x] Copy campaign DTOs to `api/src/campaigns/dtos/`
- [x] Update imports in campaigns module
- [x] Copy user DTOs to `api/src/users/dtos/`
- [x] Update imports in users module
- [x] Repeat for all other modules
- [x] Verify no import breakage
- [x] Remove old DTO files from `shared/` (keep during transition)

---

### Phase 0.3: Migrate Mongoose Models to Module Schemas
**Status**: ⏸️ DEFERRED (Deprioritized for immediate value delivery)

**Rationale**: 
- Models folder has 27+ files with complex interdependencies
- Many modules already have schemas in place (campaigns, users, subscriptions, creatives, tenants, auth, data-deletion, video-workflow)
- Full consolidation would require updating 19+ import locations and coordinating with ModelsModule
- Deferring to after Phase 0.4-0.5 complete for faster value delivery to frontend layer
- Barrel exports in Phase 0.4 already provide clean module interface

**Future**: Will consolidate in dedicated refactoring pass alongside layering violations (Phase 1)

---

### Phase 0.4: Add Barrel Exports (index.ts) to Modules
**Status**: ✅ COMPLETED

**Completed**:
- ✅ Created `api/src/campaigns/index.ts` - exports: CampaignsModule, CampaignsService, CampaignsController, 8 DTOs, Campaign schema
- ✅ Created `api/src/users/index.ts` - exports: UsersModule, UsersService, UsersController, 2 DTOs, UserSchema
- ✅ Created `api/src/subscriptions/index.ts` - exports: SubscriptionsModule, SubscriptionsService, SubscriptionsController, 2 DTOs, SubscriptionSchema
- ✅ Created `api/src/creatives/index.ts` - exports: CreativesModule, CreativesService, CreativesController, 2 DTOs, CreativeSchema
- ✅ Created `api/src/tenants/index.ts` - exports: TenantsModule, TenantsService, TenantsController, 2 DTOs, TenantSchema
- ✅ Created `api/src/approvals/index.ts` - exports: ApprovalsModule, ApprovalsService, ApprovalsController, 2 DTOs
- ✅ Created `api/src/meta-ads/index.ts` - exports: MetaAdsModule, MetaAdsService, MetaAdsController, 2 DTOs
- ✅ Created `api/src/storage/index.ts` - exports: StorageModule, StorageService, StorageController, 3 DTOs
- ✅ Build verified - no TypeScript errors
- ✅ Committed to GitHub (commit bf5f556)

**Benefits**:
- Cleaner imports: `import { CampaignDto, CampaignsService } from '@app/campaigns'`
- Single source of truth for module exports
- Enables future path alias setup in tsconfig.json
- Reduces scattered imports across codebase
- Prepares for frontend API client layer integration

**Checklist**:
- [x] Create barrel exports for 8 core modules
- [x] Ensure all module exports are correctly configured
- [x] Verify build succeeds with no import errors
- [x] Push to GitHub with clear commit message

---

### Phase 0.5: Create Frontend API Client Layer
**Status**: ✅ COMPLETED

**Completed**:
- ✅ Created `frontend/lib/api/client.ts` (base client, auth handling, error formatting)
- ✅ Created `frontend/lib/api/campaigns.api.ts`
- ✅ Created `frontend/lib/api/auth.api.ts`
- ✅ Created `frontend/lib/api/subscriptions.api.ts`
- ✅ Created `frontend/lib/error-handler.ts` (centralized error parsing/toasts)
- ✅ Created `frontend/lib/utils/auth-headers.ts` (centralized auth headers)
- ✅ Created hooks: `useCampaigns`, `useAuth`, `useSubscriptions`
- ✅ Added barrel exports in `frontend/lib/api/index.ts`
- ✅ Frontend build verified (Next.js prod build succeeds)

**Checklist**:
- [x] Create `frontend/lib/api/client.ts` — Base HTTP client
- [x] Create `frontend/lib/api/campaigns.api.ts`
- [x] Create `frontend/lib/api/auth.api.ts`
- [x] Create `frontend/lib/api/subscriptions.api.ts`
- [x] Create `frontend/lib/utils/auth-headers.ts`
- [x] Create `frontend/lib/error-handler.ts`
- [x] Test API client with sample calls (build verification)

---

### Phase 0.6: Frontend Component Structure Reorganization
**Status**: ✅ COMPLETED

**Completed**:
- ✅ Created `frontend/app/(features)/campaigns/` feature layout folder
- ✅ Created `frontend/app/components/campaigns/` component folder
- ✅ Created `frontend/app/components/ui/` for shared UI primitives (Button, Input, Badge, Card, Modal)
- ✅ Created `frontend/app/components/auth/` folder
- ✅ Created `frontend/app/components/subscriptions/` folder
- ✅ Migrated `Stepper` component to new location with UI primitives
- ✅ Migrated `CampaignList` component with Card/Badge/Button usage
- ✅ Refactored `ModelPickerModal` to use UI components and auth utilities
- ✅ Refactored `SubscriptionGate` to use new API client
- ✅ Created barrel exports for `ui/` and `campaigns/` components
- ✅ Replaced `getAuthHeaders()` duplicates in 8 files with centralized utility
- ✅ Updated campaigns page to import from new component locations
- ✅ Wired `useCampaigns` hook into campaigns page

**Files Modified** (16 total):
- Created: `Button.tsx`, `Input.tsx`, `Badge.tsx`, `Card.tsx`, `Modal.tsx`, `ModelPickerModal.tsx`, `ui/index.ts`
- Created: `campaigns/CampaignList.tsx`, `campaigns/Stepper.tsx`, `campaigns/index.ts`
- Created: `subscriptions/SubscriptionGate.tsx`
- Updated: `data-deletion/page.tsx`, `auth/meta/callback/page.tsx`, `app/creatives/page.tsx`
- Updated: `app/dashboard/page.tsx`, `app/components/SocialConnectionsCard.tsx`
- Updated: `app/campaigns/page.tsx`, `app/campaigns/components/CampaignChatBot.tsx`
- Updated: `admin/tenants/page.tsx`

**Checklist**:
- [x] Create `frontend/app/(features)/campaigns/` layout
- [x] Create `frontend/app/components/campaigns/` component folder
- [x] Create `frontend/app/components/ui/` for shared UI primitives
- [x] Move campaign components to feature folder (Stepper, CampaignList)
- [x] Create reusable UI components (Button, Input, Badge, Card, Modal)
- [x] Update campaign pages to import from new locations
- [x] Replace getAuthHeaders() duplicates with centralized utility (8 files)
- [x] Wire hooks into pages to replace inline fetch calls

---

### Phase 0.7: Create Compatibility Layer & Re-exports
**Status**: ✅ COMPLETED

**Checklist**:
- [x] Create `api/src/index.ts` with re-exports from all modules
- [x] Create deprecation warnings in deprecation utilities
- [x] Update `shared/index.ts` to re-export moved DTOs (temporary)
- [x] Add migration timeline documentation
- [x] Verify old imports still work (via re-exports)

**Files Created**:
- `api/src/index.ts` - Root barrel export (67 lines, comprehensive module aggregation)
- `api/src/common/deprecation.ts` - Deprecation utilities and migration notice
- `docs/architecture/module-structure.md` - Complete module structure documentation

**Files Modified**:
- `shared/index.ts` - Updated with deprecation headers and organized re-exports

---

### Phase 0.8: Document Module Structure Conventions
**Status**: ✅ COMPLETED

**Deliverables**:
- ✅ Created `docs/architecture/module-structure.md` with:
  - Complete module folder layout template
  - Barrel export pattern examples
  - DTO organization and naming conventions
  - Import path conventions (preferred vs deprecated vs prohibited)
  - Cross-module dependency rules
  - Validation patterns and checklist
  - Migration timeline (Phase 0.7 → Phase 1 → Phase 2)
  - Troubleshooting guide

**Documentation Coverage**:
- Module layout structure with examples
- Barrel export pattern with code samples
- DTO validation checklist
- Import path conventions (✅ new, ⚠️ old, ❌ wrong)
- Circular dependency prevention
- Phase-based migration timeline
- Common issues and solutions

---

## Blocked Issues
None yet.

## Notes
- Parallel work possible: DTO relocation (0.2) and model migration (0.3) can proceed simultaneously
- Frontend work (0.5, 0.6) can proceed after 0.1 foundation laid
- Compatibility layer (0.7) critical before removing old imports

---

## Next Steps
1. ✅ Create folder structure (Phase 0.1) — COMPLETED
2. 🔄 Continue DTO migration (Phase 0.2) — Consolidate existing `campaigns/dto/` → `dtos/`; move remaining DTOs from `shared/`
3. ⏳ Start model migration (Phase 0.3) — Move `api/models/*` and `api/src/models/*` to respective module `schemas/`
4. ⏳ Create barrel exports (Phase 0.4) — Add `index.ts` to each module
5. ⏳ Frontend API layer (Phase 0.5) — Create `frontend/lib/api/client.ts` and feature APIs

## Commit History
- `049e2c7`: Phase 0.1 foundation: DTO folder structure established, campaign/user/subscription DTOs migrated
- Previous: Veo 3.1 integration, video workflow fixes, intelligent fallback system

# Phase 0: Structural Reorganization - Implementation Progress

**Start Date**: January 16, 2026  
**Target Completion**: Week 1-2  
**Goal**: Establish maintainable, scalable module structure with clear ownership and reduced coupling

## Overall Status: ▓▓░░░░░░░░░░ 15% - Phase 0.1 Complete, Starting 0.2

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
**Status**: ⏳ PENDING

**Checklist**:
- [ ] Copy campaign DTOs to `api/src/campaigns/dtos/`
- [ ] Update imports in campaigns module
- [ ] Copy user DTOs to `api/src/users/dtos/`
- [ ] Update imports in users module
- [ ] Repeat for all other modules
- [ ] Verify no import breakage
- [ ] Remove old DTO files from `shared/` (keep during transition)

---

### Phase 0.3: Migrate Mongoose Models to Module Schemas
**Status**: ⏳ PENDING

**Checklist**:
- [ ] Move models from `api/models/` to respective `api/src/<feature>/schemas/`
- [ ] Move models from `api/src/models/` to respective `api/src/<feature>/schemas/`
- [ ] Update all schema imports across services
- [ ] Verify MongoDB seeding/initialization still works
- [ ] Test model registration in modules

---

### Phase 0.4: Add Barrel Exports (index.ts) to Modules
**Status**: ⏳ PENDING

**Checklist**:
- [ ] Create `api/src/campaigns/index.ts` exporting: `CampaignsModule`, DTOs, schemas, services, controllers
- [ ] Create `api/src/users/index.ts`
- [ ] Create `api/src/auth/index.ts`
- [ ] Repeat for all modules
- [ ] Update imports across codebase to use barrel exports
- [ ] Setup path alias `@app/<module>` in `tsconfig.json`

---

### Phase 0.5: Create Frontend API Client Layer
**Status**: ⏳ PENDING

**Checklist**:
- [ ] Create `frontend/lib/api/client.ts` — Base HTTP client
- [ ] Create `frontend/lib/api/campaigns.api.ts`
- [ ] Create `frontend/lib/api/auth.api.ts`
- [ ] Create `frontend/lib/api/subscriptions.api.ts`
- [ ] Create `frontend/lib/utils/auth-headers.ts`
- [ ] Create `frontend/lib/error-handler.ts`
- [ ] Test API client with sample calls

---

### Phase 0.6: Frontend Component Structure Reorganization
**Status**: ⏳ PENDING

**Checklist**:
- [ ] Create `frontend/app/(features)/campaigns/` layout
- [ ] Create `frontend/app/components/campaigns/` component folder
- [ ] Create `frontend/app/components/ui/` for shared UI primitives
- [ ] Move campaign components to feature folder
- [ ] Move shared UI components to `ui/` folder
- [ ] Update import paths across frontend

---

### Phase 0.7: Create Compatibility Layer & Re-exports
**Status**: ⏳ PENDING

**Checklist**:
- [ ] Create `api/src/index.ts` with re-exports from all modules
- [ ] Create deprecation warnings in `shared/index.ts`
- [ ] Update `shared/index.ts` to re-export moved DTOs temporarily
- [ ] Verify old imports still work (with warnings)

---

### Phase 0.8: Document Module Structure Conventions
**Status**: ⏳ PENDING

**Checklist**:
- [ ] Create `docs/architecture/module-structure.md`
- [ ] Document module folder layout pattern
- [ ] Document barrel export conventions
- [ ] Document import path patterns and aliases
- [ ] Add DTO validation checklist
- [ ] Add ESLint rule recommendations

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

# Codebase Architecture Assessment & Compliance Review

This is a multi-tenant SaaS campaign management platform built with NestJS backend, Next.js frontend, and MongoDB. The system handles campaign strategy, content generation, approvals, scheduling, and social media publishing with AI integration (Gemini via Poe API, Replicate).

## Architecture Overview

### Technology Stack
- **Backend**: NestJS with TypeScript, Mongoose ODM
- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **Database**: MongoDB (Atlas recommended)
- **Job Queue**: Redis + BullMQ (with Agenda fallback)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Payments**: Stripe
- **AI Services**: Poe API (Gemini proxy), Replicate
- **Social Publishing**: Meta Graph API, Ayrshare

### Current Architecture Patterns
- Monorepo structure with npm workspaces (`/api`, `/frontend`, `/shared`)
- NestJS modular architecture with feature modules
- Mongoose schemas for data models
- JWT authentication with passport-jwt
- Global validation pipe with class-validator
- Winston logging with AllExceptionsFilter
- Next.js middleware for route guards and auth
- Direct Mongoose model injection in services
- **Current Issue**: DTOs scattered across `shared/` and modules; models in `api/models/` and inconsistent locations; frontend API calls inline with duplicated utilities; components lack feature-based folder structure

## Critical Issues & Action Plan

### 1. Address Layering Violations

**Problem**: Controllers contain business logic that belongs in services.

**Examples**:
- `campaigns.controller.ts` has inline tenantId extraction and validation
- `auth.controller.ts` contains transaction management, bcrypt hashing, and complex signup orchestration
- Controllers directly handle error transformation and logging

**Action Items**:
- Extract authentication logic from `auth.controller.ts` into `auth.service.ts` (signup orchestration, session management, bcrypt operations)
- Move tenantId extraction and validation to a dedicated service or decorator
- Create application service layer for complex workflows (e.g., `SignupApplicationService`)
- Controllers should only: validate request → call service → return response
- Move error transformation to service layer; let filter handle HTTP concerns

**Files to Modify**:
- `api/src/auth/auth.controller.ts` (100+ lines of business logic to extract)
- `api/src/campaigns/campaigns.controller.ts` (tenant validation repeated in every endpoint)
- Create: `api/src/auth/signup.service.ts` or `auth.application-service.ts`

### 2. Strengthen Input Validation and Error Handling

**Problem**: 
- DTOs lack comprehensive validation decorators
- Frontend error handling is inconsistent (some use toast, others inline state)
- No validation before API calls on frontend

**Current State**:
- `campaign.dto.ts` has only basic `@IsOptional/@IsString`
- Missing: `@IsNotEmpty`, `@IsEnum`, `@ValidateNested`, `@IsArray`, length validators
- Frontend components duplicate error state management
- Some components use `react-hot-toast`, others show errors inline

**Action Items**:
- Add comprehensive validation to all DTOs:
  - Required fields: `@IsNotEmpty()`
  - Enums: `@IsEnum(EnumType)`
  - Nested objects: `@ValidateNested()` + `@Type()`
  - Arrays: `@IsArray()` + `@ArrayMinSize()`
  - Strings: `@MinLength()`, `@MaxLength()`, `@IsEmail()`
- Create centralized error handling utility for frontend
- Standardize on `react-hot-toast` for all error notifications
- Create typed error response interface in `/shared`
- Add frontend pre-flight validation using shared validation logic

**Files to Modify**:
- `shared/campaign.dto.ts` - Add validation decorators
- `shared/user.dto.ts` - Add validation decorators
- `shared/subscription.dto.ts` - Add validation decorators
- Create: `frontend/lib/error-handler.ts` - Centralized error handling
- Create: `frontend/lib/api-client.ts` - Typed API client with error handling
- Refactor all frontend pages to use centralized error handler

### 3. Decouple Infrastructure from Domain Logic

**Problem**: 
- Service classes directly inject Mongoose models and external clients
- No abstraction layer between business logic and infrastructure
- Cannot test domain logic without external dependencies

**Current State**:
- `campaigns.service.ts` directly injects `StorageService`, `StrategyEngine`, `CopyEngine`, Mongoose models
- `strategy.engine.ts` directly depends on `PoeClient` and `StorageService`
- Domain logic is tightly coupled to NestJS decorators and Mongoose

**Action Items**:
- Introduce repository pattern for data access:
  - Create `ICampaignRepository` interface in domain layer
  - Implement `MongooseCampaignRepository` in infrastructure layer
  - Services depend on interface, not concrete implementation
- Create port interfaces for external services:
  - `IContentGenerator` (implemented by `PoeContentGenerator`, `ReplicateContentGenerator`)
  - `IStorageProvider` (implemented by `R2StorageProvider`)
  - `ISocialPublisher` (implemented by `MetaPublisher`, `AyrsharePublisher`)
- Extract pure domain models and business rules to domain layer
- Move validation logic to domain entities

**Files to Create**:
- `api/src/domain/repositories/campaign.repository.interface.ts`
- `api/src/domain/repositories/user.repository.interface.ts`
- `api/src/domain/ports/content-generator.interface.ts`
- `api/src/domain/ports/storage-provider.interface.ts`
- `api/src/infrastructure/repositories/mongoose-campaign.repository.ts`
- `api/src/infrastructure/adapters/poe-content-generator.adapter.ts`
- `api/src/infrastructure/adapters/r2-storage.adapter.ts`

**Files to Modify**:
- `api/src/campaigns/campaigns.service.ts` - Inject interfaces, not implementations
- `api/src/engines/strategy.engine.ts` - Depend on `IContentGenerator`
- `api/src/storage/storage.service.ts` - Implement `IStorageProvider`

### 4. Improve Frontend-Backend Contract Safety

**Problem**:
- Frontend uses inline `fetch` calls with no type safety
- Error handling inconsistent across components
- `getAuthHeaders()` helper duplicated in 10+ files
- No centralized API client

**Current State**:
- Each component manually constructs API calls
- Response types not enforced (uses `any` or implicit types)
- Auth headers duplicated across files
- Error parsing varies by component

**Action Items**:
- Create typed API client layer:
  - Use shared DTOs for request/response types
  - Centralize base URL and headers
  - Standardized error handling and parsing
  - Automatic token refresh on 401
- Create feature-specific API modules:
  - `frontend/lib/api/campaigns.api.ts`
  - `frontend/lib/api/auth.api.ts`
  - `frontend/lib/api/subscriptions.api.ts`
- Move `getAuthHeaders()` to centralized location
- Create typed hooks for API calls:
  - `useCampaigns()`, `useAuth()`, `useSubscriptions()`
- Enforce response type checking

**Files to Create**:
- `frontend/lib/api/client.ts` - Base API client
- `frontend/lib/api/campaigns.api.ts` - Campaign API methods
- `frontend/lib/api/auth.api.ts` - Auth API methods
- `frontend/lib/api/subscriptions.api.ts` - Subscription API methods
- `frontend/lib/hooks/useCampaigns.ts` - Typed campaign hook
- `frontend/lib/utils/auth-headers.ts` - Centralized auth header utility

**Files to Modify**:
- All frontend pages using `fetch()` directly (20+ files)
- Remove duplicate `getAuthHeaders()` implementations

### 5. Refactor Domain Logic Out of Infrastructure

**Problem**:
- AI generation logic tightly coupled to API clients
- Storage logic mixed with business rules
- Cannot test or swap implementations

**Current State**:
- `strategy.engine.ts` directly calls `poeClient.generateContent()` and `storageService.uploadFile()`
- No abstraction between domain intent and infrastructure implementation
- Testing requires mocking external APIs

**Action Items**:
- Extract domain interfaces:
  - `IContentGenerator.generate(prompt, options): Promise<GeneratedContent>`
  - `IStorageProvider.store(buffer, metadata): Promise<StorageReference>`
- Implement adapters for each external service:
  - `PoeContentGeneratorAdapter implements IContentGenerator`
  - `ReplicateContentGeneratorAdapter implements IContentGenerator`
  - `R2StorageAdapter implements IStorageProvider`
- Create domain services that depend only on interfaces:
  - `StrategyGenerationService` uses `IContentGenerator` + `IStorageProvider`
- Engine classes become thin adapters, not domain logic containers
- Enable testing with in-memory implementations

**Files to Create**:
- `api/src/domain/services/strategy-generation.service.ts` - Pure domain logic
- `api/src/domain/services/content-generation.service.ts` - Pure domain logic
- `api/src/infrastructure/adapters/poe-content.adapter.ts` - Infrastructure concern
- `api/src/infrastructure/adapters/replicate-content.adapter.ts` - Infrastructure concern

**Files to Modify**:
- `api/src/engines/strategy.engine.ts` - Refactor to thin adapter
- `api/src/engines/copy.engine.ts` - Refactor to thin adapter
- `api/src/campaigns/campaigns.service.ts` - Use domain services

### 6. Standardize Transaction and Data Access Patterns

**Problem**:
- Mongoose models accessed directly throughout services
- Inconsistent tenant isolation checks
- Some methods use sessions, others don't
- Transaction support is manual and error-prone

**Current State**:
- Direct `this.campaignModel.findOne({ _id, tenantId })` in services
- Manual session management in `auth.controller.ts`
- No centralized transaction management
- Tenant filtering duplicated in every query

**Action Items**:
- Create base repository with built-in features:
  - Automatic tenant scoping on all queries
  - Transaction support with automatic rollback
  - Standard CRUD methods with consistent error handling
  - Query builders for complex operations
- Implement specific repositories extending base:
  - `CampaignRepository extends BaseRepository<Campaign>`
  - `UserRepository extends BaseRepository<User>`
- Create transaction decorator for automatic session management:
  - `@Transactional()` on service methods
- Remove direct model access from services
- Centralize tenant context extraction (from JWT or request)

**Files to Create**:
- `api/src/infrastructure/repositories/base.repository.ts` - Base repository
- `api/src/infrastructure/repositories/campaign.repository.ts` - Campaign repo
- `api/src/infrastructure/repositories/user.repository.ts` - User repo
- `api/src/infrastructure/decorators/transactional.decorator.ts` - Transaction decorator
- `api/src/infrastructure/context/tenant-context.ts` - Tenant context manager

**Files to Modify**:
- `api/src/campaigns/campaigns.service.ts` - Use repository instead of model
- `api/src/users/users.service.ts` - Use repository instead of model
- `api/src/tenants/tenants.service.ts` - Use repository instead of model
- `api/src/auth/auth.controller.ts` - Use transaction decorator

## Additional Considerations

### 7. Authentication State Management

**Issues**:
- JWT tokens stored in both `localStorage` and cookies
- Middleware reads cookies, frontend reads localStorage
- No refresh token implementation
- Token stored in httpOnly cookie but also exposed to JavaScript

**Recommendations**:
- Centralize on httpOnly cookies only for security
- Remove localStorage token storage
- Implement refresh token rotation
- Add CSRF protection for cookie-based auth
- Consider short-lived access tokens (15min) + refresh tokens (7 days)

### 8. Error Response Format Standardization

**Issues**:
- Backend has `userFriendlyMessage` support but frontend doesn't use it consistently
- Some pages parse `error.message`, others use `data.message`
- Validation errors have different formats

**Recommendations**:
- Create standard error response interface in `/shared`:
  ```typescript
  interface ApiErrorResponse {
    statusCode: number;
    message: string;
    userFriendlyMessage: string;
    validationErrors?: ValidationError[];
    timestamp: string;
    path: string;
  }
  ```
- Update `AllExceptionsFilter` to always return this format
- Create frontend utility to parse and display errors consistently
- Use `userFriendlyMessage` for toast notifications

### 9. Validation Consistency

**Issues**:
- Backend uses `class-validator` but many DTOs are minimal
- Frontend has no validation before API calls
- Duplicate validation logic needed on both sides

**Recommendations**:
- Complete all DTO validation decorators
- Consider shared validation schemas using Zod or similar
- Add frontend pre-flight validation for better UX
- Create validation error translation for user-friendly messages
- Consider runtime type checking with io-ts or zod

### 10. Testing Strategy

**Issues**:
- No visible test files for most services
- Tight coupling makes unit testing difficult
- External dependencies make integration testing complex

**Recommendations**:
- After implementing repository pattern, add unit tests for domain services
- Create integration tests using in-memory MongoDB
- Mock external services at adapter layer
- Add E2E tests for critical user flows
- Implement contract testing for frontend-backend integration

## Implementation Priority

### Phase 0: Structural Reorganization (Week 1-2) — **NEW: Module-Scoped DTOs & Models**

**Goal**: Establish maintainable, scalable module structure with clear ownership and reduced coupling.

**Backend**:
1. **Relocate DTOs & Schemas into Modules**:
   - Move DTOs from `shared/*.dto.ts` into owning module folders:
     - `api/src/campaigns/dtos/campaign.dto.ts`, `create-campaign.dto.ts`, etc.
     - `api/src/auth/dtos/signup.dto.ts`, `login.dto.ts`, etc.
     - `api/src/users/dtos/user.dto.ts`, `update-user.dto.ts`, etc.
     - `api/src/subscriptions/dtos/subscription.dto.ts`, etc.
   - Migrate Mongoose models from `api/models/*` to `api/src/<feature>/schemas`:
     - `api/src/campaigns/schemas/campaign.schema.ts`, `campaign.model.ts`
     - `api/src/users/schemas/user.schema.ts`, `user.model.ts`
     - Add `Schema` decorator and factory function for re-usability
   - Keep only **cross-cutting types** in `shared/`:
     - `UserJwt`, `Result<T>`, `PaginationDto`, error interfaces
     - Re-export module DTOs from `shared/index.ts` during transition (temporary)

2. **Add Barrel Exports** (`index.ts` per module):
   - `api/src/campaigns/index.ts` exports: `CampaignsModule`, `CampaignDto`, `CampaignSchema`, `CampaignsService`, `CampaignsController`
   - `api/src/auth/index.ts` exports: `AuthModule`, `SignupDto`, `LoginDto`, `AuthService`, `AuthController`
   - Standardizes import paths and reduces internal coupling
   - Example: `import { CampaignDto, CampaignsService } from '@app/campaigns'` instead of scattered paths

3. **Frontend Structure Overhaul**:
   - Introduce `frontend/lib/api/client.ts` — Base HTTP client with:
     - Centralized base URL, headers, auth token handling
     - Typed request/response
     - Automatic 401 retry with token refresh
     - Standard error parsing and toast integration
   - Feature API modules:
     - `frontend/lib/api/campaigns.api.ts` — All campaign endpoints
     - `frontend/lib/api/auth.api.ts` — Auth endpoints
     - `frontend/lib/api/subscriptions.api.ts` — Subscription endpoints
     - Pattern: `const campaignsApi = new ApiClient<CampaignDto>('/campaigns')`
   - Centralized utilities:
     - `frontend/lib/utils/auth-headers.ts` — Remove duplicates across 10+ files
     - `frontend/lib/error-handler.ts` — Standardize error parsing, logging, toast
   - Custom hooks layer:
     - `frontend/lib/hooks/useCampaigns.ts` — Hook wrapping `campaignsApi.list()`, state, error handling
     - `frontend/lib/hooks/useAuth.ts`, `useSubscriptions.ts`, etc.
   - Reorganize component structure:
     - `frontend/app/(features)/campaigns/[routes]` — Campaign pages
     - `frontend/app/components/campaigns/` — Campaign-specific UI components
     - `frontend/app/components/ui/` — Shared UI primitives (Button, Input, Modal, etc.)
     - Remove scattered component folders; use feature-based grouping

4. **Validation Overhaul**:
   - Audit all DTOs; add missing `@IsNotEmpty()`, `@IsEnum()`, `@ValidateNested()`, `@Type()`, length validators
   - Ensure all nested objects use `@ValidateNested() @Type(() => NestedDto)`
   - Ensure all arrays use `@IsArray() @ArrayMinSize(1)` where required
   - Update `api/src/shared/validation` or `api/src/common/validation` with custom validators
   - Document DTO validation rules in JSDoc

5. **Create Compatibility Layer** (temporary re-exports):
   - `api/src/index.ts` re-exports all module exports
   - `shared/index.ts` re-exports moved DTOs during transition
   - Add deprecation warnings to old import paths
   - Allows incremental migration without breaking existing imports

6. **Document New Conventions**:
   - Create `docs/architecture/module-structure.md`:
     - Module folder layout (dtos/, schemas/, services/, controllers/)
     - Barrel export pattern and benefits
     - Import path conventions (use `@app/<module>` aliases)
     - DTO validation checklist
   - Add `.eslintrc` rules to enforce import path patterns and prevent circular dependencies

---

### Phase 1: Foundation (Week 3-4) — **Layering & Infrastructure Abstraction**
1. Create repository interfaces and base implementation
2. Create port interfaces for external services (content generation, storage, social publishing)
3. Standardize error response format (centralized `ApiErrorResponse` interface)
4. Set up transaction decorator and tenant context manager

### Phase 2: Refactoring (Week 5-6) — **Business Logic Extraction & Service Migration**
1. Extract business logic from controllers to services (sign-up orchestration, tenantId extraction)
2. Implement repository pattern in campaigns, users, subscriptions
3. Refactor engines to use adapter pattern (Poe, Replicate adapters)
4. Migrate feature modules to use repositories and DTOs from Phase 0

### Phase 3: Enhancement (Week 7-8) — **Frontend Integration & Validation**
1. Migrate all frontend pages/components to use typed API client and hooks
2. Implement frontend pre-flight validation using DTO decorators
3. Standardize error handling via centralized error handler
4. Remove duplicate `getAuthHeaders()` and other utilities

### Phase 4: Security & Testing (Week 9-10) — **Auth & Quality Assurance**
1. Refactor authentication to httpOnly cookies only
2. Add refresh token rotation and CSRF protection
3. Write unit tests for domain services and repositories
4. Add integration tests for migrations from Phase 1-2
5. Add E2E tests for critical user flows

## Success Metrics

**Backend**:
- All DTOs in module-scoped folders with full validation decorators
- All Mongoose models under `api/src/<feature>/schemas` with barrel exports
- Zero DTOs in `shared/` except cross-cutting types
- All modules export via `index.ts` (barrel pattern)
- All controllers < 50 lines per method
- Zero direct Mongoose model injections in application services (use repositories)
- All database queries automatically scoped to tenant via `BaseRepository`

**Frontend**:
- All API calls routed through `frontend/lib/api/` typed client
- All errors parsed and displayed via centralized error handler
- Zero duplicate `getAuthHeaders()` implementations
- 100% of components use typed hooks (`useCampaigns`, `useAuth`, etc.)
- Component folder structure matches feature modules (campaigns, auth, subscriptions, etc.)
- All feature components in `frontend/app/components/<feature>/`
- Shared UI components in `frontend/app/components/ui/`

**Quality**:
- Zero circular dependencies (eslint enforces)
- Test coverage > 70% for domain and application layers
- All DTO validation changes covered by unit tests
- All module migrations verified by integration tests
- Documentation in `docs/architecture/module-structure.md` followed by team

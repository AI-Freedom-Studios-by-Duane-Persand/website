# Module Structure Conventions

**Document Version**: 1.0  
**Last Updated**: January 16, 2026  
**Status**: Active (Phase 0.7)

## Overview

This document describes the module structure conventions established during Phase 0 (Structural Reorganization) of the AI Freedom Studios architecture refactor. These conventions ensure consistency, reduce coupling, and improve maintainability across the codebase.

## Table of Contents

1. [Module Folder Layout](#module-folder-layout)
2. [Barrel Export Pattern](#barrel-export-pattern)
3. [DTO Organization](#dto-organization)
4. [Import Path Conventions](#import-path-conventions)
5. [Cross-Module Dependencies](#cross-module-dependencies)
6. [Validation Patterns](#validation-patterns)
7. [Migration Timeline](#migration-timeline)
8. [Troubleshooting](#troubleshooting)

## Module Folder Layout

Each feature module follows a standardized folder structure:

```
api/src/<feature>/
├── dtos/                          # Data Transfer Objects
│   ├── <feature>.dto.ts           # Main DTO (e.g., campaign.dto.ts)
│   ├── create-<feature>.dto.ts    # Create input (e.g., create-campaign.dto.ts)
│   ├── update-<feature>.dto.ts    # Update input (e.g., update-campaign.dto.ts)
│   └── index.ts                   # Barrel export for DTOs
│
├── schemas/                       # Mongoose Schemas & Models
│   ├── <feature>.schema.ts        # Schema definition
│   ├── <feature>.model.ts         # Model factory
│   └── index.ts                   # Barrel export for schemas
│
├── interfaces/                    # TypeScript Interfaces (optional)
│   ├── <feature>.interface.ts     # Domain interfaces
│   └── index.ts                   # Barrel export
│
├── services/                      # Business Logic
│   ├── <feature>.service.ts       # Main service
│   ├── <sub-service>.service.ts   # Sub-services (optional)
│   └── index.ts                   # Barrel export
│
├── controllers/                   # HTTP Controllers
│   ├── <feature>.controller.ts    # Main controller
│   └── index.ts                   # Barrel export
│
├── <feature>.module.ts            # NestJS Module Definition
└── index.ts                       # ROOT BARREL EXPORT (critical)
```

### Example: Campaigns Module

```
api/src/campaigns/
├── dtos/
│   ├── campaign.dto.ts
│   ├── create-campaign.dto.ts
│   ├── update-campaign.dto.ts
│   └── index.ts
├── schemas/
│   ├── campaign.schema.ts
│   ├── campaign.model.ts
│   └── index.ts
├── services/
│   ├── campaigns.service.ts
│   ├── campaign-chat.service.ts
│   └── index.ts
├── controllers/
│   ├── campaigns.controller.ts
│   └── index.ts
├── campaigns.module.ts
└── index.ts
```

## Barrel Export Pattern

Each module **must** export a root `index.ts` that provides clean, predictable imports.

### Module-Level Barrel Export (e.g., `api/src/campaigns/index.ts`)

```typescript
/**
 * Campaigns Module - Public API
 * 
 * This barrel export provides all public APIs from the Campaigns module.
 * Use this for imports: import { CampaignsService } from 'api/src/campaigns'
 */

// Module
export { CampaignsModule } from './campaigns.module';

// Services (in order of importance)
export { CampaignsService } from './services';
export { CampaignChatService } from './services';

// Controllers
export { CampaignsController } from './controllers';

// DTOs
export * from './dtos';

// Schemas & Models
export * from './schemas';

// Interfaces (if applicable)
export * from './interfaces';
```

### Sub-Folder Barrel Exports (e.g., `api/src/campaigns/dtos/index.ts`)

```typescript
export { CampaignDto } from './campaign.dto';
export type { CampaignDto } from './campaign.dto';

export { CreateCampaignDto } from './create-campaign.dto';
export type { CreateCampaignDto } from './create-campaign.dto';

export { UpdateCampaignDto } from './update-campaign.dto';
export type { UpdateCampaignDto } from './update-campaign.dto';
```

## DTO Organization

### Naming Convention

- **Main DTO**: `<feature>.dto.ts` (represents the full domain entity)
  - Example: `campaign.dto.ts`, `user.dto.ts`
  - Contains all properties (read, computed, timestamps)
  
- **Create DTO**: `create-<feature>.dto.ts` (input for POST)
  - Example: `create-campaign.dto.ts`
  - Contains required fields for creation
  - Excludes: id, timestamps, computed fields
  
- **Update DTO**: `update-<feature>.dto.ts` (input for PUT/PATCH)
  - Example: `update-campaign.dto.ts`
  - Contains optional fields for updates
  - Excludes: id, timestamps
  - Often uses `@IsOptional()` for all properties

### DTO Template with Validation

```typescript
import { IsNotEmpty, IsString, IsOptional, IsEnum, MinLength, MaxLength, ValidateNested, Type } from 'class-validator';

/**
 * Campaign DTO - Full campaign entity
 * 
 * Used for:
 * - GET responses
 * - Database read operations
 */
export class CampaignDto {
  @IsNotEmpty()
  @IsString()
  _id: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  objective?: string;

  @IsNotEmpty()
  @IsEnum(['draft', 'active', 'paused', 'completed'])
  status: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => StrategyVersionDto)
  strategyVersions?: StrategyVersionDto[];

  @IsNotEmpty()
  @IsString()
  tenantId: string;

  @IsNotEmpty()
  createdAt: Date;

  @IsNotEmpty()
  updatedAt: Date;
}
```

## Import Path Conventions

### ✅ PREFERRED PATTERN (Module-scoped)

```typescript
// Clear, scoped imports from modules
import { CampaignsService, CampaignDto } from 'api/src/campaigns';
import { UsersService, UserDto } from 'api/src/users';
import { SubscriptionsService, SubscriptionDto } from 'api/src/subscriptions';

// Sub-modules when needed
import { CampaignChatService } from 'api/src/campaigns/services';
```

### ⚠️ DEPRECATED PATTERN (Shared - Phase 0.7 only)

```typescript
// This works now but is deprecated
import { CampaignDto } from 'shared';  // ⚠️ Will be removed in Phase 2

// Do not use - will fail after Phase 2
import { CampaignDto, CampaignsService } from 'shared';  // ❌ WRONG
```

### ❌ AVOID ABSOLUTE PATHS

```typescript
// Never do this
import { CampaignDto } from '/home/user/projects/api/src/campaigns/dtos/campaign.dto';
```

## Cross-Module Dependencies

### Dependency Direction (Acyclic Dependency Graph)

```
Infrastructure (Database, External APIs)
    ↑
    └─ Services (Business Logic)
    ↑
    └─ Controllers (HTTP Endpoints)
    ↑
    └─ Frontend
```

### Acceptable Cross-Module Dependencies

```typescript
// ✅ Campaigns service depends on Subscriptions service (feature dependency)
import { SubscriptionsService } from 'api/src/subscriptions';

// ✅ Campaigns depends on common utilities
import { logger } from 'api/src/common/logger';

// ✅ Campaigns depends on shared types
import { UserJwt } from 'shared';
```

### Prohibited Patterns (Circular Dependencies)

```typescript
// ❌ Campaigns cannot depend on CreativeChat if CreativeChat depends on Campaigns
// Use dependency injection and interfaces instead

// ❌ Frontend component cannot directly import backend service
import { CampaignsService } from 'api/src/campaigns';  // WRONG in frontend

// ✅ Frontend should use API client instead
import { campaignsApi } from 'frontend/lib/api/campaigns.api';
```

## Validation Patterns

### DTO Validation Checklist

When creating or updating DTOs, ensure:

- [ ] All required fields have `@IsNotEmpty()`
- [ ] String fields have `@MinLength()` and `@MaxLength()`
- [ ] Enum fields use `@IsEnum(MyEnum)`
- [ ] Optional fields use `@IsOptional()`
- [ ] Nested objects use `@ValidateNested()` and `@Type()`
- [ ] Arrays use `@IsArray()` with `@ArrayMinSize()` if required
- [ ] Email fields use `@IsEmail()`
- [ ] URL fields use `@IsUrl()`
- [ ] Comments document each field's purpose

### Example: Comprehensive DTO with Validation

```typescript
import { 
  IsNotEmpty, IsString, IsOptional, IsEmail, IsEnum, 
  MinLength, MaxLength, ValidateNested, Type, IsArray, 
  ArrayMinSize, Matches 
} from 'class-validator';

export class CreateCampaignDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Campaign name must be at least 3 characters' })
  @MaxLength(200, { message: 'Campaign name must not exceed 200 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  objective?: string;

  @IsNotEmpty()
  @IsEnum(['brand_awareness', 'lead_generation', 'traffic_driving'], {
    message: 'Invalid objective. Must be one of: brand_awareness, lead_generation, traffic_driving',
  })
  objective_type: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StrategyVersionDto)
  strategies?: StrategyVersionDto[];

  @IsNotEmpty()
  @IsString()
  tenantId: string;
}
```

## Migration Timeline

### Phase 0.7 (Current - Week 2)
- ✅ DTOs relocated to module-scoped folders
- ✅ Barrel exports created
- ✅ Compatibility re-exports in shared/index.ts
- ⚠️ No deprecation warnings (grace period)
- 📌 Action: Start using new import paths

### Phase 1 (Week 3-4)
- ⚠️ Deprecation warnings added to console
- ⚠️ Old imports still work
- ✅ New imports fully supported
- 📌 Action: Update imports gradually

### Phase 2 (Week 5-6)
- ❌ Old imports removed (breaking change)
- ✅ Only new imports work
- 📌 Action: All imports must use new paths

## Troubleshooting

### "Cannot find module 'shared/campaign.dto'"

**Cause**: Using old import path after Phase 2

**Solution**: Update import to use module-scoped path:
```typescript
// ❌ Old
import { CampaignDto } from 'shared';

// ✅ New
import { CampaignDto } from 'api/src/campaigns';
```

### Circular Dependency Warning

**Cause**: Module A imports from B, and B imports from A

**Solution**: 
1. Identify the circular path
2. Extract common code to a shared utility module
3. Use dependency injection to break the cycle

```typescript
// ❌ Circular: A → B → A
// campaigns/campaigns.service.ts imports creatives service
// creatives/creatives.service.ts imports campaigns service

// ✅ Solution: Extract to common
// common/decorators/campaign.decorator.ts
// Both modules import from common instead
```

### TypeScript Path Alias Issues

**Cause**: `@app/campaigns` not resolving

**Solution**: Check `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@app/*": ["./src/*"]
    }
  }
}
```

### Import Order in index.ts

**Correct Order** (prevents circular dependency issues):
```typescript
// 1. External libraries
// 2. NestJS modules
// 3. Schemas & Models (infrastructure)
// 4. DTOs (data contracts)
// 5. Services (business logic)
// 6. Controllers (HTTP layer)
// 7. Main Module
export { CampaignsModule } from './campaigns.module';
export { CampaignsService } from './services';
export * from './dtos';
```

## Summary

| Aspect | Rule |
|--------|------|
| **Import Pattern** | `import { MyDto } from 'api/src/campaigns'` |
| **DTO Naming** | `<feature>.dto.ts`, `create-<feature>.dto.ts`, `update-<feature>.dto.ts` |
| **Validation** | All required fields: `@IsNotEmpty()`, strings: `@MinLength/@MaxLength()` |
| **Folder Structure** | `dtos/`, `schemas/`, `services/`, `controllers/`, + `index.ts` |
| **Barrel Exports** | Each module must export root `index.ts` with public API |
| **Dependencies** | Services → Controllers → HTTP, no circular dependencies |
| **Migration** | Phase 0.7 (now) → Phase 1 (warnings) → Phase 2 (removed) |

---

**For questions or issues**, refer to:
- Architecture Plan: `.github/prompts/plan-architectureComplianceReview.prompt.md`
- Progress Tracker: `docs/IMPLEMENTATION_PROGRESS.md`
- Deprecation Notice: `api/src/common/deprecation.ts`

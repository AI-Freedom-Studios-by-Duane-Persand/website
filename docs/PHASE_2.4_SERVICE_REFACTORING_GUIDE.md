# Phase 2.4 Service Refactoring Guide

## Overview

This guide provides step-by-step instructions for migrating services from direct Mongoose model injection to the repository pattern. Three reference implementations are provided:

1. **CampaignsService** - campaigns.service.refactored.ts (350 lines)
2. **UsersService** - users.service.refactored.ts (380 lines)
3. **SubscriptionsService** - subscriptions.service.refactored.ts (400 lines)

## Why Migrate?

### Benefits of Repository Pattern

| Issue Before | Solution After |
|---|---|
| Tight coupling to Mongoose models | Decoupled from data layer via interfaces |
| Manual tenant filtering on every query | Automatic tenant scoping via TenantContextService |
| Manual transaction management | Automatic via @Transactional decorator |
| Hard to test services | Can inject mock repositories in tests |
| Scattered business logic across services | Centralized in typed repository methods |
| Inconsistent error handling | Standardized in base repository |

### Architecture Changes

**Before:**
```typescript
@Injectable()
export class CampaignsService {
  constructor(@InjectModel('Campaign') private campaignModel: Model<Campaign>) {}
  
  async findActive() {
    // Manual tenant filtering
    return this.campaignModel.find({ 
      tenantId: this.getTenantIdManually(),
      status: 'active'
    });
  }
}
```

**After:**
```typescript
@Injectable()
export class CampaignsService {
  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly tenantContext: TenantContextService,
  ) {}
  
  async findActive() {
    // Automatic tenant scoping
    return this.campaignRepository.findActive(this.tenantContext.getTenantId());
  }
}
```

## Migration Steps

### Step 1: Update Service Constructor

**Change:**
- Remove `@InjectModel('ModelName') private modelName: Model<ModelName>`
- Add repository injection: `private readonly repository: EntityRepository`
- Add context: `private readonly tenantContext: TenantContextService`

**Example:**

```typescript
// BEFORE
constructor(@InjectModel('Campaign') private campaignModel: Model<Campaign>) {}

// AFTER
constructor(
  private readonly campaignRepository: CampaignRepository,
  private readonly tenantContext: TenantContextService,
) {}
```

### Step 2: Get Tenant ID Consistently

**All methods should extract tenant ID at the start:**

```typescript
async create(createDto: CreateCampaignDto): Promise<CampaignDto> {
  const tenantId = this.tenantContext.getTenantId();
  // Rest of method uses tenantId
}
```

**Also available:**
```typescript
const userId = this.tenantContext.getUserId();
const hasRole = this.tenantContext.hasRole('admin');
const scopedFilter = this.tenantContext.createScopedFilter({});
```

### Step 3: Replace Direct Model Calls

**Pattern for all CRUD operations:**

| Operation | Before | After |
|---|---|---|
| **Create** | `this.model.create({...})` | `this.repository.create({...}, tenantId)` |
| **Find One** | `this.model.findById(id)` | `this.repository.findById(id, tenantId)` |
| **Find Many** | `this.model.find({...})` | `this.repository.find({...}, tenantId)` |
| **Update** | `this.model.findByIdAndUpdate(id, {...})` | `this.repository.updateById(id, {...}, tenantId)` |
| **Delete** | `this.model.findByIdAndDelete(id)` | `this.repository.deleteById(id, tenantId)` |

### Step 4: Use Repository-Level Queries

Each repository provides business-specific queries that already handle tenant scoping:

**CampaignRepository:**
```typescript
// Automatically scoped to tenant
campaigns = await this.campaignRepository.findActive(tenantId);
campaigns = await this.campaignRepository.findByStatus('draft', tenantId);
stats = await this.campaignRepository.getStatistics(tenantId);
```

**UserRepository:**
```typescript
// Automatically scoped to tenant
users = await this.userRepository.findByRole('admin', tenantId);
users = await this.userRepository.findActive(tenantId);
inactive = await this.userRepository.findInactiveUsers(30, tenantId);
```

**SubscriptionRepository:**
```typescript
// Automatically scoped to tenant
subs = await this.subscriptionRepository.findActive(tenantId);
expiring = await this.subscriptionRepository.findExpiringBefore(date, tenantId);
stats = await this.subscriptionRepository.getStatistics(tenantId);
```

### Step 5: Add @Transactional Decorator

All write operations (create, update, delete) should use `@Transactional()`:

```typescript
@Transactional()
async create(createDto: CreateCampaignDto): Promise<CampaignDto> {
  const tenantId = this.tenantContext.getTenantId();
  return await this.campaignRepository.create(data, tenantId);
}

@Transactional()
async update(id: string, updateDto: UpdateDto): Promise<CampaignDto> {
  const tenantId = this.tenantContext.getTenantId();
  return await this.campaignRepository.updateById(id, updateDto, tenantId);
}

@Transactional()
async delete(id: string): Promise<boolean> {
  const tenantId = this.tenantContext.getTenantId();
  return await this.campaignRepository.deleteById(id, tenantId);
}
```

### Step 6: Use Pagination from Repository

All repositories extend `AdvancedMongooseRepository` which provides pagination:

```typescript
async findAll(page: number = 1, pageSize: number = 10) {
  const tenantId = this.tenantContext.getTenantId();
  const result = await this.repository.getPaginated(
    tenantId,
    page,
    pageSize,
    { status: 'active' }, // optional filter
  );

  return {
    items: result.items.map(item => this.mapToDto(item)),
    total: result.pagination.total,
    page: result.pagination.page,
    pageSize: result.pagination.pageSize,
  };
}
```

## Service Migration Checklist

For each service, follow this checklist:

- [ ] **Constructor**: Remove model injection, add repository + TenantContextService
- [ ] **All read methods**: Extract tenantId, use repository methods
- [ ] **All write methods**: Add @Transactional decorator
- [ ] **Error handling**: Wrap in try-catch with logger
- [ ] **Pagination**: Use repository.getPaginated() instead of manual slicing
- [ ] **Statistics**: Use repository methods (getStatistics, etc.)
- [ ] **DTO mapping**: Consistent mapToDto() private method
- [ ] **Type safety**: All parameters and returns properly typed
- [ ] **Documentation**: JSDoc comments on public methods
- [ ] **Testing**: Verify no TypeScript errors

## Apply to Production Services

### CampaignsService

1. **Reference**: `api/src/campaigns/campaigns.service.refactored.ts`
2. **Replace**: `api/src/campaigns/campaigns.service.ts`
3. **Update module**: Add CampaignRepository to providers in campaigns.module.ts

```typescript
// campaigns.module.ts
@Module({
  imports: [MongooseModule.forFeature([{ name: 'Campaign', schema: CampaignSchema }])],
  providers: [CampaignsService, CampaignRepository],
  exports: [CampaignsService],
})
export class CampaignsModule {}
```

### UsersService

1. **Reference**: `api/src/users/users.service.refactored.ts`
2. **Replace**: `api/src/users/users.service.ts`
3. **Update module**: Add UserRepository to providers in users.module.ts

### SubscriptionsService

1. **Reference**: `api/src/subscriptions/subscriptions.service.refactored.ts`
2. **Replace**: `api/src/subscriptions/subscriptions.service.ts`
3. **Update module**: Add SubscriptionRepository to providers in subscriptions.module.ts

## Module Configuration Example

After repository creation, update module providers:

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CampaignsService } from './campaigns.service';
import { CampaignRepository } from './repositories/campaign.repository';
import { CampaignSchema } from './schemas/campaign.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Campaign', schema: CampaignSchema }]),
  ],
  providers: [
    CampaignsService,
    CampaignRepository, // NEW: Add repository
  ],
  exports: [CampaignsService],
})
export class CampaignsModule {}
```

## Common Patterns

### Pattern 1: Find and Throw

```typescript
async findById(id: string): Promise<CampaignDto> {
  const tenantId = this.tenantContext.getTenantId();
  const campaign = await this.campaignRepository.findById(id, tenantId);

  if (!campaign) {
    throw new NotFoundException(`Campaign ${id} not found`);
  }

  return this.mapToCampaignDto(campaign);
}
```

### Pattern 2: Create with Validation

```typescript
@Transactional()
async create(createDto: CreateCampaignDto): Promise<CampaignDto> {
  const tenantId = this.tenantContext.getTenantId();

  // Validate uniqueness if needed
  const existing = await this.campaignRepository.findOne({ name: createDto.name }, tenantId);
  if (existing) {
    throw new BadRequestException('Campaign name already in use');
  }

  const campaign = await this.campaignRepository.create(
    { ...createDto, tenantId },
    tenantId,
  );

  return this.mapToCampaignDto(campaign);
}
```

### Pattern 3: Update with Verification

```typescript
@Transactional()
async update(id: string, updateDto: UpdateCampaignDto): Promise<CampaignDto> {
  const tenantId = this.tenantContext.getTenantId();

  // Verify ownership
  const existing = await this.campaignRepository.findById(id, tenantId);
  if (!existing) {
    throw new NotFoundException(`Campaign ${id} not found`);
  }

  const updated = await this.campaignRepository.updateById(id, updateDto, tenantId);
  return this.mapToCampaignDto(updated);
}
```

### Pattern 4: Delete with Logging

```typescript
@Transactional()
async delete(id: string): Promise<boolean> {
  const tenantId = this.tenantContext.getTenantId();

  const deleted = await this.campaignRepository.deleteById(id, tenantId);
  
  if (deleted) {
    this.logger.log(`Campaign deleted: ${id}`);
  }

  return deleted;
}
```

### Pattern 5: Pagination with Filter

```typescript
async findAll(page: number = 1, pageSize: number = 10, filter?: any) {
  const tenantId = this.tenantContext.getTenantId();

  const result = await this.campaignRepository.getPaginated(
    tenantId,
    page,
    pageSize,
    filter,
  );

  return {
    items: result.items.map(item => this.mapToCampaignDto(item)),
    total: result.pagination.total,
    page: result.pagination.page,
    pageSize: result.pagination.pageSize,
  };
}
```

## Error Handling

### Error Types to Handle

```typescript
// Not found
throw new NotFoundException(`Resource ${id} not found`);

// Bad request
throw new BadRequestException('Invalid request parameter');

// Unauthorized
throw new UnauthorizedException('Access denied');

// Conflict
throw new ConflictException('Resource already exists');
```

### Logging Pattern

```typescript
private readonly logger = new Logger(ServiceName.name);

@Transactional()
async create(createDto: CreateDto): Promise<Dto> {
  try {
    const result = await this.repository.create(data, tenantId);
    this.logger.log(`Resource created: ${result._id}`);
    return this.mapToDto(result);
  } catch (error) {
    this.logger.error('Resource creation failed', error);
    throw error;
  }
}
```

## Testing Implications

### Before (Hard to Test)

```typescript
// Need actual Mongoose model
const mockModel = {
  find: jest.fn().mockResolvedValue([...]),
};
const service = new CampaignsService(mockModel);
```

### After (Easy to Test)

```typescript
// Can mock repository easily
const mockRepository = {
  findActive: jest.fn().mockResolvedValue([...]),
};
const service = new CampaignsService(mockRepository, mockContext);
```

## Rollout Strategy

1. **Phase 2.4a**: Refactor CampaignsService (highest priority)
2. **Phase 2.4b**: Refactor UsersService
3. **Phase 2.4c**: Refactor SubscriptionsService
4. **Phase 2.4d**: Refactor remaining services (TenantService, etc.)
5. **Phase 2.5**: Verify all services compile and tests pass
6. **Phase 2.6**: Deploy to staging and validate behavior

## Validation Steps

After refactoring each service:

1. **TypeScript Compilation**
   ```bash
   npm run build
   ```

2. **Type Errors**
   ```bash
   npm run lint
   ```

3. **Tests**
   ```bash
   npm test -- <service>.spec.ts
   ```

4. **Manual Verification**
   - Create operation works
   - Update operation works
   - Delete operation works
   - Filtering works
   - Pagination works
   - Tenant scoping works (verify in logs)

## Success Criteria

Service refactoring is complete when:

- ✅ No direct `@InjectModel()` in constructor
- ✅ All methods use repository instead of model
- ✅ All write operations have `@Transactional()`
- ✅ All methods extract tenant ID consistently
- ✅ TypeScript compilation succeeds (0 errors)
- ✅ All existing tests pass
- ✅ New repository methods used where applicable
- ✅ JSDoc comments on all public methods
- ✅ Pagination uses repository.getPaginated()
- ✅ Error handling matches patterns above

## FAQ

**Q: Can I keep using the old service while refactoring?**
A: Yes, old and new services can coexist during development. Switch over gradually.

**Q: What if the repository doesn't have the query I need?**
A: Add the query to the repository first, then use it in the service.

**Q: Do I need to update all services at once?**
A: No, migrate one service at a time. Each is independent.

**Q: What about circular dependencies?**
A: Repositories don't depend on services, so no circular dependency risk.

**Q: How do I handle complex queries?**
A: Add them as methods in the repository using AdvancedMongooseRepository.aggregate().

## References

- **Decorator**: `api/src/infrastructure/decorators/transactional.decorator.ts`
- **Context**: `api/src/infrastructure/context/tenant-context.ts`
- **Base Repository**: `api/src/infrastructure/repositories/base.repository.ts`
- **Concrete Repositories**: `api/src/*/repositories/*.repository.ts`
- **Interfaces**: `api/src/infrastructure/interfaces/`

## Next Steps

1. Review the three refactored service templates
2. Start with CampaignsService as reference
3. Apply pattern to all services systematically
4. Commit each refactored service
5. Move to Phase 3: Frontend integration

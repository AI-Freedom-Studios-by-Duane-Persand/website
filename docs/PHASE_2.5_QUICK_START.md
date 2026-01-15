# Phase 2.5 Quick-Start: Apply Service Templates

**Duration**: ~2.5 hours for 3 core services  
**Difficulty**: Low (copy/adapt templates)  
**Requirements**: Git, npm, text editor  

---

## Before You Start

### Prerequisites Checklist
- [ ] Read `docs/PHASE_2.4_SERVICE_REFACTORING_GUIDE.md`
- [ ] Review the three template files in your editor
- [ ] Ensure `npm run build` succeeds on current main branch
- [ ] Create a feature branch: `git checkout -b feat/service-refactoring`

### Required Files (All ✅ Present)
- [x] `api/src/campaigns/repositories/campaign.repository.ts` (CampaignRepository)
- [x] `api/src/users/repositories/user.repository.ts` (UserRepository)
- [x] `api/src/subscriptions/repositories/subscription.repository.ts` (SubscriptionRepository)
- [x] `api/src/campaigns/campaigns.service.refactored.ts` (Template)
- [x] `api/src/users/users.service.refactored.ts` (Template)
- [x] `api/src/subscriptions/subscriptions.service.refactored.ts` (Template)

---

## Step-by-Step Application

### Step 1: CampaignsService Refactoring (30 minutes)

#### 1.1 Review the Template
```bash
cat api/src/campaigns/campaigns.service.refactored.ts
```
**What to notice**:
- Constructor injects CampaignRepository + TenantContextService
- Methods extract tenantId at the start
- All write operations have @Transactional()
- All queries use repository methods

#### 1.2 Open Current Service
```bash
# Open in your editor
code api/src/campaigns/campaigns.service.ts
```

#### 1.3 Replace Service Content
You have two options:

**Option A: Copy Template (Fastest)**
1. Open `campaigns.service.refactored.ts`
2. Select all content (Ctrl+A)
3. Copy (Ctrl+C)
4. Open `campaigns.service.ts`
5. Select all (Ctrl+A)
6. Paste (Ctrl+V)
7. Save (Ctrl+S)

**Option B: Manual Migration (More Control)**
Follow the pattern in the template:
1. Update constructor (add repository + context injection)
2. Refactor each method one-by-one
3. Add @Transactional() to write operations
4. Use repository methods instead of model

#### 1.4 Update Module Providers
Edit `api/src/campaigns/campaigns.module.ts`:

```typescript
import { CampaignRepository } from './repositories/campaign.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Campaign', schema: CampaignSchema }]),
  ],
  providers: [
    CampaignsService,
    CampaignRepository,  // ADD THIS LINE
  ],
  exports: [CampaignsService],
})
export class CampaignsModule {}
```

#### 1.5 Verify Compilation
```bash
npm run build
```

**Expected**: 0 errors (or document any issues)

#### 1.6 Run Tests
```bash
npm test -- campaigns.service.spec.ts
```

**Expected**: All tests pass or show clear error messages

---

### Step 2: UsersService Refactoring (30 minutes)

#### 2.1 Review Template
```bash
cat api/src/users/users.service.refactored.ts
```

#### 2.2 Apply Same Steps as Step 1
1. Open current service: `api/src/users/users.service.ts`
2. Copy template content or manually migrate
3. Update module providers (add UserRepository)
4. Verify compilation: `npm run build`
5. Run tests: `npm test -- users.service.spec.ts`

#### 2.3 Update users.module.ts
```typescript
import { UserRepository } from './repositories/user.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  providers: [
    UsersService,
    UserRepository,  // ADD THIS LINE
  ],
  exports: [UsersService],
})
export class UsersModule {}
```

---

### Step 3: SubscriptionsService Refactoring (30 minutes)

#### 3.1 Review Template
```bash
cat api/src/subscriptions/subscriptions.service.refactored.ts
```

#### 3.2 Apply Same Steps
1. Open current service: `api/src/subscriptions/subscriptions.service.ts`
2. Copy template content or manually migrate
3. Update module providers (add SubscriptionRepository)
4. Verify compilation: `npm run build`
5. Run tests: `npm test -- subscriptions.service.spec.ts`

#### 3.3 Update subscriptions.module.ts
```typescript
import { SubscriptionRepository } from './repositories/subscription.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Subscription', schema: SubscriptionSchema }]),
  ],
  providers: [
    SubscriptionsService,
    SubscriptionRepository,  // ADD THIS LINE
  ],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
```

---

### Step 4: Full Validation (15 minutes)

#### 4.1 Clean Build
```bash
rm -rf dist node_modules/.cache
npm run build
```

**Expected**: Completes with 0 errors

#### 4.2 All Tests
```bash
npm test
```

**Expected**: All tests pass

#### 4.3 Linting
```bash
npm run lint
```

**Expected**: No errors (warnings okay)

#### 4.4 Manual Smoke Tests (Optional)
Using Postman/Thunder Client, test:
- [ ] Create campaign → should work
- [ ] List campaigns with pagination → should work
- [ ] Update campaign → should work
- [ ] Delete campaign → should work
- [ ] Create user → should work
- [ ] Create subscription → should work

---

### Step 5: Commit Changes (5 minutes)

#### 5.1 Review Changes
```bash
git diff api/src/campaigns/campaigns.service.ts
git diff api/src/users/users.service.ts
git diff api/src/subscriptions/subscriptions.service.ts
```

#### 5.2 Verify Only Service Files Changed
```bash
git status
```

**Should show only**:
- `api/src/campaigns/campaigns.service.ts`
- `api/src/users/users.service.ts`
- `api/src/subscriptions/subscriptions.service.ts`
- `api/src/campaigns/campaigns.module.ts`
- `api/src/users/users.module.ts`
- `api/src/subscriptions/subscriptions.module.ts`

#### 5.3 Stage Changes
```bash
git add api/src/campaigns/campaigns.service.ts
git add api/src/campaigns/campaigns.module.ts
git add api/src/users/users.service.ts
git add api/src/users/users.module.ts
git add api/src/subscriptions/subscriptions.service.ts
git add api/src/subscriptions/subscriptions.module.ts
```

#### 5.4 Commit
```bash
git commit -m "feat(phase-2.5a-c): Apply repository pattern to core services"
```

#### 5.5 Push Branch
```bash
git push origin feat/service-refactoring
```

---

## Troubleshooting

### Error: "Cannot find module 'CampaignRepository'"
**Solution**: Check module imports
```typescript
import { CampaignRepository } from './repositories/campaign.repository';
```

### Error: "Property 'getTenantId' does not exist on type 'TenantContextService'"
**Solution**: Import the service
```typescript
import { TenantContextService } from '../../infrastructure/context/tenant-context';
```

### Error: "Decorator @Transactional is not defined"
**Solution**: Import the decorator
```typescript
import { Transactional } from '../../infrastructure/decorators/transactional.decorator';
```

### Compilation Error: "Expected 3 arguments, got 2"
**Solution**: Ensure you're passing `tenantId` to repository methods
```typescript
// Wrong:
await this.repository.findById(id);

// Right:
await this.repository.findById(id, tenantId);
```

### Test Failures After Migration
**Common Cause**: Tests expect model injection  
**Solution**: Update test mocks to inject repository instead
```typescript
// Old mock
const mockModel = { find: jest.fn() };
TestingModule.createTestingModule({
  providers: [{ provide: 'CampaignModel', useValue: mockModel }]
});

// New mock
const mockRepository = { findActive: jest.fn() };
TestingModule.createTestingModule({
  providers: [{ provide: CampaignRepository, useValue: mockRepository }]
});
```

---

## Verification Checklist

After completing all three services, verify:

- [ ] All three services refactored
- [ ] All three modules updated with repository providers
- [ ] `npm run build` succeeds (0 errors)
- [ ] `npm test` passes all tests
- [ ] `npm run lint` passes (or only warnings)
- [ ] Git diff shows only service files changed
- [ ] Manual smoke tests pass (create, read, update, delete)
- [ ] No direct `@InjectModel()` in refactored services
- [ ] All write operations have `@Transactional()`
- [ ] All methods extract tenantId at start
- [ ] All CRUD uses repository instead of model

---

## Common Patterns Reference

### Pattern 1: Extract Tenant ID
```typescript
const tenantId = this.tenantContext.getTenantId();
```

### Pattern 2: Find by ID with Error
```typescript
const item = await this.repository.findById(id, tenantId);
if (!item) throw new NotFoundException(`Not found: ${id}`);
return this.mapToDto(item);
```

### Pattern 3: Create with @Transactional
```typescript
@Transactional()
async create(createDto: CreateDto): Promise<Dto> {
  const tenantId = this.tenantContext.getTenantId();
  const item = await this.repository.create(createDto as any, tenantId);
  return this.mapToDto(item);
}
```

### Pattern 4: Pagination
```typescript
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
```

### Pattern 5: Statistics
```typescript
const stats = await this.repository.getStatistics(tenantId);
return {
  total: stats.total,
  active: stats.active,
  // ... etc
};
```

---

## Post-Implementation Actions

### Immediate (Same Day)
- [x] Apply all three service templates
- [x] Update all three module providers
- [x] Verify compilation and tests
- [x] Commit to feature branch

### Next Steps (Phase 2.5d+)
- [ ] Apply same pattern to secondary services (TenantService, AuthService, etc.)
- [ ] Update all remaining services
- [ ] Full regression testing
- [ ] Performance validation
- [ ] Staging deployment
- [ ] Production deployment

### Documentation (After Verification)
- [ ] Update API documentation
- [ ] Update migration guide with lessons learned
- [ ] Document any deviations from template
- [ ] Create architecture decision record (ADR)

---

## Time Breakdown

| Task | Estimated | Actual |
|------|-----------|--------|
| Review templates | 15 min | ___ |
| CampaignsService refactoring | 30 min | ___ |
| UsersService refactoring | 30 min | ___ |
| SubscriptionsService refactoring | 30 min | ___ |
| Build & test validation | 15 min | ___ |
| Git commit & push | 5 min | ___ |
| **Total** | **~2.5 hours** | **___** |

---

## Success Indicators

✅ **Phase 2.5 is complete when**:
1. All three services use CampaignRepository, UserRepository, SubscriptionRepository
2. No `@InjectModel()` directly in services
3. All write operations have `@Transactional()`
4. All queries use repository methods
5. TenantContextService used for tenant scoping
6. TypeScript compilation succeeds (0 errors)
7. All tests pass
8. Changes committed to git with clear message

---

## Questions?

- **Where are the templates?** → `api/src/campaigns/campaigns.service.refactored.ts` (and users, subscriptions)
- **How do I know if it's working?** → `npm run build` and `npm test` both succeed
- **What if I break something?** → `git revert HEAD` to rollback
- **Do I need to update tests?** → Yes, if tests mock the model directly
- **Can I do this gradually?** → Yes, one service at a time is fine

---

**Ready to proceed? Start with Step 1: CampaignsService Refactoring** 🚀

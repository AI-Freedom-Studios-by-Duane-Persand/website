# Import Patterns Documentation

## Project Structure
```
AI Freedom Studios/
├── api/src/              # Backend NestJS code
├── frontend/             # Frontend code
└── shared/               # Shared DTOs and types
```

## Import Path Rules

### From `api/src/*` to `shared/`
**Pattern:** `../../../shared/`
**Reason:** Need to go 3 levels up (file → module → src → api) to reach project root

**Examples:**
```typescript
// From api/src/auth/auth.controller.ts
import { UserJwt } from '../../../shared/user-jwt.interface';

// From api/src/users/users.service.ts
import { User } from '../../../shared/types';

// From api/src/tenants/tenants.controller.ts
import { CreateTenantDto } from '../../../shared/tenant.dto';
```

### From `frontend/` to `shared/`
**Pattern:** `../../../shared/` (from `frontend/lib/`)
**Reason:** Need to go 3 levels up (file → lib → frontend) to reach project root

**Example:**
```typescript
// From frontend/lib/branding.ts
import { BrandingConfig } from '../../../shared/branding.dto';
```

### Module-Specific DTOs
Some DTOs belong to specific modules and should be imported locally:

```typescript
// From api/src/campaigns/campaigns.controller.ts
import { CreateCampaignDto } from './dto/create-campaign.dto';

// From api/src/engines/strategy.engine.ts
import { CreateCampaignDto } from '../campaigns/dto/create-campaign.dto';
```

## Fixed Import Issues (Session Log)

### Backend Files (15+ files corrected)
All corrected from `../../../../shared/` to `../../../shared/`:

1. **Auth Module**
   - `api/src/auth/auth.controller.ts` - UserJwt import

2. **Users Module**
   - `api/src/users/users.service.ts` - User type import

3. **Tenants Module**
   - `api/src/tenants/tenants.service.ts` - Tenant type import
   - `api/src/tenants/tenants.controller.ts` - Tenant and DTO imports

4. **Subscriptions Module**
   - `api/src/subscriptions/subscriptions.controller.ts` - UserJwt import
   - `api/src/subscriptions/subscriptions.service.ts` - SubscriptionDto import
   - `api/src/subscriptions/subscriptionsV2.controller.ts` - UserJwt import

5. **Campaigns Module**
   - `api/src/campaigns/campaigns.controller.ts` - Changed to local DTO
   - `api/src/campaigns/campaigns.service.ts` - Changed to local DTO

6. **Engines Module**
   - `api/src/engines/strategy.engine.ts` - Changed to local DTO
   - `api/src/engines/copy.engine.ts` - Changed to local DTO
   - `api/src/engines/engines.controller.ts` - UserJwt import

7. **Creatives Module**
   - `api/src/creatives/creatives.service.ts` - Creative types import
   - `api/src/creatives/creatives.controller.ts` - Creative DTO import

8. **Controllers**
   - `api/src/controllers/billing.controller.ts` - UserJwt import
   - `api/src/controllers/assets.controller.ts` - UserJwt import

9. **Scheduling Module**
   - `api/src/scheduling/scheduling.controller.ts` - UserJwt import

10. **Config**
    - `api/src/config/plans.ts` - Plan type import

### Frontend Files
1. **Branding**
   - `frontend/lib/branding.ts` - BrandingConfig import

## Duplicate Resolution

### CreateCampaignDto Consolidation
**Issue:** Two versions existed:
- `shared/create-campaign.dto.ts` - Basic version
- `api/src/campaigns/dto/create-campaign.dto.ts` - Enhanced version

**Resolution:**
- ✅ Consolidated to use `api/src/campaigns/dto/create-campaign.dto.ts`
- ✅ Added missing `campaignId?: string;` field
- ✅ Removed duplicate from `shared/`
- ✅ Cleaned up `tsconfig.json` reference

## Verification

All compilation errors resolved. Run these commands to verify:

```powershell
# Check backend compilation
cd api
npm run build

# Check frontend compilation
cd ../frontend
npm run build
```

## Best Practices

1. **Use absolute paths from module root** when available via tsconfig paths
2. **Keep shared types in `shared/`** for cross-project reuse
3. **Keep module-specific DTOs in module folders** for encapsulation
4. **Verify import depth** matches actual folder structure
5. **Avoid duplicate definitions** across shared/ and module folders

## Import Checklist

When adding new imports:
- [ ] Determine if type/DTO should be in `shared/` or module-specific
- [ ] Count folder levels from source to target
- [ ] Use correct relative path depth
- [ ] Avoid duplicating types across shared/ and modules
- [ ] Update this documentation if new patterns emerge

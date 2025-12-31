# Campaign Management Architecture

## Overview
This document describes the production-ready campaign management system with strategy versioning, approval workflows, scheduling, and asset management.

## Core Concepts

### 1. Strategy-First Design
Campaigns start with strategy definition before content creation. Strategy changes automatically invalidate downstream content and approvals.

### 2. Versioning
- **Strategy Versions**: Track evolution of campaign strategy
- **Content Versions**: Link content to specific strategy versions
- Each version maintains full audit trail

### 3. Approval Workflow
Four independent approval gates:
- **Strategy**: Campaign objectives, platforms, audience
- **Content**: Text, images, videos
- **Schedule**: Publishing timeline
- **Ads**: Paid advertising configuration

### 4. Asset Management
- Centralized asset repository per campaign
- Tagging and categorization
- Cross-version reuse tracking
- Asset replacement with reference updates

### 5. Scheduling
- Auto-generation based on strategy cadence
- Manual slot management
- Conflict detection (multiple posts/day/platform)
- Slot locking to preserve confirmed times

## Services

### StrategyService
Manages campaign strategy lifecycle:
```typescript
- addStrategyVersion(dto, tenantId): Add new strategy version
- getLatestStrategyVersion(campaignId, tenantId): Get current strategy
- getAllStrategyVersions(campaignId, tenantId): View history
- invalidateStrategyVersion(campaignId, version, userId, tenantId): Mark as obsolete
```

**Automatic Invalidation**: When a new strategy version is added:
1. All approval states reset to 'pending' or 'needs_review'
2. Existing content versions marked as invalidated
3. Campaign status reverts to 'draft'

### ApprovalService
Manages approval workflow:
```typescript
- approveSection(dto, tenantId): Approve strategy/content/schedule/ads
- rejectSection(dto, tenantId): Reject section with reason
- getApprovalStatus(campaignId, tenantId): Check all approval states
- isReadyForPublishing(campaignId, tenantId): Verify all approved
- getSectionsNeedingReview(campaignId, tenantId): List pending approvals
- resetAllApprovals(campaignId, userId, tenantId): Reset to pending
```

**Publishing Gate**: Campaign can only be published when all required sections are approved.

### ScheduleService
Manages publishing schedule:
```typescript
- generateAutoSchedule(campaignId, userId, tenantId): Auto-generate slots
- addScheduleSlots(dto, tenantId): Manually add slots
- updateScheduleSlot(dto, tenantId): Move a slot
- toggleSlotLock(dto, tenantId): Lock/unlock slot
- getSchedule(campaignId, tenantId): View all slots
- clearUnlockedSlots(campaignId, userId, tenantId): Remove unlocked slots
```

**Features**:
- Parses cadence (e.g., "3x/week", "daily")
- Generates slots across 4 weeks
- Optimizes for best posting times per platform
- Detects conflicts (multiple posts same day/platform)
- Preserves locked slots during regeneration

### AssetService
Manages campaign assets:
```typescript
- addAsset(campaignId, dto, tenantId): Add asset reference
- tagAsset(dto, tenantId): Add tags to asset
- replaceAsset(dto, tenantId): Replace asset with automatic reference updates
- linkAssetToVersion(dto, tenantId): Link to strategy/content version
- getAssets(campaignId, tenantId): List all assets
- getAssetsByTag(campaignId, tag, tenantId): Filter by tag
- getAssetsByType(campaignId, type, tenantId): Filter by type
- getUnusedAssets(campaignId, tenantId): Find orphaned assets
- cleanupUnusedAssets(campaignId, userId, tenantId): Remove unused
```

**Asset Replacement**: Automatically updates all references in content versions when an asset is replaced.

## DTOs

### Strategy
```typescript
CreateStrategyVersionDto {
  platforms: string[]
  goals: string[]
  targetAudience: string
  contentPillars: string[]
  brandTone: string
  constraints?: string
  cadence: string
  adsConfig?: any
}
```

### Content
```typescript
CreateContentVersionDto {
  mode: 'ai' | 'manual' | 'hybrid'
  textAssets: string[]
  imageAssets: string[]
  videoAssets: string[]
  aiModel?: string
  regenerationMeta?: any
  strategyVersion: number
  needsReview?: boolean
}
```

### Approval
```typescript
ApproveDto {
  section: 'strategy' | 'content' | 'schedule' | 'ads'
  campaignId: string
  userId: string
  note?: string
}

RejectDto extends ApproveDto {
  reason: string
}
```

### Schedule
```typescript
CreateScheduleSlotDto {
  slot: Date
  platform: string
  locked?: boolean
}

AddScheduleDto {
  campaignId: string
  slots: CreateScheduleSlotDto[]
  userId: string
  note?: string
}
```

### Asset
```typescript
CreateAssetDto {
  url: string
  type: 'image' | 'video' | 'text' | 'other'
  tags?: string[]
  uploadedBy: string
}

TagAssetDto {
  campaignId: string
  assetUrl: string
  tags: string[]
  userId: string
}

ReplaceAssetDto {
  campaignId: string
  oldAssetUrl: string
  newAssetUrl: string
  userId: string
  note?: string
}
```

## API Endpoints

### Strategy
```
POST   /campaigns/:id/strategy-version       Add new strategy version
GET    /campaigns/:id/strategy-versions      List all versions
GET    /campaigns/:id/strategy-version/latest Get latest version
```

### Content
```
POST   /campaigns/:id/content-version        Add new content version
```

### Approval
```
POST   /campaigns/:id/approve                 Approve section
POST   /campaigns/:id/reject                  Reject section
GET    /campaigns/:id/approval-status        Get approval states
GET    /campaigns/:id/ready-to-publish       Check if ready
GET    /campaigns/:id/needs-review           List pending sections
```

### Schedule
```
POST   /campaigns/:id/schedule/generate       Auto-generate schedule
POST   /campaigns/:id/schedule/slots          Add manual slots
GET    /campaigns/:id/schedule                Get all slots
PATCH  /campaigns/:id/schedule/slot           Update slot time
POST   /campaigns/:id/schedule/lock           Lock/unlock slot
DELETE /campaigns/:id/schedule/unlocked       Clear unlocked slots
```

### Assets
```
POST   /campaigns/:id/assets                  Add asset
GET    /campaigns/:id/assets                  List assets
GET    /campaigns/:id/assets/tag/:tag         Get by tag
GET    /campaigns/:id/assets/type/:type       Get by type
POST   /campaigns/:id/assets/tag              Tag asset
POST   /campaigns/:id/assets/replace          Replace asset
POST   /campaigns/:id/assets/link             Link to version
GET    /campaigns/:id/assets/unused           Get unused assets
DELETE /campaigns/:id/assets/unused           Cleanup unused
```

## Error Handling

All services use the `ErrorHandler` utility from `common/errors.ts`:

```typescript
import { ErrorHandler, NotFoundError, ValidationError } from '../common/errors';

try {
  // operation
} catch (error) {
  ErrorHandler.handle(error, 'OperationName');
}
```

Available error types:
- `ValidationError`: Bad request (400)
- `NotFoundError`: Resource not found (404)
- `UnauthorizedError`: Auth required (401)
- `ForbiddenError`: No permission (403)
- `ConflictError`: Conflict state (409)
- `ExternalServiceError`: Third-party failure (503)

## Multi-Tenant Isolation

All operations enforce tenant isolation:
```typescript
const campaign = await this.campaignModel.findOne({ 
  _id: campaignId, 
  tenantId 
}).exec();
```

TenantId extracted from JWT token in controller:
```typescript
const user: UserJwt = req.user;
if (!user || !user.tenantId) {
  throw new BadRequestException('tenantId missing');
}
```

## Audit Trail

Every operation logs to `revisionHistory`:
```typescript
campaign.revisionHistory.push({
  revision: (campaign.revisionHistory?.length || 0) + 1,
  changedAt: new Date(),
  changedBy: userId,
  changes: { /* what changed */ },
  note: 'Optional note',
});
```

Also logs to `statusHistory` for status changes:
```typescript
campaign.statusHistory.push({
  status: 'active',
  changedAt: new Date(),
  changedBy: userId,
  note: 'Campaign activated',
});
```

## Testing

### Unit Tests
Test each service method in isolation:
```typescript
describe('StrategyService', () => {
  it('should add strategy version', async () => {
    const dto = { /* ... */ };
    const result = await service.addStrategyVersion(dto, 'tenantId');
    expect(result.strategyVersions).toHaveLength(2);
  });
});
```

### Integration Tests
Test full workflows:
```typescript
it('should invalidate content when strategy changes', async () => {
  // Create campaign with strategy v1 and content v1
  // Add strategy v2
  // Assert content v1 is invalidated
  // Assert approval states reset
});
```

## Best Practices

1. **Always use DTOs**: Validate input at controller level
2. **Multi-tenant**: Always pass and check tenantId
3. **Error handling**: Use ErrorHandler utility
4. **Audit trail**: Log all state changes
5. **Versioning**: Never delete versions, mark as invalidated
6. **Approval workflow**: Respect approval gates before publishing
7. **Asset management**: Link assets to versions for traceability
8. **Schedule conflicts**: Detect and surface to user

## Migration Guide

### From Legacy Campaign Structure
1. Create initial strategy version from campaign fields
2. Create initial content version linking to strategy v1
3. Set approval states to 'pending'
4. Migrate schedule if exists
5. Link existing assets to content v1

### Example:
```typescript
// Old campaign
const oldCampaign = {
  name: 'Summer Sale',
  platforms: ['instagram', 'facebook'],
  goals: ['awareness'],
  // ...
};

// New structure
await strategyService.addStrategyVersion({
  campaignId: campaign._id,
  platforms: oldCampaign.platforms,
  goals: oldCampaign.goals,
  // ...
}, tenantId);
```

## Future Enhancements

1. **Rollback**: Implement full rollback to previous revisions
2. **Collaboration**: Real-time collaboration with websockets
3. **Templates**: Save strategy/content as reusable templates
4. **Analytics**: Track performance by strategy version
5. **AI Recommendations**: Suggest optimal posting times
6. **Batch Operations**: Approve multiple sections at once
7. **Export**: Export campaign data for reporting

## Support

For questions or issues:
- Check logs in `api/logs/api.log`
- Review audit trail in `campaign.revisionHistory`
- Verify approval states in `campaign.approvalStates`
- Check for conflicts in `campaign.schedule[].conflict`

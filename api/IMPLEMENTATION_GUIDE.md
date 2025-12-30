# Campaign Automation Platform - Implementation Guide

## Implementation Overview

This document outlines the comprehensive implementation of the Campaign Automation Platform enhancements as specified in `plan-updateCampaignFlow.prompt.md`.

## 1. Core Enhancements Implemented

### 1.1 Strategy & Planning (Enhanced)

**Model**: `StrategyDocument` (`api/src/models/strategy.model.ts`)

Features:
- **Versioned strategies** with full audit trail
- **Platform-specific parameters**: platforms, goals, target audience, content pillars, brand tone, constraints, cadence, ads config
- **Invalidation tracking** for downstream updates
- **Automatic versioning** on strategy updates

**Service**: `StrategyService` (`api/src/strategies/strategy.service.ts`)

Methods:
- `createStrategy()`: Create new strategy version
- `getCurrentStrategy()`: Get latest valid strategy
- `getStrategyByVersion()`: Access historical versions
- `updateStrategy()`: Create new version, invalidate old
- `invalidateStrategy()`: Mark as invalid + invalidate dependents
- `invalidateDependentApprovals()`: Auto-cascade invalidation
- `checkStrategyCompleteness()`: For continuous prompting engine

**Controller**: `StrategiesController` (`api/src/strategies/strategies.controller.ts`)

Endpoints:
- `POST /campaigns/:campaignId/strategies` - Create strategy
- `GET /campaigns/:campaignId/strategies/current` - Current strategy
- `GET /campaigns/:campaignId/strategies/:version` - Historical version
- `GET /campaigns/:campaignId/strategies` - All versions
- `POST /campaigns/:campaignId/strategies/:version/invalidate` - Invalidate
- `POST /campaigns/:campaignId/strategies/:version/check-completeness` - Validation

---

### 1.2 Content Creation (Enhanced)

**Updates to `CreativesService`** (`api/src/creatives/creatives.service.ts`)

New selective regeneration methods:
- `replaceImage()`: Replace image without touching text
- `replaceVideo()`: Replace video + poster, preserve script
- `linkToStrategy()`: Link creative to strategy version for traceability

Enhanced `regenerateWithPrompt()`:
- Scoped regeneration: `caption`, `hashtags`, `prompt`, `script`, `all`
- Preserves unrelated content during updates

**Modes Supported**:
- **AI-generated**: Via Poe API integration
- **User-uploaded**: Manual asset uploads
- **Hybrid**: Mix of AI and manual assets

---

### 1.3 Asset Management (Enhanced)

**Model**: `AssetDocument` (already present, extended)

**StorageService Enhancements** (`api/src/storage/storage.service.ts`)

New methods for asset categorization and reuse:
- `searchAssets()`: Search by tags, type, keywords
- `getAssetCategories()`: Organize by tag
- `categorizeAsset()`: Add categories/tags
- `cloneAsset()`: Enable cross-campaign reuse
- `getAssetStats()`: Track usage patterns
- `replaceAsset()`: Maintain references during updates
- `tagAsset()`: Add/merge tags

**Features**:
- **Tag-based organization**: Categorize and discover assets
- **Cross-campaign reuse**: Clone assets with full metadata
- **Asset lifecycle**: Track usage, aging, replacement
- **Soft delete support**: Archive without removing

---

### 1.4 Approval Workflow (New)

**Model**: Approval states embedded in `CampaignDocument`

**Service**: `ApprovalService` (`api/src/approvals/approval.service.ts`)

Features:
- **Independent approval scopes**: strategy, content, schedule, ads
- **Status tracking**: pending, approved, rejected, needs_review
- **Audit trail**: timestamps, user IDs, reasons
- **Dependent invalidation**: Strategy changes invalidate downstream

Methods:
- `initializeApprovals()`: Set up required scopes
- `approve()`: Mark scope as approved
- `reject()`: Reject with reason
- `invalidateApproval()`: Mark for re-review
- `invalidateDependentApprovals()`: Cascade invalidation
- `canPublish()`: Check readiness
- `getApprovalStatus()`: Full status view

**Controller**: `ApprovalsController` (`api/src/approvals/approvals.controller.ts`)

Endpoints:
- `GET /campaigns/:campaignId/approvals` - Status
- `POST /campaigns/:campaignId/approvals/initialize` - Setup
- `POST /campaigns/:campaignId/approvals/:scope/approve` - Approve
- `POST /campaigns/:campaignId/approvals/:scope/reject` - Reject
- `POST /campaigns/:campaignId/approvals/check-publish` - Publish check

---

### 1.5 Continuous Prompting Engine (New)

**Service**: `PromptingEngineService` (`api/src/prompting/prompting-engine.service.ts`)

Evaluates campaigns for:
- **Missing inputs**: Strategy, content, assets
- **Conflicting configurations**: Cadence vs. scheduled content
- **Low-confidence values**: Recommendations for improvement
- **Suggestions**: Platform-specific best practices

Methods:
- `evaluateCampaign()`: Generate context-aware prompts
- `getRecommendation()`: AI-generated suggestions
- `recordPromptResponse()`: Track user responses (skip/accept/later)
- `getSkippedPrompts()`: Find skipped items
- `getPublishingBlockers()`: Critical items blocking publish

**Prompt Categories**:
- `missing`: Required but absent fields
- `conflicting`: Contradictory configurations
- `low_confidence`: Uncertain inferred values
- `suggestion`: Optional improvements

**Controller**: `PromptingController` (`api/src/prompting/prompting.controller.ts`)

Endpoints:
- `GET /campaigns/:campaignId/prompting/evaluate` - Evaluation
- `GET /campaigns/:campaignId/prompting/blockers` - Publish blockers
- `GET /campaigns/:campaignId/prompting/recommendation` - Suggestions
- `POST /campaigns/:campaignId/prompting/record-response` - Track response

---

### 1.6 Media Rendering (New)

**Model**: `RenderJobDocument` (`api/src/models/renderJob.model.ts`)

Features:
- **Job tracking**: status (queued, running, failed, published)
- **Provider abstraction**: Support multiple renderers
- **Progress tracking**: Steps, estimated time, logs
- **Output management**: Primary + variants + poster frames
- **Error handling**: Retries, backoff, detailed logs
- **Metadata storage**: Model params, seed, hash for deduplication

Schema fields:
- `type`: 'image' | 'video'
- `provider`: 'stable-diffusion', 'runway', 'pika', etc.
- `status`: 'queued' | 'running' | 'failed' | 'published' | 'cancelled'
- `params`: Render parameters (prompt, seed, width, etc.)
- `providerJobId`: External job ID for polling
- `progress`: Step tracking and ETA
- `outputUrls`: Primary + variants + poster
- `logs`: Detailed audit trail
- `metadata`: Hash, model info, regeneration count

**Service**: `MediaRendererService` (`api/src/media/media-renderer.service.ts`)

Core Methods:
- `registerProvider()`: Add renderer implementation
- `createRenderJob()`: Queue job
- `submitJob()`: Submit to external provider
- `pollJobStatus()`: Check progress
- `handleProviderWebhook()`: Async callback support
- `cancelJob()`: Cancel in-progress render
- `getJobStatus()`: Detailed status view

Provider Interface:
```typescript
interface RendererProvider {
  name: string;
  canRender(type: 'image' | 'video'): boolean;
  render(jobId: string, input: RenderJobInput): Promise<{ providerJobId: string }>;
  pollStatus(jobId: string, providerJobId: string): Promise<{ status: 'pending' | 'completed' | 'failed'; progress?: number }>;
  handleWebhook(payload: any): Promise<{ jobId: string; status: 'completed' | 'failed' }>;
}
```

**Controller**: `MediaRendererController` (`api/src/media/media-renderer.controller.ts`)

Endpoints:
- `POST /render-jobs/create` - Queue job
- `POST /render-jobs/:jobId/submit` - Submit to provider
- `GET /render-jobs/:jobId/status` - Job status
- `GET /render-jobs/:jobId/poll` - Poll provider
- `POST /render-jobs/:jobId/cancel` - Cancel job
- `POST /render-jobs/webhook/:provider` - Webhook receiver

---

## 2. Workflow Integration

### 2.1 Campaign Creation Flow

1. **Create campaign** → Initialize approval states
2. **Define strategy** → Create strategy v1
3. **Generate content** → Create creatives + link to strategy
4. **Submit for approval** → Initialize approval workflow
5. **Approve strategy** → Content + schedule approvals become valid
6. **Generate images/videos** → Queue render jobs
7. **Review renders** → Approve or regenerate
8. **Approve content** → Content approval
9. **Schedule posts** → Create schedule entries
10. **Approve schedule** → Schedule approval
11. **Publish** → Check all approvals, publish

### 2.2 Strategy Update Flow

1. **Update strategy** → Create strategy v2
2. **Invalidate old strategy** → Mark v1 as invalid
3. **Auto-invalidate dependents** → Content, schedule, ads approvals → needs_review
4. **Regenerate content** (if needed) → Create new content version
5. **Re-submit for approval** → Re-approval workflow

### 2.3 Selective Content Regeneration

1. **Replace image** → `replaceImage()` without changing text
2. **Regenerate caption** → `regenerateWithPrompt(scope='caption')`
3. **Update hashtags** → `regenerateWithPrompt(scope='hashtags')`
4. **Replace video** → `replaceVideo()` without changing script
5. **Re-render** → Queue new render job with different model

---

## 3. Modules to Import

Update `app.module.ts` to include:

```typescript
import { StrategiesModule } from './strategies/strategies.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { PromptingModule } from './prompting/prompting.module';
import { MediaModule } from './media/media.module';

@Module({
  imports: [
    // ... existing imports ...
    StrategiesModule,
    ApprovalsModule,
    PromptingModule,
    MediaModule,
  ],
})
export class AppModule {}
```

---

## 4. Database Migrations

Register new models in MongoDB:

```typescript
// In app.module.ts or relevant modules
MongooseModule.forFeature([
  { name: 'Strategy', schema: StrategySchema },
  { name: 'RenderJob', schema: RenderJobSchema },
])
```

---

## 5. Provider Implementation Examples

### Example: Stable Diffusion Provider

```typescript
@Injectable()
export class StableDiffusionProvider implements RendererProvider {
  name = 'stable-diffusion';
  
  async render(jobId: string, input: RenderJobInput) {
    // Call Replicate/Invoke API
    // Return { providerJobId: '...' }
  }
  
  async pollStatus(jobId: string, providerJobId: string) {
    // Poll Replicate/Invoke for status
    // Return { status: 'pending'|'completed'|'failed', progress, outputUrl }
  }
  
  async handleWebhook(payload: any) {
    // Handle async callback
    // Return { jobId, status, outputUrl }
  }
  
  canRender(type: 'image' | 'video') {
    return type === 'image'; // Only supports image
  }
}
```

Register in application bootstrap:
```typescript
mediaRendererService.registerProvider(new StableDiffusionProvider());
```

---

## 6. Testing Strategy

### Unit Tests
- Strategy versioning and invalidation logic
- Approval state transitions
- Prompting engine evaluation
- Asset categorization and search

### Integration Tests
- Full campaign creation flow
- Strategy update with dependent invalidation
- Render job lifecycle (queue → submit → poll → finalize)
- Asset reuse across campaigns

### End-to-End Tests
- Campaign creation → approval → publishing
- Content regeneration workflow
- Render job completion and attachment to creatives

---

## 7. Configuration Requirements

### R2 Storage
- `R2ConfigSeedService` already supports dynamic loading
- Ensure `publicBaseUrl` is configured for render outputs
- Support per-tenant R2 configuration

### AI Models (Poe API)
- Model selection per task: text, image, video
- Persist model metadata with outputs
- Support re-generation with different model

### Render Providers
- Register providers in bootstrap
- Configure API keys and endpoints
- Support async webhooks for long-running renders

---

## 8. Feature Roadmap

### Phase 1 (Current)
- ✅ Strategy versioning
- ✅ Approval workflow
- ✅ Prompting engine
- ✅ Media renderer foundation
- ✅ Asset categorization

### Phase 2 (Next)
- Implement provider adapters (Stable Diffusion, Runway, Pika)
- Queue worker (BullMQ) for job processing
- WebSocket progress notifications
- Admin dashboard for configuration

### Phase 3 (Future)
- A/B testing framework
- Variant generation and comparison
- Advanced scheduling with conflict detection
- Platform-specific publishing adapters

---

## 9. Non-Functional Considerations

### Scalability
- Queue-based processing for renders
- Indexed MongoDB queries for efficient searches
- Separate storage for assets and configs

### Security
- Encryption for sensitive credentials
- Role-based access to approvals
- Audit trail for all state changes

### Extensibility
- Provider-agnostic renderer interfaces
- Pluggable approval workflows
- Custom prompting engine rules

---

## 10. Next Steps

1. **Update app.module.ts** to import new modules
2. **Register MongoDB schemas** for Strategy and RenderJob
3. **Implement provider adapters** (Stable Diffusion, Runway, etc.)
4. **Set up BullMQ** for queue-based job processing
5. **Add WebSocket support** for progress notifications
6. **Create test fixtures** for integration testing
7. **Update API documentation** with new endpoints
8. **Deploy to staging** for testing

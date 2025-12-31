# Campaign Automation Platform - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                           │
│  ┌──────────────────┬──────────────────┬──────────────────────────┐ │
│  │   Campaign UI    │  Approval UI     │   Render Monitor UI      │ │
│  │  (Create/Edit)   │  (Review/Vote)   │   (Progress Tracking)    │ │
│  └──────────────────┴──────────────────┴──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
          ┌──────────────────────────────────────────────┐
          │              REST API Layer (NestJS)         │
          │  (Controllers handle HTTP requests)          │
          └──────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Service Layer (NestJS)                            │
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐   │
│  │  Strategies    │  │  Approvals     │  │   Prompting Engine  │   │
│  │  Service       │  │  Service       │  │   Service           │   │
│  │                │  │                │  │                     │   │
│  │ • Versioning   │  │ • Workflow     │  │ • Evaluation        │   │
│  │ • Invalidation │  │ • Gating       │  │ • Recommendations   │   │
│  │ • Completion   │  │ • Cascade      │  │ • Blockers          │   │
│  └────────────────┘  └────────────────┘  └─────────────────────┘   │
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐   │
│  │  Media         │  │  Storage       │  │   Creatives         │   │
│  │  Renderer      │  │  Service       │  │   Service           │   │
│  │  Service       │  │  (Enhanced)    │  │   (Enhanced)        │   │
│  │                │  │                │  │                     │   │
│  │ • Job Queue    │  │ • Search       │  │ • Selective Regen   │   │
│  │ • Providers    │  │ • Categorize   │  │ • Strategy Linking  │   │
│  │ • Webhooks     │  │ • Reuse        │  │ • Asset Management  │   │
│  │ • Progress     │  │ • Archive      │  │                     │   │
│  └────────────────┘  └────────────────┘  └─────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Data Access Layer                                  │
│                                                                       │
│  ┌──────────────────────┐      ┌──────────────────────────────┐     │
│  │   MongoDB            │      │   External Services          │     │
│  │                      │      │                              │     │
│  │ • Strategies         │      │ • Poe API (AI Models)        │     │
│  │ • RenderJobs         │      │ • Replicate (Image)          │     │
│  │ • Campaigns          │      │ • Runway ML (Video)          │     │
│  │ • Creatives          │      │ • Pika (Video)               │     │
│  │ • Assets             │      │ • Cloudflare R2 (Storage)    │     │
│  │ • Approvals          │      │                              │     │
│  └──────────────────────┘      └──────────────────────────────┘     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Campaign Creation

```
User Creates Campaign
        ↓
   ┌────────────────────────────────────┐
   │ Initialize Approvals               │
   │ (strategy, content, schedule, ads) │
   └────────────────────────────────────┘
        ↓
   ┌────────────────────────────────────┐
   │ Define Strategy v1                 │
   │ (Create via StrategyService)       │
   └────────────────────────────────────┘
        ↓
   ┌────────────────────────────────────┐
   │ Evaluate Campaign                  │
   │ (PromptingEngineService)           │
   └────────────────────────────────────┘
        ↓
   ┌────────────────────────────────────┐
   │ Create Content (Text)              │
   │ (CreativesService)                 │
   │ → Upload to R2                     │
   └────────────────────────────────────┘
        ↓
   ┌────────────────────────────────────┐
   │ Request Strategy Approval          │
   │ (ApprovalService.approve)          │
   └────────────────────────────────────┘
        ↓
   ┌────────────────────────────────────┐
   │ Generate Image                     │
   │ (Queue RenderJob)                  │
   │ → Submit to Stable Diffusion       │
   │ → Poll/Webhook for completion      │
   │ → Upload result to R2              │
   │ → Update Creative                  │
   └────────────────────────────────────┘
        ↓
   ┌────────────────────────────────────┐
   │ Request Content Approval           │
   │ (ApprovalService.approve)          │
   └────────────────────────────────────┘
        ↓
   ┌────────────────────────────────────┐
   │ Schedule Posts                     │
   │ (CampaignsService)                 │
   └────────────────────────────────────┘
        ↓
   ┌────────────────────────────────────┐
   │ Request Schedule Approval          │
   │ (ApprovalService.approve)          │
   └────────────────────────────────────┘
        ↓
   ┌────────────────────────────────────┐
   │ Publish Campaign                   │
   │ (Check all approvals)              │
   └────────────────────────────────────┘
```

## Data Flow: Strategy Update

```
User Updates Strategy
        ↓
   ┌────────────────────────────────────┐
   │ Create Strategy v2                 │
   │ (StrategyService.updateStrategy)   │
   └────────────────────────────────────┘
        ↓
   ┌────────────────────────────────────┐
   │ Invalidate Strategy v1             │
   │ (StrategyService.invalidate)       │
   └────────────────────────────────────┘
        ↓
   ┌────────────────────────────────────┐
   │ Auto-Invalidate Dependents         │
   │ • Content approval → needs_review  │
   │ • Schedule approval → needs_review │
   │ • Ads approval → needs_review      │
   │ (ApprovalService.invalidate*)      │
   └────────────────────────────────────┘
        ↓
   ┌────────────────────────────────────┐
   │ Regenerate Content (if needed)     │
   │ (CreativesService)                 │
   └────────────────────────────────────┘
        ↓
   ┌────────────────────────────────────┐
   │ Re-request All Approvals           │
   └────────────────────────────────────┘
```

## Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  App Module                                                      │
│  ├── StrategiesModule                                            │
│  │   ├── StrategyService                                         │
│  │   ├── StrategiesController                                    │
│  │   └── Exports: StrategyService                                │
│  │                                                               │
│  ├── ApprovalsModule                                             │
│  │   ├── ApprovalService                                         │
│  │   ├── ApprovalsController                                     │
│  │   └── Exports: ApprovalService                                │
│  │                                                               │
│  ├── PromptingModule                                             │
│  │   ├── PromptingEngineService                                  │
│  │   ├── PromptingController                                     │
│  │   └── Exports: PromptingEngineService                         │
│  │                                                               │
│  ├── MediaModule                                                 │
│  │   ├── MediaRendererService                                    │
│  │   ├── MediaRendererController                                 │
│  │   ├── [Provider Implementations]                              │
│  │   └── Exports: MediaRendererService                           │
│  │                                                               │
│  ├── CampaignsModule (existing)                                  │
│  │   └── Uses: StrategyService, ApprovalService                  │
│  │                                                               │
│  ├── CreativesModule (existing, enhanced)                        │
│  │   └── Uses: StrategyService, MediaRendererService             │
│  │                                                               │
│  ├── StorageModule (existing, enhanced)                          │
│  │   └── Uses: (no internal dependencies)                        │
│  │                                                               │
│  └── ... other modules ...                                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Render Job Lifecycle

```
1. QUEUED
   └─ Job created, waiting to submit
        ↓
2. RUNNING
   ├─ Submitted to provider (Stable Diffusion, Runway, etc.)
   ├─ Poll for status OR wait for webhook
   ├─ Progress updates (steps, ETA)
   ├─ Logs accumulated
        ↓
3a. PUBLISHED (Success)
    ├─ Result downloaded from provider
    ├─ Uploaded to R2
    ├─ URL stored in RenderJob
    ├─ Creative updated with asset
    └─ Job complete ✅
        
3b. FAILED (Error)
    ├─ Error logged with details
    ├─ Retry count incremented
    ├─ If retries < maxRetries (3):
    │   └─ Re-submit to provider
    ├─ Else:
    │   └─ Mark as FAILED permanently
    └─ Notify user ❌

3c. CANCELLED (User Action)
    ├─ User cancels job
    ├─ If not yet started: Cancel immediately
    ├─ If running: Request cancellation from provider
    └─ Update status ⊘
```

## Provider Interface

```
Provider Adapter (Interface)
├─ name: string
├─ canRender(type: 'image' | 'video'): boolean
├─ render(jobId, input): Promise<{ providerJobId }>
│  └─ Submit render request to external API
├─ pollStatus(jobId, providerJobId): Promise<{ status, progress, output }>
│  └─ Check render status (async polling)
└─ handleWebhook(payload): Promise<{ jobId, status, output }>
   └─ Handle async callback from provider
```

### Provider Implementations

```
StableDiffusionProvider (image only)
├─ Replicate API endpoint
├─ Sync polling or async webhooks
└─ Output: Single image + variants

RunwayMLProvider (video only)
├─ Runway API endpoint
├─ Long-running with webhooks
└─ Output: MP4 video + poster frame

[Future: PikaProvider, InvokeAIProvider, etc.]
```

## Approval State Machine

```
Pending ◄──┐
  │        │
  │        └─── Rejected ──────────────────┐
  │             (with reason)               │
  │                                         │
  ↓                                         │
Approved ◄─────── Needs Review ◄───────────┘
         (User action after rejection)

Transitions:
• Pending → Approved: User approves
• Pending → Rejected: User rejects (with reason)
• Any → Needs Review: Auto-invalidation (cascade)
• Rejected → Needs Review: User addresses feedback
• Needs Review → Approved: User re-approves

Rules:
✅ Publish blocked if any scope != Approved
✅ Strategy change invalidates: Content, Schedule, Ads
✅ Each scope has independent timeline
```

## Search & Filter Architecture (Assets)

```
Asset Database Query
        ↓
   ┌────────────────────────────────────┐
   │ Filters Applied (in order)          │
   │                                     │
   │ 1. tenantId (required, indexed)    │
   │ 2. archived = false                │
   │ 3. type in ['image', 'video'] (opt)│
   │ 4. tags contains [...] (indexed)   │
   │ 5. filename regex (case-insensitive)│
   └────────────────────────────────────┘
        ↓
   Results sorted by uploadedAt DESC
        ↓
   Paginate (limit, offset)
```

---

This architecture supports:
- ✅ Multi-tenant isolation
- ✅ Scalable rendering with external providers
- ✅ Approval workflows with audit trails
- ✅ Content versioning and regeneration
- ✅ Asset lifecycle management
- ✅ Intelligent campaign guidance

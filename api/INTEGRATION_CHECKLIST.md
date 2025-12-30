# Quick Start: Integration Checklist

## Files Created/Modified

### New Services (6)
- ✅ `api/src/strategies/strategy.service.ts` - Strategy versioning
- ✅ `api/src/approvals/approval.service.ts` - Approval workflow
- ✅ `api/src/prompting/prompting-engine.service.ts` - Continuous prompting
- ✅ `api/src/media/media-renderer.service.ts` - Media rendering
- ✅ `api/src/storage/storage.service.ts` - Enhanced with asset management
- ✅ `api/src/creatives/creatives.service.ts` - Enhanced with selective regeneration

### New Controllers (4)
- ✅ `api/src/strategies/strategies.controller.ts`
- ✅ `api/src/approvals/approvals.controller.ts`
- ✅ `api/src/prompting/prompting.controller.ts`
- ✅ `api/src/media/media-renderer.controller.ts`

### New Modules (4)
- ✅ `api/src/strategies/strategies.module.ts`
- ✅ `api/src/approvals/approvals.module.ts`
- ✅ `api/src/prompting/prompting.module.ts`
- ✅ `api/src/media/media.module.ts`

### New Models (2)
- ✅ `api/src/models/strategy.model.ts`
- ✅ `api/src/models/renderJob.model.ts`

### Example Implementations
- ✅ `api/src/media/providers/example-providers.ts` - Stable Diffusion, Runway ML

### Documentation (3)
- ✅ `api/IMPLEMENTATION_GUIDE.md` - Comprehensive guide
- ✅ `api/IMPLEMENTATION_COMPLETE.md` - This summary
- ✅ `api/INTEGRATION_CHECKLIST.md` - You are here

---

## Step-by-Step Integration

### Step 1: Update App Module
```typescript
// api/src/app.module.ts

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
  // ... rest of module config
})
export class AppModule {}
```

### Step 2: Update Models Module (if using centralized models)
Already updated in `api/src/models/index.ts`:
```typescript
export * from './renderJob.model';
export * from './strategy.model';
```

### Step 3: Register MongoDB Schemas

Each module already registers its schemas, but ensure MongooseModule is configured:

```typescript
// StrategiesModule registers Strategy
// MediaModule registers RenderJob
// Campaign already registered elsewhere
// Creative already registered elsewhere
// Asset already registered elsewhere
```

### Step 4: Environment Configuration

Add to `.env`:
```bash
# Stable Diffusion (Replicate)
STABLE_DIFFUSION_API_KEY=your-replicate-token
STABLE_DIFFUSION_WEBHOOK_URL=https://yourapi.com/render-jobs/webhook/stable-diffusion

# Runway ML
RUNWAY_ML_API_KEY=your-runway-token
RUNWAY_ML_WEBHOOK_URL=https://yourapi.com/render-jobs/webhook/runway-ml

# R2 (already configured, ensure publicBaseUrl is set)
R2_PUBLIC_BASE_URL=https://your-r2-domain.com
```

### Step 5: Implement Provider Adapters

Copy `example-providers.ts` to production and implement:

```typescript
// api/src/media/providers/stable-diffusion.provider.ts
import { StableDiffusionProvider } from './example-providers';

@Injectable()
export class StableDiffusionProvider { /* ... */ }
```

### Step 6: Register Providers in Bootstrap

```typescript
// api/src/main.ts or app.module.ts (in onModuleInit)

import { StableDiffusionProvider } from './media/providers/stable-diffusion.provider';
import { RunwayMLProvider } from './media/providers/runway-ml.provider';

async function bootstrap() {
  // ... create app ...
  
  const mediaRendererService = app.get(MediaRendererService);
  mediaRendererService.registerProvider(new StableDiffusionProvider(configService));
  mediaRendererService.registerProvider(new RunwayMLProvider(configService));
}
```

### Step 7: Optional - Setup BullMQ Queue

```bash
npm install @nestjs/bull bull redis
```

Create queue module:
```typescript
// api/src/jobs/render-queue.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'render-jobs',
    }),
  ],
})
export class RenderQueueModule {}
```

Create worker:
```typescript
// api/src/jobs/render.worker.ts
@Processor('render-jobs')
export class RenderWorker {
  @Process()
  async processRender(job: Job) {
    // Submit render job to provider
    // Poll for status
    // Update creative with results
  }
}
```

### Step 8: Optional - Add WebSocket Support

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io
```

Create gateway for progress updates:
```typescript
// api/src/gateways/render-progress.gateway.ts
@WebSocketGateway()
export class RenderProgressGateway {
  @SubscribeMessage('subscribe-render')
  handleSubscribe(client: Socket, data: { jobId: string }) {
    // Subscribe to render job updates
  }
}
```

### Step 9: Testing

Create integration tests:
```typescript
// api/src/strategies/strategies.service.spec.ts
describe('StrategyService', () => {
  it('should create strategy version', async () => {
    // Test strategy versioning
  });
  
  it('should invalidate dependent approvals', async () => {
    // Test invalidation cascade
  });
});
```

### Step 10: Run Application

```bash
cd api
npm run build
npm run start
```

Verify new endpoints are available:
```bash
# Check strategy endpoints
curl http://localhost:3000/api/campaigns/test-id/strategies

# Check approval endpoints
curl http://localhost:3000/api/campaigns/test-id/approvals

# Check prompting endpoints
curl http://localhost:3000/api/campaigns/test-id/prompting/evaluate

# Check render job endpoints
curl http://localhost:3000/api/render-jobs
```

---

## Testing Checklist

### Unit Tests
- [ ] `StrategyService.createStrategy()`
- [ ] `StrategyService.invalidateStrategy()`
- [ ] `ApprovalService.approve()`
- [ ] `ApprovalService.invalidateDependentApprovals()`
- [ ] `PromptingEngineService.evaluateCampaign()`
- [ ] `MediaRendererService.createRenderJob()`
- [ ] `MediaRendererService.submitJob()`
- [ ] `StorageService.searchAssets()`
- [ ] `StorageService.cloneAsset()`
- [ ] `CreativesService.replaceImage()`

### Integration Tests
- [ ] Create campaign → Define strategy → Create content
- [ ] Update strategy → Auto-invalidate dependents
- [ ] Render image → Job lifecycle → Creative update
- [ ] Render video → Job lifecycle → Creative update
- [ ] Asset search and categorization
- [ ] Approval workflow → Publishing

### End-to-End Tests
- [ ] Full campaign flow: Create → Strategy → Content → Approval → Publish
- [ ] Selective regeneration: Replace image → Approve → Publish
- [ ] Cross-campaign asset reuse

---

## Validation

### Check Database
```typescript
// Verify new collections exist
db.strategies.findOne()  // Should work
db.renderjobs.findOne() // Should work
```

### Check API
```bash
# List strategies
GET /campaigns/{campaignId}/strategies

# List approvals
GET /campaigns/{campaignId}/approvals

# Create render job
POST /render-jobs/create
```

### Check Models
```bash
# Verify imports work
npm run build  # Should complete without errors
```

---

## Rollback Plan

If issues occur:

1. **Revert modules**: Comment out module imports in `app.module.ts`
2. **Revert services**: Delete new service files
3. **Revert controllers**: Delete new controller files
4. **Revert models**: Remove exports from `models/index.ts`
5. **Revert schema changes**: Restore `campaign.schema.ts` backup

---

## Monitoring

After deployment, monitor:

1. **API Response Times**
   - Strategy endpoints
   - Approval endpoints
   - Render job creation/polling

2. **Error Rates**
   - Failed renders (track in `RenderJob.error`)
   - Failed approvals
   - Strategy invalidation issues

3. **Database Performance**
   - Query counts and latencies
   - Index usage
   - Collection sizes

4. **Render Job Metrics**
   - Queue depth
   - Success rate
   - Average render time
   - Provider-specific metrics

---

## Support Resources

- 📖 **Full Guide**: `IMPLEMENTATION_GUIDE.md`
- 🎯 **Summary**: `IMPLEMENTATION_COMPLETE.md`
- 💻 **Example Code**: `api/src/media/providers/example-providers.ts`

---

## Timeline

- **Phase 1 (Current)**: ✅ Models + Services + Controllers
- **Phase 2**: 📅 Provider integration + BullMQ setup
- **Phase 3**: 📅 WebSocket support + admin UI
- **Phase 4**: 📅 Advanced features (A/B testing, variants)

---

**Ready to integrate!** Follow steps above in order.

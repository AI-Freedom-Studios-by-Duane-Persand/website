# Deployment Guide - Sora 2 Pro Video Generation

## Pre-Deployment Verification Checklist

### Backend Verification
- [ ] All 4 video files created:
  - [ ] `api/src/video/video-generation.service.ts`
  - [ ] `api/src/video/video-generation.controller.ts`
  - [ ] `api/src/video/video-generation.dto.ts`
  - [ ] `api/src/video/video-generation.module.ts`
- [ ] ReplicateClient updated with Sora 2 Pro support
- [ ] AppModule includes VideoGenerationModule
- [ ] No TypeScript errors: `npm run type-check`
- [ ] No lint errors: `npm run lint`

### Frontend Verification
- [ ] VideoGenerationWithReferences component created
- [ ] CampaignChatBot imports and integrates component
- [ ] No TypeScript errors in frontend
- [ ] No lint errors in frontend

### Environment Configuration
- [ ] REPLICATE_API_KEY set
- [ ] POE_API_KEY set (for prompt refinement)
- [ ] R2_BUCKET_NAME set
- [ ] R2 credentials configured
- [ ] Database connection tested

---

## Step-by-Step Deployment

### 1. Prepare Environment

```bash
# Backend environment (.env)
export REPLICATE_API_KEY=<your_replicate_key>
export POE_API_KEY=<your_poe_key>
export R2_BUCKET_NAME=<your_bucket_name>
export R2_ACCOUNT_ID=<your_account_id>
export R2_ACCESS_KEY_ID=<your_access_key>
export R2_SECRET_ACCESS_KEY=<your_secret_key>

# Frontend environment (.env.local)
export NEXT_PUBLIC_API_URL=https://api.yourdomain.com
export NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

### 2. Build Backend

```bash
cd api

# Clean previous builds
rm -rf dist

# Install dependencies
npm install

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build
npm run build

# Verify build succeeded
ls -la dist/
```

### 3. Build Frontend

```bash
cd ../frontend

# Clean previous builds
rm -rf .next out

# Install dependencies
npm install

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build
npm run build

# Verify build succeeded
ls -la .next/
```

### 4. Run Tests (Recommended)

```bash
# Backend tests
cd ../api
npm run test

# Frontend tests
cd ../frontend
npm run test
```

### 5. Start Services

#### Local Testing (Before Production)

```bash
# Terminal 1: Start backend
cd api
npm run start:dev
# Should see: "VideoGenerationModule loaded"

# Terminal 2: Start frontend
cd ../frontend
npm run dev
# Should see: "▲ Next.js app started"

# Terminal 3: Test endpoints
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:3001/api/video/models
```

#### Production Deployment

```bash
# Backend
cd api
npm run start:prod

# Frontend (separate)
cd ../frontend
npm run start

# Or use process manager (PM2):
pm2 start npm --name "api" -- run "start:prod" --cwd api
pm2 start npm --name "frontend" -- run "start" --cwd frontend
```

---

## Smoke Tests (Post-Deployment)

### Test 1: Models Endpoint
```bash
curl -X GET https://api.yourdomain.com/api/video/models \
  -H "Authorization: Bearer $JWT_TOKEN"

# Expected: 200 OK with array of 4 models
# Response should include: sora-2-pro, veo-3.1, runway-gen3, runway-gen2
```

### Test 2: Generate Test Video
```bash
curl -X POST https://api.yourdomain.com/api/video/generate \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Professional product demo with clean aesthetic",
    "model": "sora-2-pro",
    "duration": 5
  }'

# Expected: 202 Accepted
# Response should include videoUrl, model, duration, metadata
```

### Test 3: With Reference Image
```bash
curl -X POST https://api.yourdomain.com/api/video/generate \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Animated brand logo with motion graphics",
    "model": "sora-2-pro",
    "duration": 6,
    "referenceImageUrls": ["https://example.com/logo.png"]
  }'

# Expected: 202 Accepted
# Response should include referenceImages array with uploaded URLs
```

### Test 4: Frontend UI
1. Navigate to campaign creation
2. Go to Asset Generation step
3. Click "🎬 Generate Videos"
4. Enter prompt and click generate
5. Verify video appears in preview
6. Verify video can be added to creatives

### Test 5: Error Handling
```bash
# Test invalid model
curl -X POST https://api.yourdomain.com/api/video/generate \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test",
    "model": "invalid-model",
    "duration": 5
  }'

# Expected: 400 Bad Request with error message
```

---

## Monitoring & Logging

### Enable Verbose Logging

```bash
# Backend logs
export DEBUG=*:VideoGeneration*
tail -f logs/api.log | grep VideoGeneration

# Monitor generation times
grep "Video generation completed" logs/api.log | \
  awk '{print $NF}' | \
  awk '{sum+=$1; count++} END {print "Average: " sum/count "ms"}'
```

### Key Metrics to Monitor

1. **Video Generation Times**
   ```bash
   grep "generateVideoWithSora2" logs/api.log | \
     grep "completed in" | \
     tail -20
   ```

2. **Reference Image Uploads**
   ```bash
   grep "uploadReferenceImages" logs/api.log | \
     tail -20
   ```

3. **Error Rates**
   ```bash
   grep "ERROR\|error" logs/api.log | \
     grep -i video | \
     tail -10
   ```

4. **API Response Times**
   ```bash
   grep "POST /api/video/generate" logs/api.log | \
     grep "ms" | \
     awk '{print $NF}' | \
     sort -n | \
     tail -20
   ```

---

## Troubleshooting Deployment Issues

### Issue 1: "Cannot find module 'VideoGenerationModule'"

**Cause**: Module not imported in app.module.ts

**Fix**:
```bash
# Verify import exists
grep "VideoGenerationModule" api/src/app.module.ts

# Should show:
# import { VideoGenerationModule } from './video/video-generation.module';
```

**Solution**:
- Check `api/src/app.module.ts` has the import
- Check VideoGenerationModule is in imports array
- Rebuild: `npm run build`

### Issue 2: "REPLICATE_API_KEY is not defined"

**Cause**: Environment variable not set

**Fix**:
```bash
# Check environment variable
echo $REPLICATE_API_KEY

# Set if missing
export REPLICATE_API_KEY=your_key

# Verify
echo $REPLICATE_API_KEY
```

**Solution**:
- Add to `.env` file
- Restart services
- Verify in logs: `grep "API key" logs/api.log`

### Issue 3: "R2 upload failed"

**Cause**: R2 bucket not configured or credentials invalid

**Fix**:
```bash
# Test R2 connectivity
aws s3 ls s3://your-bucket-name \
  --endpoint-url https://your-account-id.r2.cloudflarecustomdomain.com

# Test with aws-cli or curl
curl -X HEAD \
  -H "Authorization: AWS4-HMAC-SHA256 ..." \
  https://your-account-id.r2.cloudflarecustomdomain.com/your-bucket-name/
```

**Solution**:
- Verify bucket exists
- Check credentials are correct
- Ensure bucket allows public reads (for URL retrieval)
- Check bucket lifecycle policies

### Issue 4: "Video generation times out"

**Cause**: Sora 2 Pro takes 2-5 minutes, frontend timeout too short

**Fix**:
- Increase frontend timeout: `timeout: 600000` (10 minutes)
- Check backend logs for generation progress
- Verify Replicate API is responding

**Solution**:
```typescript
// In VideoGenerationWithReferences.tsx
const response = await fetch('/api/video/generate', {
  method: 'POST',
  // Add longer timeout
  signal: AbortSignal.timeout(600000), // 10 minutes
  ...
});
```

### Issue 5: "Module failed to compile"

**Cause**: TypeScript errors

**Fix**:
```bash
# Check for errors
npm run type-check

# Fix common issues
# - Import paths incorrect
# - Missing type definitions
# - Decorator issues

# Rebuild
npm run build
```

---

## Rollback Plan

If deployment fails:

### Immediate Rollback
```bash
# Stop services
pm2 stop api frontend

# Restore previous version
git checkout HEAD~1 api/ frontend/

# Rebuild
npm run build (in both directories)

# Restart
pm2 start api frontend

# Verify
curl http://localhost:3001/health
```

### Verify Rollback
```bash
# Check previous version
curl -H "Authorization: Bearer $JWT" \
  http://localhost:3001/api/video/models

# Should fail (endpoint didn't exist in previous version)
# This confirms rollback worked
```

---

## Post-Deployment Validation

### Health Checks

```bash
#!/bin/bash
# health-check.sh

echo "Checking API health..."
curl -s http://localhost:3001/health || echo "❌ API unhealthy"

echo "Checking video models..."
curl -s http://localhost:3001/api/video/models | grep -q "sora-2-pro" && \
  echo "✅ Models loaded" || echo "❌ Models not loaded"

echo "Checking frontend..."
curl -s http://localhost:3000 | grep -q "AI Freedom" && \
  echo "✅ Frontend running" || echo "❌ Frontend not running"

echo "Checking logs for errors..."
grep -c "ERROR" logs/api.log && \
  echo "⚠️  Found errors in logs" || echo "✅ No errors in logs"
```

### User Acceptance Testing

```
[ ] Navigate to campaign creation
[ ] Go to Asset Generation step
[ ] Click "Generate Videos" button
[ ] Enter video prompt
[ ] Upload reference image (optional)
[ ] Select model (Sora 2 Pro)
[ ] Set duration
[ ] Click Generate
[ ] Wait for video generation
[ ] Verify video preview
[ ] Download video
[ ] Add to creatives
[ ] Verify in creatives list
[ ] Proceed to publishing
[ ] Publish campaign
```

---

## Monitoring Dashboard Setup

### Recommended Metrics

1. **API Endpoint Response Times**
   - Track: `/api/video/generate`, `/api/video/models`
   - Alert threshold: > 60 seconds

2. **Error Rates**
   - Track: 4xx, 5xx responses
   - Alert threshold: > 1% of requests

3. **Video Generation Success**
   - Track: Successful generations / Total requests
   - Alert threshold: < 95%

4. **Storage Usage**
   - Track: R2 bucket size
   - Alert threshold: > 80% of quota

5. **Cost Tracking**
   - Track: Replicate API costs
   - Breakdown by model (Sora 2, Veo 3.1, etc.)

### Log Aggregation

```bash
# Use ELK Stack, DataDog, or similar
# Key log search queries:

# Find all video generations
logs | "generateVideoWithSora2" 

# Find all errors
logs | "ERROR" | "VideoGeneration"

# Find slow requests
logs | "POST /api/video/generate" | duration > 300000

# Find failed uploads
logs | "uploadReferenceImages" | "ERROR"
```

---

## Performance Optimization

### Caching Strategy

```typescript
// Cache model list (changes rarely)
const modelsCacheKey = 'video-models-v1';
const modelsCacheTTL = 3600; // 1 hour

// Cache generated video metadata
const videoCacheKey = `video-${videoId}`;
const videoCacheTTL = 86400; // 24 hours
```

### Load Testing

```bash
# Test with Artillery
artillery run -t http://localhost:3001 config.yml

# Recommended: 100 RPS for 5 minutes
# Metrics to monitor:
# - Response times (p95, p99)
# - Error rates
# - Throughput
```

---

## Maintenance Plan

### Daily
- [ ] Check error logs
- [ ] Monitor API response times
- [ ] Verify R2 storage accessible

### Weekly
- [ ] Review video generation metrics
- [ ] Check cost tracking
- [ ] Update documentation if needed

### Monthly
- [ ] Performance review
- [ ] Capacity planning
- [ ] User feedback analysis
- [ ] Plan Phase 2 features

---

## Support Escalation

**Tier 1**: Check documentation at `docs/features/SORA_2_VIDEO_GENERATION_INTEGRATION.md`

**Tier 2**: Check logs at `logs/api.log`

**Tier 3**: Contact Replicate support (for API issues)

**Tier 4**: Contact development team

---

## Deployment Checklist - Ready to Deploy

- [x] All code written and tested
- [x] All documentation complete
- [x] Environment variables configured
- [x] Backend builds without errors
- [x] Frontend builds without errors
- [x] Smoke tests prepared
- [x] Rollback plan documented
- [x] Monitoring configured
- [x] Support plan established

✅ **Ready for Production Deployment!**

---

**Deployment Date**: [Enter date]  
**Deployed By**: [Enter name]  
**Deployment Status**: [Pending / In Progress / Complete]  
**Notes**: [Add any deployment notes here]

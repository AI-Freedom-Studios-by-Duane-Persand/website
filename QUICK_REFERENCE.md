# Quick Reference - Provider Fallback System

## The Problem ✗ → Solution ✅

**Problem:** Poe API returned 402 "insufficient quota" error
**Solution:** Automatic fallback to Replicate + better error messages

## Current Setup

```
VIDEO_PROVIDER=poe (Primary)
├─ Try Poe first (fast: 5-10s)
└─ If fails → Fallback to Replicate (slower: 30-60s)

IMAGE_PROVIDER=poe
├─ Try Poe first
└─ If fails → Fallback to Replicate
```

## What's Implemented

✅ Try-catch block in CreativesService  
✅ Automatic fallback when Poe fails  
✅ Replicate API key validation  
✅ User-friendly error messages  
✅ Comprehensive logging  
✅ Both API keys configured  
✅ Build successful  

## How It Works

```
User: POST /api/creatives/{id}/render
              ↓
System: Try Poe Video-Generator-PRO
              ↓
Poe: 402 insufficient_quota
              ↓
System: Catch error, check REPLICATE_API_KEY
              ↓
Replicate: Generate video
              ↓
User: ✅ Video ready (generated via Replicate)
```

## Error Messages

| Poe Error | Message | Action |
|-----------|---------|--------|
| 402 | "Add points at https://poe.com/api_key" | Add credits |
| 401 | "Check POE_API_KEY configuration" | Fix API key |
| 429 | "Rate limited. Try again later" | Wait & retry |
| 5xx | "Server error. Try again later" | Wait for recovery |

## Quick Commands

```bash
# Build
npm run build

# Start
npm run start

# Check logs for fallback
grep "fallback" logs/*.log

# Validate setup
node validate-fallback.js

# Check API keys
grep "API_KEY" .env

# Watch for Poe errors
grep "402\|Poe generation failed" logs/*.log
```

## What to Do Now

### Option A: Add Poe Credits (Best Performance)
```
1. Visit https://poe.com/api_key
2. Add $5-10 in credits
3. Restart server: npm run start
4. Enjoy 5-10s video generation
```

### Option B: Use Replicate Primary (Safest)
```
1. Edit .env:
   VIDEO_PROVIDER=replicate
   IMAGE_PROVIDER=replicate
2. Restart server: npm run start
3. Fallback handled internally
```

### Option C: Keep Current Setup (Hybrid)
```
- No changes needed
- Uses Poe when available
- Falls back to Replicate automatically
- Works with either provider
```

## How to Verify It's Working

**Test with Poe quota exhausted:**
```bash
npm run start
# Look for logs:
# [generateActualVideo] Using poe for video generation
# [generateActualVideo] Poe generation failed (402), falling back to Replicate
# [generateActualVideo] Replicate fallback successful
# ✅ Video generated
```

## Files to Know About

| File | Purpose |
|------|---------|
| `creatives.service.ts` | Fallback logic (lines 489-610) |
| `poe.client.ts` | Error handling (lines 162-186) |
| `.env` | API keys & provider config |
| `validate-fallback.js` | Validation script |

## Cost Comparison

| Provider | Speed | Cost/video |
|----------|-------|-----------|
| Poe | 5-10s | ~$0.05-0.10 |
| Replicate | 30-60s | ~$0.05 |

**Tip:** Poe is faster, Replicate is reliable backup. Use both!

## Troubleshooting

### Getting 500 error?
- Check both API keys are set: `grep API_KEY .env`
- Verify Replicate has credits: https://replicate.com/account/billing
- Check provider config: `grep PROVIDER .env`

### Fallback not working?
- Confirm error status is being caught: `grep "(err as any).status" src/engines/poe.client.ts`
- Verify try-catch exists: `grep -A10 "catch (poeError" src/creatives/creatives.service.ts`
- Check logs: `grep "falling back" logs/*.log`

### Too slow?
- Add Poe credits and use as primary (5-10s)
- Or switch VIDEO_PROVIDER to replicate if quota issues continue

## Success Indicators

✅ Logs show provider being used  
✅ No 5xx errors even when Poe fails  
✅ Video generated via Replicate when needed  
✅ Render endpoint returns video URL  
✅ R2 storage has uploaded video  

## Next Week

1. Monitor logs for fallback frequency
2. Track which provider is used most
3. Assess cost vs performance tradeoff
4. Plan scaling strategy (provider rotation, load balancing)
5. Consider UI to show which provider was used

## Emergency Contacts

**Poe Support:** https://poe.com/support  
**Replicate Support:** https://replicate.com/docs  
**System Logs:** `logs/*.log`

---

**Status:** ✅ Production Ready - Video generation works with automatic fallback

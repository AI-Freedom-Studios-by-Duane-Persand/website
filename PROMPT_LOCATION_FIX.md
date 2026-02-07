# Fix: "No prompt found for video generation" Error

## Issue Summary
The frontend was looking for video prompts in the wrong location, causing the error:
```
Error: No prompt found for video generation
```

## Root Cause
- **Frontend was looking for**: `creative.metadata?.prompt` (videos)
- **Actual location**: `creative.script?.body` (videos)
- **For images**: `creative.visual?.prompt` ✓ (correct)

The Creative data model stores:
- **Images**: prompt in `visual.prompt`
- **Videos**: script in `script.body` (can be string or string[])
- **Text**: caption in `copy.caption`
- **Metadata**: only contains `tags`, `derivedFrom`, `funnelStage` (no prompt field)

## Changes Made

### File: `frontend/app/app/creatives/page.tsx`

#### 1. Updated Type Definition (Line 15-24)
**Before:**
```typescript
metadata?: { prompt?: string };
```

**After:**
```typescript
metadata?: { tags?: string[]; derivedFrom?: string; funnelStage?: string };
```

**Reason**: Metadata doesn't contain prompt field; corrected to match actual data structure.

#### 2. Fixed `handleRenderMedia` Function (Line 313-321)
**Before:**
```typescript
let prompt = '';
if (type === 'image' && creative.visual?.prompt) {
  prompt = creative.visual.prompt;
} else if (type === 'video' && creative.metadata?.prompt) {
  prompt = creative.metadata.prompt;
}
```

**After:**
```typescript
let prompt = '';
if (type === 'image' && creative.visual?.prompt) {
  prompt = creative.visual.prompt;
} else if (type === 'video' && creative.script?.body) {
  // Video prompts are stored in script.body (can be string or string[])
  prompt = Array.isArray(creative.script.body) ? creative.script.body.join(' ') : creative.script.body;
}
```

**Reason**: 
- Look for video prompt in correct location (`script.body`)
- Handle both string and string[] types properly
- Join array elements if necessary

#### 3. Fixed `recreateAsset` Function (Line 460-469)
**Before:**
```typescript
const storedPrompt = creative.visual?.prompt || creative.metadata?.prompt || null;
```

**After:**
```typescript
const storedPrompt = creative.visual?.prompt || creative.script?.body || null;
```

**Reason**: Updated fallback prompt lookup to check script.body for video prompts.

## How Video Prompts are Created

When a video creative is created or edited:

```typescript
// api/src/creatives/creatives.service.ts - editPrompt() method
async editPrompt(creativeId: string, prompt: string): Promise<Creative> {
  const creative = await this.creativeModel.findById(creativeId).exec();
  if (creative.type === 'video') {
    creative.script = { ...(creative.script || {}), body: prompt };
  }
  // ...
}
```

Video prompts are stored as:
```json
{
  "script": {
    "hook": "...",
    "body": "...",  // <-- Video prompt stored here
    "outro": "...",
    "scenes": [...]
  }
}
```

## Testing

### Test Case 1: Generate Video from Existing Creative
1. Create a video creative with a script/prompt
2. Click "Generate Video" on the creative
3. **Expected**: No error, video generation starts successfully
4. **Verify**: Prompt is extracted from `creative.script.body`

### Test Case 2: Regenerate Video Creative
1. Create and generate a video creative
2. Click "Recreate with Changes"
3. Modify the prompt and submit
4. **Expected**: No error, regeneration starts with updated prompt
5. **Verify**: Prompt fallback uses `script.body` correctly

### Test Case 3: Handle Array Script Body
1. Create a video creative with script body as array: `["Scene 1", "Scene 2"]`
2. Click "Generate Video"
3. **Expected**: No error, array is joined: "Scene 1 Scene 2"
4. **Verify**: String concatenation works correctly

## Related Files
- `shared/types.ts` - Creative interface definition
- `api/src/creatives/creatives.service.ts` - Backend creative storage logic
- `api/src/creatives/creatives.controller.ts` - API endpoints
- `api/models/creative.model.ts` - MongoDB schema

## Deployment Notes
- No database migration required (data structure unchanged)
- Frontend-only fix (UI layer logic correction)
- Backward compatible with existing creatives
- Deploy frontend changes to production to resolve error

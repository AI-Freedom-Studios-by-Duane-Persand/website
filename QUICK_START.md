# Campaign Flow Quick Start Guide

## Overview
This guide helps you use the enhanced campaign management system with AI-powered content generation, continuous prompting, and advanced asset management.

---

## 1. Create a Campaign

```bash
POST /api/campaigns
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Q1 2025 Product Launch",
  "createdBy": "<user_id>"
}
```

**Response**: Campaign object with initial strategy and content versions

---

## 2. Define Strategy with Prompting Guidance

### Get Campaign Prompts
```bash
GET /api/campaigns/:campaignId/prompts
```

**Response**:
```json
[
  {
    "field": "platforms",
    "section": "strategy",
    "message": "Missing required field: Platforms",
    "severity": "error",
    "suggestion": "Based on your campaign, consider: LinkedIn, Twitter, Instagram",
    "aiGenerated": true,
    "canSkip": false,
    "order": 1
  },
  {
    "field": "targetAudience",
    "section": "strategy",
    "message": "Missing required field: Target Audience",
    "severity": "error",
    "canSkip": false,
    "order": 3
  }
]
```

### Resolve Prompts

#### Accept AI Suggestion:
```bash
POST /api/campaigns/:campaignId/prompts/resolve
Content-Type: application/json

{
  "field": "platforms",
  "action": "accept",
  "value": ["LinkedIn", "Twitter", "Instagram"]
}
```

#### Provide Custom Value:
```bash
POST /api/campaigns/:campaignId/prompts/resolve
Content-Type: application/json

{
  "field": "targetAudience",
  "action": "provide",
  "value": "B2B SaaS founders, 30-45 years old, tech-savvy"
}
```

#### Skip (if allowed):
```bash
POST /api/campaigns/:campaignId/prompts/resolve
Content-Type: application/json

{
  "field": "constraints",
  "action": "skip"
}
```

### Add Complete Strategy Version
```bash
POST /api/campaigns/:campaignId/strategy-version
Content-Type: application/json

{
  "platforms": ["LinkedIn", "Twitter", "Instagram"],
  "goals": ["Increase brand awareness", "Generate qualified leads"],
  "targetAudience": "B2B SaaS founders, 30-45 years old, tech-savvy",
  "contentPillars": ["Product benefits", "Customer success", "Industry insights"],
  "brandTone": "Professional yet approachable",
  "cadence": "3x/week",
  "note": "Initial strategy based on Q1 goals"
}
```

---

## 3. Generate AI Content

### Full Content Generation
```bash
POST /api/campaigns/:campaignId/content/regenerate
Content-Type: application/json

{
  "regenerationType": "all",
  "aiModel": "GPT-4o",
  "preserveExisting": false
}
```

**What happens**:
1. AI generates 5 social media captions based on strategy
2. AI generates 3 image generation prompts
3. AI generates 2 video scripts
4. All content uploaded to R2 storage
5. New content version created
6. Assets linked to campaign

### Selective Regeneration

#### Regenerate Text Only:
```bash
POST /api/campaigns/:campaignId/content/regenerate-selective
Content-Type: application/json

{
  "textOnly": true,
  "aiModel": "Claude-Sonnet-4"
}
```

#### Regenerate Images Only:
```bash
POST /api/campaigns/:campaignId/content/regenerate-selective
Content-Type: application/json

{
  "imagesOnly": true,
  "aiModel": "GPT-4o"
}
```

### Get Latest Content
```bash
GET /api/campaigns/:campaignId/content/latest
```

**Response**:
```json
{
  "version": 2,
  "mode": "ai",
  "textAssets": [
    "https://r2.../campaign-text-1.txt",
    "https://r2.../campaign-text-2.txt"
  ],
  "imageAssets": [
    "https://r2.../image-prompt-1.txt"
  ],
  "videoAssets": [
    "https://r2.../video-script-1.json"
  ],
  "aiModel": "GPT-4o",
  "strategyVersion": 1,
  "needsReview": true
}
```

---

## 4. Asset Management

### Upload Manual Asset
```bash
POST /api/campaigns/:campaignId/assets
Content-Type: multipart/form-data

{
  "file": <binary>,
  "type": "image",
  "tags": ["hero-image", "product-launch"]
}
```

### Tag Existing Asset
```bash
POST /api/campaigns/:campaignId/assets/tag
Content-Type: application/json

{
  "assetUrl": "https://r2.../hero-image.jpg",
  "tags": ["featured", "homepage"]
}
```

### Replace Specific Assets
```bash
POST /api/campaigns/:campaignId/content/replace-assets
Content-Type: application/json

{
  "replacements": [
    {
      "old": "https://r2.../old-image.jpg",
      "new": "https://r2.../new-image.jpg",
      "type": "image"
    },
    {
      "old": "https://r2.../old-caption.txt",
      "new": "https://r2.../new-caption.txt",
      "type": "text"
    }
  ]
}
```

### Get Campaign Assets
```bash
GET /api/campaigns/:campaignId/assets
```

---

## 5. Schedule Posts

### Auto-Generate Schedule
```bash
POST /api/campaigns/:campaignId/schedule/generate
Content-Type: application/json

{
  "note": "Generated schedule based on 3x/week cadence"
}
```

**What happens**:
1. Parses cadence from strategy (e.g., "3x/week" = 3 posts per week)
2. Generates 4 weeks of slots
3. Distributes posts across platforms
4. Uses best posting times (9am, 12pm, 3pm, 6pm)
5. Detects conflicts automatically

### Manual Schedule Slots
```bash
POST /api/campaigns/:campaignId/schedule
Content-Type: application/json

{
  "slots": [
    {
      "slot": "2025-01-15T09:00:00Z",
      "platform": "LinkedIn",
      "locked": false
    },
    {
      "slot": "2025-01-17T14:00:00Z",
      "platform": "Twitter",
      "locked": true
    }
  ]
}
```

### Lock/Unlock Slot
```bash
POST /api/campaigns/:campaignId/schedule/slot/lock
Content-Type: application/json

{
  "slot": "2025-01-15T09:00:00Z",
  "locked": true
}
```

### Get Schedule
```bash
GET /api/campaigns/:campaignId/schedule
```

**Response**:
```json
[
  {
    "slot": "2025-01-15T09:00:00.000Z",
    "locked": false,
    "contentVersion": 1,
    "platform": "LinkedIn",
    "conflict": false
  },
  {
    "slot": "2025-01-15T14:00:00.000Z",
    "locked": false,
    "contentVersion": 1,
    "platform": "LinkedIn",
    "conflict": true,
    "conflictReason": "Multiple posts scheduled for same day/platform"
  }
]
```

---

## 6. Approval Workflow

### Check Approval Status
```bash
GET /api/campaigns/:campaignId/approval-status
```

**Response**:
```json
{
  "strategy": "approved",
  "content": "needs_review",
  "schedule": "pending",
  "ads": "pending"
}
```

### Approve Section
```bash
POST /api/campaigns/:campaignId/approve
Content-Type: application/json

{
  "section": "content",
  "campaignId": "<campaignId>",
  "note": "Content looks great, approved for publishing"
}
```

### Reject Section
```bash
POST /api/campaigns/:campaignId/reject
Content-Type: application/json

{
  "section": "schedule",
  "campaignId": "<campaignId>",
  "reason": "Too many posts on same day, please adjust",
  "note": "Reduce frequency on Jan 15"
}
```

### Check if Ready to Publish
```bash
GET /api/campaigns/:campaignId/ready-to-publish
```

**Response**:
```json
{
  "ready": false
}
```

### Get Sections Needing Review
```bash
GET /api/campaigns/:campaignId/needs-review
```

**Response**:
```json
{
  "sections": ["content", "schedule"],
  "details": {
    "content": "Content was invalidated due to strategy changes",
    "schedule": "One or more sections have been rejected"
  }
}
```

---

## 7. Common Workflows

### Complete Campaign Creation
```javascript
// 1. Create campaign
const campaign = await createCampaign({ name: "Q1 Launch" });

// 2. Get prompts and resolve
const prompts = await getCampaignPrompts(campaign.id);
for (const prompt of prompts) {
  if (prompt.suggestion && prompt.aiGenerated) {
    await resolvePrompt(campaign.id, {
      field: prompt.field,
      action: 'accept',
      value: prompt.suggestion
    });
  }
}

// 3. Add strategy version
await addStrategyVersion(campaign.id, {
  platforms: ['LinkedIn', 'Twitter'],
  goals: ['Increase awareness'],
  targetAudience: 'B2B founders',
  contentPillars: ['Product', 'Success Stories'],
  brandTone: 'Professional',
  cadence: '3x/week'
});

// 4. Generate AI content
await regenerateContent(campaign.id, {
  regenerationType: 'all',
  aiModel: 'GPT-4o'
});

// 5. Generate schedule
await generateSchedule(campaign.id);

// 6. Approve all sections
await approveSection(campaign.id, { section: 'strategy' });
await approveSection(campaign.id, { section: 'content' });
await approveSection(campaign.id, { section: 'schedule' });

// 7. Publish
const isReady = await isReadyToPublish(campaign.id);
if (isReady.ready) {
  await publishCampaign(campaign.id);
}
```

### Regenerate After Strategy Change
```javascript
// 1. Update strategy
await addStrategyVersion(campaign.id, {
  // Updated strategy fields
  platforms: ['LinkedIn', 'Twitter', 'Instagram'], // Added Instagram
  // ... other fields
});

// 2. Check for invalidated content
const prompts = await getCampaignPrompts(campaign.id);
const contentInvalidated = prompts.find(p => 
  p.section === 'content' && p.field === 'invalidated'
);

if (contentInvalidated) {
  // 3. Regenerate content selectively
  await regenerateContent(campaign.id, {
    regenerationType: 'text',
    aiModel: 'GPT-4o',
    preserveExisting: true // Keep images/videos
  });
}

// 4. Re-approve
await approveSection(campaign.id, { section: 'content' });
```

### Replace Specific Assets
```javascript
// 1. Get current content
const content = await getLatestContentVersion(campaign.id);

// 2. Replace specific assets (e.g., one image needs update)
await replaceAssets(campaign.id, {
  replacements: [
    {
      old: content.imageAssets[0],
      new: 'https://r2.../new-hero-image.jpg',
      type: 'image'
    }
  ]
});

// Note: No need to regenerate everything!
```

---

## 8. Best Practices

### Strategy Definition
1. **Use continuous prompting** - Let AI guide you through missing fields
2. **Be specific** - More detailed strategy = better AI-generated content
3. **Match platform to audience** - LinkedIn for B2B, Instagram for visual brands
4. **Set realistic cadence** - Consider platform recommendations

### Content Generation
1. **Start with AI** - Generate baseline content, then refine
2. **Use selective regeneration** - Don't regenerate everything for small changes
3. **Preserve good content** - Use `preserveExisting: true` when needed
4. **Review AI output** - Flag content as `needsReview` until verified

### Asset Management
1. **Tag assets consistently** - Makes reuse across campaigns easier
2. **Use descriptive tags** - "product-launch", "hero-image", "testimonial"
3. **Archive unused assets** - Keep asset library clean
4. **Track usage** - System automatically tracks which campaigns use which assets

### Scheduling
1. **Auto-generate first** - System uses best practices
2. **Lock important slots** - Prevents accidental changes
3. **Fix conflicts immediately** - System flags conflicts automatically
4. **Match cadence to platform** - LinkedIn: 2-3x/week, TikTok: daily

### Approval Workflow
1. **Review sequentially** - Strategy → Content → Schedule → Ads
2. **Provide clear rejection reasons** - Helps team understand issues
3. **Check ready-to-publish** - Don't skip this step
4. **Re-approve after changes** - Strategy changes require content re-approval

---

## 9. Error Handling

### Common Errors

#### Missing Authentication
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
**Solution**: Include JWT token in Authorization header

#### Missing Strategy
```json
{
  "statusCode": 400,
  "message": "No strategy found for content generation"
}
```
**Solution**: Add strategy version before generating content

#### Locked Slot Update
```json
{
  "statusCode": 400,
  "message": "Cannot update locked slot"
}
```
**Solution**: Unlock slot first, then update

#### Publishing Blocked
```json
{
  "statusCode": 400,
  "message": "Cannot publish - not all sections approved"
}
```
**Solution**: Check `/needs-review` endpoint and approve pending sections

---

## 10. Frontend Integration Examples

### React Component: Campaign Creation Wizard
```typescript
import { useState, useEffect } from 'react';
import { useCampaignPrompts, useResolvePrompt } from '@/hooks/campaigns';

export function CampaignWizard({ campaignId }: { campaignId: string }) {
  const { prompts, loading } = useCampaignPrompts(campaignId);
  const resolvePrompt = useResolvePrompt();
  
  const handleAcceptSuggestion = async (prompt) => {
    await resolvePrompt({
      campaignId,
      field: prompt.field,
      action: 'accept',
      value: prompt.suggestion
    });
  };
  
  const handleProvideValue = async (prompt, value) => {
    await resolvePrompt({
      campaignId,
      field: prompt.field,
      action: 'provide',
      value
    });
  };
  
  return (
    <div>
      <h2>Complete Your Campaign</h2>
      {prompts.map(prompt => (
        <PromptCard
          key={prompt.field}
          prompt={prompt}
          onAccept={() => handleAcceptSuggestion(prompt)}
          onProvide={(value) => handleProvideValue(prompt, value)}
        />
      ))}
    </div>
  );
}
```

### React Component: Content Regeneration
```typescript
import { useState } from 'react';
import { useRegenerateContent } from '@/hooks/campaigns';

export function ContentRegeneration({ campaignId }: { campaignId: string }) {
  const [type, setType] = useState<'all' | 'text' | 'images' | 'videos'>('all');
  const [model, setModel] = useState('GPT-4o');
  const regenerate = useRegenerateContent();
  
  const handleRegenerate = async () => {
    await regenerate({
      campaignId,
      regenerationType: type,
      aiModel: model,
      preserveExisting: type !== 'all'
    });
  };
  
  return (
    <div>
      <select value={type} onChange={e => setType(e.target.value)}>
        <option value="all">Regenerate All</option>
        <option value="text">Text Only</option>
        <option value="images">Images Only</option>
        <option value="videos">Videos Only</option>
      </select>
      
      <select value={model} onChange={e => setModel(e.target.value)}>
        <option value="GPT-4o">GPT-4o</option>
        <option value="Claude-Sonnet-4">Claude Sonnet 4</option>
        <option value="Gemini-2.5-Pro">Gemini 2.5 Pro</option>
      </select>
      
      <button onClick={handleRegenerate}>
        Regenerate Content
      </button>
    </div>
  );
}
```

---

## 11. Testing the Implementation

### Using cURL
```bash
# Create campaign
curl -X POST https://aifreedomstudios.com/api/campaigns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Campaign","createdBy":"user123"}'

# Get prompts
curl -X GET https://aifreedomstudios.com/api/campaigns/$CAMPAIGN_ID/prompts \
  -H "Authorization: Bearer $TOKEN"

# Regenerate content
curl -X POST https://aifreedomstudios.com/api/campaigns/$CAMPAIGN_ID/content/regenerate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"regenerationType":"all","aiModel":"GPT-4o"}'
```

### Using Postman
1. Import the API endpoints
2. Set up environment variables (BASE_URL, TOKEN, CAMPAIGN_ID)
3. Test each endpoint sequentially
4. Verify responses match expected schemas

---

## 12. Troubleshooting

### Content Generation Fails
**Check**:
1. Strategy version exists
2. Poe API key is valid
3. R2 storage is configured
4. Tenant ID is correct

### Prompts Not Appearing
**Check**:
1. Campaign has incomplete fields
2. User is authenticated
3. Tenant isolation is working

### Schedule Conflicts
**Check**:
1. Multiple posts scheduled same day/platform
2. Locked slots are preserved
3. Cadence matches platform recommendations

### Assets Not Uploading
**Check**:
1. R2 credentials are correct
2. Bucket exists and is accessible
3. File size within limits
4. Content type is supported

---

## Support

For issues or questions:
- Check `IMPLEMENTATION_COMPLETE.md` for technical details
- Review `docs/CAMPAIGN_ARCHITECTURE.md` for architecture
- Consult `docs/IMPLEMENTATION_SUMMARY.md` for service details

---

**Last Updated**: December 24, 2025

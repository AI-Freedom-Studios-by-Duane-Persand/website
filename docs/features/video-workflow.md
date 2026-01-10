# Video Workflow System

## Overview

The Video Workflow System provides an AI-powered iterative video creation experience with multiple refinement cycles, frame generation, user review, and final video generation. Users maintain creative control while leveraging advanced AI models at each step.

## Architecture

### Backend Components

#### 1. VideoWorkflow Schema (`video-workflow.schema.ts`)
MongoDB schema tracking multi-step video creation state:

**Enums:**
- `WorkflowStep`: State machine steps (INITIAL_PROMPT → PROMPT_REFINEMENT → ADDITIONAL_INFO → FRAME_GENERATION → FRAME_REVIEW → VIDEO_GENERATION → COMPLETED)
- `WorkflowStatus`: Current workflow status (IN_PROGRESS, WAITING_USER_INPUT, PROCESSING, COMPLETED, FAILED)

**Key Fields:**
- `userId`: Owner reference
- `campaignId`: Optional campaign attachment
- `initialPrompt`: User's original video description
- `refinementIterations[]`: Array of refinement cycles with AI model selections
- `finalRefinedPrompt`: Last approved refined prompt
- `generatedFrames[]`: Sample frames with approval status and feedback
- `framesApproved`: Boolean indicating all frames approved
- `videoOutput`: Final video URL and metadata
- `modelSelections`: User-selected AI models for each step
- `errors[]`: Error tracking for debugging

**Interfaces:**
```typescript
interface RefinementIteration {
  iteration: number;
  userPrompt: string;          // Original or additional info
  refinedPrompt: string;        // AI-generated refinement
  refinementModel: string;      // Model used (gpt-4o, claude-3-opus, gemini-1.5-pro)
  additionalInfo?: string;      // User feedback for iteration
  timestamp: Date;
}

interface GeneratedFrame {
  frameNumber: number;
  prompt: string;               // Frame-specific prompt
  imageUrl: string;             // Generated image URL
  model: string;                // Model used (stable-diffusion-xl, dalle-3)
  approved: boolean;            // User approval status
  feedback?: string;            // User feedback for regeneration
  timestamp: Date;
}

interface VideoOutput {
  videoUrl: string;             // Final video URL
  model: string;                // Model used (veo-3, Video-Generator-PRO)
  duration: number;             // Seconds
  fps: number;                  // Frames per second
  finalPrompt: string;          // Prompt used for generation
  timestamp: Date;
}
```

#### 2. VideoWorkflowService (`video-workflow.service.ts`)
Business logic for workflow operations:

**Methods:**

**`createWorkflow(dto)`**
- Creates new workflow with initial prompt and metadata
- Sets step to INITIAL_PROMPT, status to IN_PROGRESS
- Returns workflow document

**`refinePrompt(workflowId, userId, dto)`**
- Builds refinement prompt incorporating previous iterations
- Calls PoeClient with creative-video system prompt
- Supports model selection: gpt-4o, claude-3-opus-20240229, gemini-1.5-pro
- Stores iteration in refinementIterations array
- Updates finalRefinedPrompt
- Advances step to PROMPT_REFINEMENT, sets status to WAITING_USER_INPUT
 - Refinement cycles capped by service limit; see `MAX_REFINEMENT_ITERATIONS`
 - When the limit is reached, the service returns a validation error and prevents further iterations; the UI should surface remaining iterations and notify when the cap is hit

**`generateFrames(workflowId, userId, dto)`**
- Validates finalRefinedPrompt exists
- Generates frame prompts at key narrative moments (opening/middle/closing scenes)
- Calls ReplicateClient for each frame (`frameCount` configurable; defaults to 3; 1024x576, 16:9 aspect ratio by default)
- Supports model selection: stable-diffusion-xl, dalle-3
- Stores GeneratedFrame objects with approved=false
- Advances step to FRAME_GENERATION, sets status to PROCESSING

**`reviewFrames(workflowId, userId, dto)`**
- Updates frame approval status and feedback from user
- Checks if all frames approved
- Sets framesApproved=true when complete
- Advances step to FRAME_REVIEW
- Returns updated workflow

**`regenerateFrames(workflowId, userId, frameNumbers[])`**
- Takes specific frame numbers to regenerate
- Incorporates user feedback into prompts
- Regenerates via ReplicateClient with same model
- Resets approved=false for regenerated frames
- Selective regeneration without affecting approved frames

**`generateVideo(workflowId, userId, dto)`**
- Validates framesApproved=true (blocker)
- Calls ReplicateClient with finalRefinedPrompt
- Supports model selection: veo-3, Video-Generator-PRO
- Configurable duration and fps
- Stores VideoOutput with URL and metadata
- Advances step to VIDEO_GENERATION, sets status to COMPLETED
- Returns workflow with video URL

**`getUserWorkflows(userId, campaignId?)`**
- Retrieves user's workflows with optional campaign filter
- Sorted by lastActivity descending

**`deleteWorkflow(workflowId, userId)`**
- Soft or hard delete based on requirements

#### 3. VideoWorkflowController (`video-workflow.controller.ts`)
REST API endpoints:

```
POST   /video-workflows                          - Create workflow
GET    /video-workflows                          - List user workflows
GET    /video-workflows/:workflowId              - Get specific workflow
POST   /video-workflows/:workflowId/refine-prompt     - Refine prompt (iterate)
POST   /video-workflows/:workflowId/generate-frames   - Generate sample frames
POST   /video-workflows/:workflowId/review-frames     - Submit frame approvals
POST   /video-workflows/:workflowId/regenerate-frames - Regenerate specific frames
POST   /video-workflows/:workflowId/generate-video    - Generate final video
DELETE /video-workflows/:workflowId              - Delete workflow
```

All endpoints protected with JWT auth.

Authentication and access control:
- Token format: `Authorization: Bearer <token>` header is required
- Claims: `userId` is obtained from the JWT `sub` claim
- Verification: validate signature and expiry using the existing JWT verification routine
- Access control: verify `jwt.userId === workflow.userId` before returning workflow resources

Errors:
- `401` for missing/invalid/expired token
- `403` for authenticated but unauthorized access

Token lifecycle:
- Access token TTL documented in auth settings; if refresh tokens are used, include refresh flow
- If applicable, refresh tokens must be stored securely and rotated regularly

External tokens:
- External API keys and tokens must be encrypted at rest (e.g., using a KMS or secrets manager)
- Decrypt at runtime with least-privilege access; implement rotation and access-audit logging

#### 4. VideoWorkflowModule (`video-workflow.module.ts`)
NestJS module configuration:
- Imports: MongooseModule (VideoWorkflow schema), EnginesModule (PoeClient, ReplicateClient)
- Providers: VideoWorkflowService
- Controllers: VideoWorkflowController
- Exports: VideoWorkflowService

### Frontend Components

#### VideoCreationWizard (`VideoCreationWizard.tsx`)
Multi-step wizard component with 5 steps:

**Step 0: Initial Prompt**
- Video title input
- Prompt textarea (describe video)
- Target audience, tone, duration, aspect ratio, visual style
- "Start Creating" button → creates workflow

**Step 1: AI Refinement**
- Displays AI-refined prompt in card
- Shows model and iteration count
- Additional info textarea for refinement iteration
- Model selection dropdown (gpt-4o, claude-3-opus, gemini-1.5-pro)
- "Refine Prompt" button → iterates refinement
- "Continue to Frames" button → proceeds when satisfied

**Step 2: Frame Generation & Review**
- Model selection for frames (stable-diffusion-xl, dalle-3)
- Generate frames button (creates 3 sample frames)
- Frame gallery with approve/reject buttons
- Feedback textarea for rejected frames
- "Regenerate Rejected" button → selective regeneration
- "Continue to Video" button → proceeds when all approved

**Step 3: Video Generation Settings**
- Model selection (veo-3, Video-Generator-PRO)
- FPS and duration configuration
- Final prompt review
- "Generate Video" button → creates final video (long-running)

**Step 4: Completed**
- Video player with final video
- Download button
- Metadata badges (model, duration, fps)
- Close button

**Features:**
- Progress bar showing current step
- Status badges (IN_PROGRESS, PROCESSING, COMPLETED, FAILED)
- Loading states with spinners
- Error alerts
- Real-time workflow updates via API polling (optional enhancement)

#### Integration with Creatives Page
- Added "Open Video Wizard" button in video creative type
- Button opens VideoCreationWizard dialog
- Closes create modal when wizard opens
- Refreshes creatives list on wizard close
- Optional campaign attachment support

## AI Models

### Prompt Refinement Models
1. **gpt-4o** - Fast, creative, balanced (default)
2. **claude-3-opus-20240229** - Deep reasoning, detailed prompts
3. **gemini-1.5-pro** - Balanced performance

### Frame Generation Models
1. **stable-diffusion-xl** - High quality, consistent style (default)
2. **dalle-3** - Creative, diverse interpretations

### Video Generation Models
1. **veo-3** - High quality, slower generation, photorealistic
2. **Video-Generator-PRO** - Fast generation, good quality

## Workflow State Machine

```
INITIAL_PROMPT
  ↓ (user creates workflow)
PROMPT_REFINEMENT ↺ (loop with ADDITIONAL_INFO)
  ↓ (user satisfied)
FRAME_GENERATION
  ↓
FRAME_REVIEW ↔ (loop via regenerateFrames)
  │
  └─ on reject → regenerateFrames → FRAME_GENERATION (repeat until accepted)
  ↓
VIDEO_GENERATION
  ↓
COMPLETED
```

## API Usage Examples

### 1. Create Workflow
```typescript
POST /video-workflows
{
  "title": "Summer Product Launch",
  "initialPrompt": "Create a 30-second video showcasing our new product...",
  "campaignId": "campaign_123", // optional
  "metadata": {
    "targetAudience": "Young professionals",
    "tone": "Energetic and professional",
    "duration": 30,
    "style": "Modern and minimalist",
    "aspectRatio": "16:9"
  }
}
```

### 2. Refine Prompt
```typescript
POST /video-workflows/:workflowId/refine-prompt
{
  "additionalInfo": "Focus more on the product features", // optional
  "model": "gpt-4o" // or "claude-3-opus-20240229", "gemini-1.5-pro"
}
```

### 3. Generate Frames
```typescript
POST /video-workflows/:workflowId/generate-frames
{
  "frameCount": 3,
  "model": "stable-diffusion-xl" // or "dalle-3"
}
```

### 4. Review Frames
```typescript
POST /video-workflows/:workflowId/review-frames
{
  "frameReviews": [
    {
      "frameNumber": 0,
      "approved": true
    },
    {
      "frameNumber": 1,
      "approved": false,
      "feedback": "Make the colors more vibrant"
    },
    {
      "frameNumber": 2,
      "approved": true
    }
  ]
}
```

### 5. Regenerate Frames
```typescript
POST /video-workflows/:workflowId/regenerate-frames
{
  "frameNumbers": [1] // only regenerate frame 1
}
```

### 6. Generate Video
```typescript
POST /video-workflows/:workflowId/generate-video
{
  "model": "veo-3", // or "Video-Generator-PRO"
  "duration": 30,
  "fps": 30
}
```

## Error Handling

All methods include try-catch blocks:
- Errors stored in workflow.errors[] array
- Status set to FAILED on error
- Error messages returned in API response
- Frontend displays error alerts

## Performance Considerations

### Generation Times
- Prompt refinement: 2-5 seconds
- Frame generation: 15-30 seconds per frame
- Video generation: 2-10 minutes (model dependent)

### Optimization Strategies
1. **Parallel frame generation** - Generate all frames simultaneously
2. **Caching** - Cache refined prompts for similar requests
3. **Webhooks** - Implement webhooks for long-running operations
4. **WebSockets** - Real-time progress updates in UI
5. **Background jobs** - Queue video generation with Bull/BullMQ

## Future Enhancements

1. **Real-time Progress** - WebSocket updates during generation
2. **Template Library** - Pre-built video templates
3. **Audio Integration** - Music and voiceover support
4. **Advanced Editing** - Timeline editor for frame adjustments
5. **Collaborative Review** - Team approval workflows
6. **Version History** - Track workflow iterations
7. **A/B Testing** - Generate multiple video variations
8. **Analytics** - Track video performance metrics

## Security

- JWT authentication required for all endpoints
- userId validation prevents unauthorized access
- Encrypted token storage (if needed for external APIs)
- Rate limiting for generation endpoints:
  - Scope: per-user, per-IP, and per-API-key
  - Thresholds:
    - Prompt refinement: 60 req/min per user
    - Frame generation: 10 req/min and 100 req/day per API key
    - Full video generation: 1 req/hr and 10 req/day per API key
  - Runtime behavior: return `429` on hard limit; optionally queue for async processing with max queue length and `Retry-After` header
  - Tiers: allow exemptions/whitelisting for trusted API keys or paid tiers with adjustable limits; audit usage for changes
- Input sanitization for prompts

## Testing

### Unit Tests
- VideoWorkflowService methods
- DTO validation
- Error handling

### Integration Tests
- Full workflow end-to-end
- API endpoint responses
- Database persistence

### E2E Tests
- UI wizard flow
- API integration
- Video generation completion

## Troubleshooting

### Common Issues

**Frames not generating**
- Check finalRefinedPrompt exists
- Verify ReplicateClient API key
- Check frame model availability

**Video generation fails**
- Ensure framesApproved=true
- Verify model selection valid
- Check duration/fps constraints

**Refinement not improving**
- Try different AI models
- Provide more specific additionalInfo
- Review refinement iterations

**Performance issues**
- Enable parallel frame generation
- Implement caching
- Use faster models (Video-Generator-PRO)

## Configuration

### Environment Variables
```env
# AI Service API Keys
POE_API_KEY=your_poe_key
REPLICATE_API_KEY=your_replicate_key

# Model Defaults
DEFAULT_REFINEMENT_MODEL=gpt-4o
DEFAULT_FRAME_MODEL=stable-diffusion-xl
DEFAULT_VIDEO_MODEL=veo-3

# Limits
MAX_REFINEMENT_ITERATIONS=10
MAX_FRAME_REGENERATIONS=5
MAX_VIDEO_DURATION=60
```

### Database Indexes
```typescript
// Recommended indexes
userId + createdAt (desc)
status + lastActivity (desc)
campaignId (if campaign filter used frequently)
```

## Monitoring

Track key metrics:
- Workflow creation rate
- Average refinement iterations
- Frame approval rate
- Video generation success rate
- Generation time by model
- Error rates by step

## Support

For issues or questions:
1. Check error messages in workflow.errors[]
2. Review service logs
3. Verify API keys and model availability
4. Check rate limits
5. Contact AI Freedom Studios support

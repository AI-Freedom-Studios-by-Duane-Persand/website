# Model Selection Feature Documentation

## Overview
Users can now select from popular AI models for different content types without code changes. The system provides intelligent model recommendations based on the task at hand.

## Supported Content Types

> **Naming convention:**
> - **Model ID**: lowercase kebab-case token used in APIs (e.g., `gpt-4o`, `nano-banana`, `video-generator-pro`).
> - **Display name**: human-readable label shown in the UI (e.g., "GPT-4 Omni", "Nano Banana", "Video Generator PRO").

### 1. Prompt Improvement (`prompt-improvement`)
Enhances creative prompts with better descriptors and structure.
- **Recommended model ID**: `gpt-4o` ("GPT-4 Omni")
- **Available model IDs**: `claude-3-opus` ("Claude 3 Opus"), `gpt-4` ("GPT-4"), `claude-3-sonnet` ("Claude 3 Sonnet")

### 2. Image Generation (`image-generation`)
Generates visual content from text descriptions.
- **Recommended model ID**: `nano-banana` ("Nano Banana")
- **Available model IDs**: `dall-e-3` ("DALL-E 3"), `stable-diffusion-xl` ("Stable Diffusion XL")

### 3. Video Generation (`video-generation`)
Creates video content from scripts and prompts.
- **Recommended model ID**: `video-generator-pro` ("Video Generator PRO")
- **Available model IDs**: `veo-3` ("Veo 3"), `gemini-1.5-pro` ("Gemini 1.5 Pro")

### 4. Caption Generation (`caption-generation`)
Creates engaging social media captions and copy.
- **Recommended model ID**: `gpt-4o` ("GPT-4 Omni")
- **Available model IDs**: `claude-3-opus` ("Claude 3 Opus"), `gpt-4` ("GPT-4")

### 5. Script Generation (`script-generation`)
Generates video scripts with structure (hook, body, outro).
- **Recommended model ID**: `gpt-4o` ("GPT-4 Omni")
- **Available model IDs**: `claude-3-opus` ("Claude 3 Opus"), `gemini-1.5-pro` ("Gemini 1.5 Pro")

### 6. Hashtag Generation (`hashtag-generation`)
Generates relevant trending hashtags.
- **Recommended model ID**: `gpt-4o` ("GPT-4 Omni")
- **Available model IDs**: `claude-3-sonnet` ("Claude 3 Sonnet"), `gpt-3.5-turbo` ("GPT-3.5 Turbo")

## API Endpoints

### Get Available Models for Content Type
```
GET /poe/models/available?contentType=prompt-improvement
```

**Request**:
```json
{
  "contentType": "prompt-improvement"
}
```

**Response**:
```json
{
  "contentType": "prompt-improvement",
  "recommendedModel": "gpt-4o",
  "availableModels": [
    {
      "model": "gpt-4o",
      "displayName": "GPT-4 Omni",
      "recommended": true,
      "description": "Most powerful - best for complex creative enhancement"
    },
    {
      "model": "claude-3-opus",
      "displayName": "Claude 3 Opus",
      "recommended": false,
      "description": "Excellent reasoning and nuanced understanding"
    }
  ]
}
```

### Get All Models with Capabilities
```
GET /poe/models/all
```

**Response**:
```json
{
  "total": 11,
  "models": [
    {
      "model": "gpt-4o",
      "displayName": "GPT-4 Omni",
      "provider": "OpenAI",
      "tier": "pro",
      "capabilities": {
        "supportsText": true,
        "supportsImages": true,
        "supportsVideo": false,
        "isMultimodal": true
      }
    }
  ],
  "grouped": {
    "textGeneration": [...],
    "imageGeneration": [...],
    "videoGeneration": [...],
    "multimodal": [...]
  }
}
```

### Validate Model for Content Type
```
POST /poe/models/validate
```

**Request**:
```json
{
  "model": "gpt-4o",
  "contentType": "prompt-improvement",
  "prompt": "Make this better"
}
```

**Response**:
```json
{
  "model": "gpt-4o",
  "contentType": "prompt-improvement",
  "isValid": true,
  "capabilities": {
    "supportsText": true,
    "supportsImages": true,
    "supportsVideo": false,
    "isMultimodal": true
  },
  "message": "Model gpt-4o is suitable for prompt-improvement"
}
```

### Generate Content with Selected Model
```
POST /poe/generate-with-model
```

**Request**:
```json
{
  "contentType": "caption-generation",
  "model": "gpt-4o",
  "prompt": "Create a caption for a tech startup launching a new AI product",
  "context": "professional tone"
}
```

**Response**:
```json
{
  "contentType": "caption-generation",
  "model": "gpt-4o",
  "prompt": "Create a caption for a tech startup launching a new AI product",
  "generatedContent": "{\n  \"caption\": \"Introducing the future of AI...\",\n  \"hashtags\": [\"#AI\", \"#Innovation\", \"#Tech\"]\n}"
}
```

## Usage Examples

### Example 1: Improve a Prompt with Claude
```bash
curl -X POST http://localhost:3001/poe/generate-with-model \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "contentType": "prompt-improvement",
    "model": "claude-3-opus-20240229",
    "prompt": "A cool landscape",
    "context": "Professional photography style"
  }'
```

### Example 2: Generate Image with Nano Banana / DALL-E 3
```bash
# (Optional) First, preview available models for image generation
curl -X GET "http://localhost:3001/poe/models/available?contentType=image-generation" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Then generate an image (via creatives endpoint with model selection).
# You can skip the GET call above if you instead set
# `availableModels: true` and read the returned model list
# from the generate response.
curl -X POST http://localhost:3001/creatives/generate/image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "tenantId": "tenant-123",
    "campaignId": "campaign-456",
    "model": "nano-banana",
    "prompt": "Professional product photography",
    "quality": {
      "width": 1024,
      "height": 1024,
      "enhancePrompt": true
    },
    "availableModels": true
  }'
```

### Example 3: Generate Video Script
```bash
curl -X POST http://localhost:3001/poe/generate-with-model \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "contentType": "script-generation",
    "model": "gpt-4o",
    "prompt": "15-second video about sustainable fashion",
    "context": "engaging and educational"
  }'
```

## Integration with Creatives Service

The model selection feature is integrated with the creatives service. When generating creatives, you can now:

1. **Request available models** by setting `availableModels: true`
2. **Select a specific model** by passing the `model` parameter
3. **Include quality parameters** for images/videos
4. **Get recommendations** from the API responses

### Updated Creative Generation Endpoints

#### Generate Text Creative with Model Selection
```
POST /creatives/generate/text
```

Body includes:
```json
{
  "tenantId": "string",
  "campaignId": "string",
  "model": "gpt-4o",  // Model ID to use
  "prompt": "string",
  "quality": {...},
  "availableModels": true  // If true, response also includes server-side model list
}
```

#### Generate Image Creative with Model Selection
```
POST /creatives/generate/image
```

Body includes:
```json
{
  "tenantId": "string",
  "campaignId": "string",
  "model": "nano-banana",  // Model ID to use for images
  "prompt": "string",
  "quality": {
    "width": 1024,
    "height": 1024,
    "enhancePrompt": true,
    "negativePrompt": "string",
    "guidanceScale": 7.5
  },
  "availableModels": true
}
```

#### Generate Video Creative with Model Selection
```
POST /creatives/generate/video
```

Body includes:
```json
{
  "tenantId": "string",
  "campaignId": "string",
  "model": "video-generator-pro",  // Model ID to use for video
  "prompt": "string",
  "quality": {
    "durationSeconds": 15,
    "fps": 24
  },
  "availableModels": true
}
```

## Model Capabilities

### Text Generation Models
- **GPT-4o**: Best all-around, excellent creativity and reasoning
- **Claude 3 Opus**: Superior logic and long-form content
- **GPT-4**: Reliable, consistent results
- **Claude 3 Sonnet**: Balanced speed and quality
- **Claude 3 Haiku**: Fast and lightweight
- **GPT-3.5 Turbo**: Cost-effective option

### Image Generation Models
- **DALL-E 3**: Highest quality, most realistic
- **Stable Diffusion XL**: Versatile, good for varied styles

### Video Generation Models
- **Video Generator PRO**: Optimized for video creation
- **Veo 3**: Advanced video with high fidelity
- **Gemini 1.5 Pro**: Multimodal, can understand video

### Multimodal Models
- **GPT-4o**: Can understand and analyze images
- **Claude 3 Opus**: Multimodal understanding
- **Claude 3 Sonnet**: Image understanding
- **Gemini 1.5 Pro**: Full video and image support

## Environment Configuration

The feature respects environment variables for provider selection:

```env
# Choose between 'poe' and 'replicate' for image generation
IMAGE_PROVIDER=poe

# Choose between 'poe' and 'replicate' for video generation
VIDEO_PROVIDER=poe

# Enable prompt enhancement by default
ENABLE_PROMPT_ENHANCEMENT=true

# POE API configuration
POE_API_KEY=your_key_here
POE_API_URL=https://api.poe.com/v1
```

## Best Practices

1. **Get available models first** before showing options to users
2. **Validate models** before generating content using the validate endpoint
3. **Use recommended models** as defaults for best results
4. **Include quality parameters** for images and videos to control output
5. **Enable prompt enhancement** for better quality results
6. **Handle rate limits** - some models have usage limits
7. **Test with different models** to find what works best for your use case

## Error Handling

If a model doesn't support a content type:

```json
{
  "error": "Model dalle-3 cannot handle video-generation",
  "suggestion": "Try using Video-Generator-PRO instead"
}
```

## Future Enhancements

- [ ] Model comparison UI
- [ ] Usage statistics per model
- [ ] Cost estimation per model
- [ ] Custom model fine-tuning support
- [ ] Batch processing with model selection
- [ ] Model performance analytics

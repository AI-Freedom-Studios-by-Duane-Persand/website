# Model Selection API Quick Reference

## Subscriptions Controller Toggle

- Set `USE_SUBSCRIPTIONS_V2=true` in `.env` to use the newer `subscriptionsV2.controller` implementation and routes.
- Set `USE_SUBSCRIPTIONS_V2=false` to fall back to the legacy `subscriptions.controller` implementation.
- The app dynamically includes only one module at startup, avoiding route conflicts.


## 🎯 New Endpoints

### 1. Get Available Models for Content Type
```
GET /poe/models/available?contentType={contentType}
Authorization: Bearer {jwt_token}
```

**Content Types**:
- `prompt-improvement`
- `image-generation`
- `video-generation`
- `caption-generation`
- `script-generation`
- `hashtag-generation`

**Example**:
```bash
curl -X GET "http://localhost:3001/poe/models/available?contentType=image-generation" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "contentType": "image-generation",
  "recommendedModel": "dall-e-3",
  "availableModels": [
    {
      "model": "dall-e-3",
      "displayName": "DALL-E 3",
      "recommended": true,
      "description": "Highest quality, best for photorealistic images"
    },
    {
      "model": "stable-diffusion-xl",
      "displayName": "Stable Diffusion XL",
      "recommended": false,
      "description": "Fast, versatile, good for varied styles"
    }
  ]
}
```

---

### 2. Get All Models with Capabilities
```
GET /poe/models/all
Authorization: Bearer {jwt_token}
```

**Example**:
```bash
curl -X GET "http://localhost:3001/poe/models/all" \
  -H "Authorization: Bearer YOUR_TOKEN"
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
    },
    ...
  ],
  "grouped": {
    "textGeneration": [...],
    "imageGeneration": [...],
    "videoGeneration": [...],
    "multimodal": [...]
  }
}
```

---

### 3. Validate Model for Content Type
```
POST /poe/models/validate
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "model": "string",
  "contentType": "string",
  "prompt": "string"
}
```

**Example**:
```bash
curl -X POST "http://localhost:3001/poe/models/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "model": "dall-e-3",
    "contentType": "image-generation",
    "prompt": "test"
  }'
```

**Response**:
```json
{
  "model": "dall-e-3",
  "contentType": "image-generation",
  "isValid": true,
  "capabilities": {
    "supportsText": false,
    "supportsImages": true,
    "supportsVideo": false,
    "isMultimodal": false
  },
  "message": "Model dall-e-3 is suitable for image-generation"
}
```

---

### 4. Generate Content with Selected Model
```
POST /poe/generate-with-model
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "contentType": "string",
  "model": "string",
  "prompt": "string",
  "context": "string (optional)"
}
```

**Example - Generate Improved Prompt**:
```bash
curl -X POST "http://localhost:3001/poe/generate-with-model" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "contentType": "prompt-improvement",
    "model": "gpt-4o",
    "prompt": "A cool landscape",
    "context": "Cinematic photography"
  }'
```

**Response**:
```json
{
  "contentType": "prompt-improvement",
  "model": "gpt-4o",
  "originalContent": "A cool landscape",
  "generatedContent": "A stunning cinematic landscape photograph featuring dramatic mountain peaks..."
}
```

**Example - Generate Caption with Claude**:
```bash
curl -X POST "http://localhost:3001/poe/generate-with-model" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "contentType": "caption-generation",
    "model": "claude-3-opus-20240229",
    "prompt": "Tech startup launching AI product",
    "context": "professional"
  }'
```

---

## 📝 Updated Existing Endpoints

### Generate Image Creative (now with model selection)
```
POST /creatives/generate/image
Authorization: Bearer {jwt_token}

{
  "tenantId": "string",
  "campaignId": "string",
  "model": "string (e.g., 'dall-e-3')",
  "prompt": "string",
  "layoutHint": "string (optional)",
  "platforms": ["string (optional)"],
  "angleId": "string (optional)",
  "quality": {
    "width": 1024,
    "height": 1024,
    "negativePrompt": "string",
    "numInferenceSteps": 30,
    "guidanceScale": 7.5,
    "scheduler": "string",
    "enhancePrompt": true
  }
}
```

**Example**:
```bash
curl -X POST "http://localhost:3001/creatives/generate/image" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tenantId": "665a1234567890",
    "campaignId": "665b1234567890",
    "model": "dall-e-3",
    "prompt": "Professional product photography",
    "quality": {
      "width": 1024,
      "height": 1024,
      "enhancePrompt": true
    }
  }'
```

---

### Generate Video Creative (now with model selection)
```
POST /creatives/generate/video
Authorization: Bearer {jwt_token}

{
  "tenantId": "string",
  "campaignId": "string",
  "model": "string (e.g., 'Video-Generator-PRO')",
  "prompt": "string",
  "platforms": ["string (optional)"],
  "angleId": "string (optional)",
  "quality": {
    "durationSeconds": 15,
    "fps": 24,
    "negativePrompt": "string",
    "numInferenceSteps": 50,
    "guidanceScale": 7.5
  }
}
```

**Example**:
```bash
curl -X POST "http://localhost:3001/creatives/generate/video" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tenantId": "665a1234567890",
    "campaignId": "665b1234567890",
    "model": "Video-Generator-PRO",
    "prompt": "Engaging tech product demo",
    "quality": {
      "durationSeconds": 15,
      "fps": 24
    }
  }'
```

---

### Generate Text Creative (now with model selection)
```
POST /creatives/generate/text
Authorization: Bearer {jwt_token}

{
  "tenantId": "string",
  "campaignId": "string",
  "model": "string (e.g., 'gpt-4o')",
  "prompt": "string",
  "platforms": ["string (optional)"],
  "angleId": "string (optional)",
  "guidance": {
    "tone": "string (optional, e.g., 'professional')",
    "maxLength": "number (optional)",
    "language": "string (optional, e.g., 'en')",
    "platforms": ["string (optional)"]
  } (optional)
}
```

**Example**:
```bash
curl -X POST "http://localhost:3001/creatives/generate/text" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tenantId": "665a1234567890",
    "campaignId": "665b1234567890",
    "model": "gpt-4o",
    "prompt": "Write a LinkedIn post announcing our new AI-powered marketing assistant.",
    "platforms": ["linkedin"],
    "angleId": "product-launch",
    "guidance": {
      "tone": "professional",
      "maxLength": 280,
      "language": "en",
      "platforms": ["linkedin", "twitter"]
    }
  }'
```

**Sample Response**:
```json
{
  "contentType": "caption-generation",
  "model": "gpt-4o",
  "originalContent": {
    "tenantId": "665a1234567890",
    "campaignId": "665b1234567890",
    "prompt": "Write a LinkedIn post announcing our new AI-powered marketing assistant.",
    "platforms": ["linkedin"],
    "angleId": "product-launch",
    "guidance": {
      "tone": "professional",
      "maxLength": 280,
      "language": "en",
      "platforms": ["linkedin", "twitter"]
    }
  },
  "generatedContent": {
    "caption": "Meet your new AI marketing copilot. 🚀  We just launched an AI-powered assistant that helps teams plan campaigns, generate on-brand content, and move from idea to publish in minutes.",
    "hashtags": [
      "#AIFreedomStudios",
      "#MarketingAutomation",
      "#ProductLaunch"
    ]
  }
}
```

---

## 🧠 Model Recommendations by Use Case

### I want to improve my prompt
✅ **Best**: `gpt-4o`
- Advanced reasoning
- Creative enhancement
- Detailed descriptors

Alternatives: `claude-3-opus-20240229`, `gpt-4`

---

### I want to generate an image
✅ **Best**: `dall-e-3`
- Highest quality
- Most realistic
- Best detail

Alternatives: `stable-diffusion-xl`

---

### I want to generate a video
✅ **Best**: `Video-Generator-PRO`
- Optimized for video
- Highest quality
- Best performance

Alternatives: `veo-3`, `gemini-1.5-pro`

---

### I want to write social captions
✅ **Best**: `gpt-4o`
- Best tone variation
- Platform optimization
- Engagement focus

Alternatives: `claude-3-opus-20240229`, `gpt-4`

---

### I want to write video scripts
✅ **Best**: `gpt-4o`
- Structured output
- Hook/body/outro format
- Compelling narrative

Alternatives: `claude-3-opus-20240229`, `gemini-1.5-pro`

---

### I want to generate hashtags
✅ **Best**: `gpt-4o`
- Trending awareness
- Platform specific
- Engagement optimized

Alternatives: `claude-3-sonnet-20240229`, `gpt-3.5-turbo`

---

## 🎨 All 11 Available Models

| Model | Provider | Type | Tier | Best For |
|-------|----------|------|------|----------|
| `gpt-4o` | OpenAI | Text + Image | Pro | General purpose, prompts, captions |
| `gpt-4` | OpenAI | Text | Pro | Complex reasoning |
| `gpt-3.5-turbo` | OpenAI | Text | Free | Cost-effective text |
| `claude-3-opus-20240229` | Anthropic | Text + Image | Pro | Advanced reasoning |
| `claude-3-sonnet-20240229` | Anthropic | Text + Image | Pro | Balanced quality/speed |
| `claude-3-haiku-20240307` | Anthropic | Text + Image | Free | Fast, lightweight |
| `gemini-1.5-pro` | Google | Text + Image + Video | Pro | Multimodal content |
| `dall-e-3` | OpenAI | Image | Pro | Highest quality images |
| `stable-diffusion-xl` | Stability AI | Image | Pro | Versatile images |
| `Video-Generator-PRO` | Poe | Video | Pro | Professional videos |
| `veo-3` | Google | Video | Pro | Advanced video |

---

## 💡 Pro Tips

1. **Always get models first**: Call GET /poe/models/available to show users options
2. **Validate before generating**: Use POST /poe/models/validate to check compatibility
3. **Use recommended models**: They're optimized for each task
4. **Quality parameters matter**: Image/video quality scales with parameters
5. **Enable prompt enhancement**: Set `enhancePrompt: true` for better results
6. **Combine with providers**: Use IMAGE_PROVIDER=poe env var to switch between providers
7. **Cache model lists**: Don't fetch models on every request
8. **Error handling**: Always handle model validation failures gracefully

---

## ❓ Common Questions

**Q: Can I use DALL-E 3 for video generation?**
A: No, DALL-E 3 only supports images. Use Video-Generator-PRO instead.

**Q: Which model is fastest?**
A: GPT-3.5 Turbo and Claude 3 Haiku are fastest.

**Q: Which model is most accurate?**
A: GPT-4o and Claude 3 Opus are most accurate.

**Q: Can I mix providers in one project?**
A: Yes! Use IMAGE_PROVIDER for images and VIDEO_PROVIDER for videos independently.

**Q: Do I need to change code to switch models?**
A: No! Just pass the model parameter in the request. 

**Q: What if model validation fails?**
A: The system will return an error suggesting compatible models.

**Q: Can I use free tier models?**
A: Yes, but they have lower quality. Pro models recommended for production.

---

## 🔗 Related Documentation

- Full Feature Doc: `MODEL_SELECTION_FEATURE.md`
- Implementation Summary: `IMPLEMENTATION_SUMMARY.md`
- Original Prompt Selection: Env vars `IMAGE_PROVIDER` and `VIDEO_PROVIDER`

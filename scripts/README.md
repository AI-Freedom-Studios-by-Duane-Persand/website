# Setup Scripts

This directory contains utility scripts for configuring and testing the AI Freedom Studios platform.

## Available Scripts

### 🔧 setup-poe.js

Interactive wizard to configure the POE API for image/video generation.

**Usage:**
```bash
node scripts/setup-poe.js
```

**What it does:**
- Guides you through POE API configuration
- Sets up API URL and authentication
- Configures default models for image/video/text generation
- Sets timeout and feature flags
- Creates/updates `api/.env` file

**Prerequisites:**
- Node.js installed
- POE API account and key from [poe.com/api_key](https://poe.com/api_key)

---

### 🧪 test-poe.js

Tests POE API configuration and connectivity.

**Usage:**
```bash
node scripts/test-poe.js
```

**What it tests:**
1. ✅ Environment variables present
2. ✅ Model configuration valid
3. ✅ Timeout settings configured
4. ✅ Feature flags set
5. ✅ API connection working

**Output:**
```
🧪 Testing POE API Configuration

Test 1: Environment Variables
  ✅ POE_API_URL: https://api.poe.com/v1
  ✅ POE_API_KEY: ***abc123

Test 2: Model Configuration
  ✅ Image Model: dall-e-3
  ✅ Video Model: veo-3
  ✅ Text Model: gpt-4o

...

✅ POE API configuration test complete!
```

---

## Quick Start

### 1. Initial Setup

Run the setup wizard:
```bash
node scripts/setup-poe.js
```

Follow the prompts to configure:
- POE API URL (default: https://api.poe.com/v1)
- POE API Key (get from poe.com)
- Default models for generation
- Timeouts and feature flags

### 2. Verify Configuration

Test your configuration:
```bash
node scripts/test-poe.js
```

All checks should pass with ✅ green checkmarks.

### 3. Start Development

```bash
cd api
npm run dev
```

Your API is now ready with POE integration!

---

## Configuration Files

### api/.env.example

Template with all available configuration options. Copy this to `api/.env` and fill in your values.

**Key Variables:**
```env
POE_API_URL=https://api.poe.com/v1
POE_API_KEY=your_key_here
POE_IMAGE_MODEL=dall-e-3
POE_VIDEO_MODEL=veo-3
POE_TEXT_MODEL=gpt-4o
ENABLE_AUTO_MEDIA_GENERATION=true
```

### api/.env

Your actual configuration (git-ignored). Created by setup script or manually.

---

## Troubleshooting

### "POE API key is missing"

**Solution:**
1. Run `node scripts/setup-poe.js`
2. Enter your POE API key when prompted
3. Or manually add to `api/.env`:
   ```env
   POE_API_KEY=your_actual_key
   ```

### "Cannot connect to POE API"

**Possible causes:**
- Wrong API URL
- Invalid API key
- Network/firewall issues

**Debug:**
```bash
# Test configuration
node scripts/test-poe.js

# Check API URL
grep POE_API_URL api/.env

# Verify key works
curl https://api.poe.com/v1/models \
  -H "Authorization: Bearer YOUR_KEY"
```

### "Model does not support generation type"

**Solution:**
1. Check model capabilities in POE_CONFIGURATION.md
2. Update model in .env:
   ```env
   POE_IMAGE_MODEL=dall-e-3  # For images
   POE_VIDEO_MODEL=veo-3     # For videos
   ```
3. Restart API server

---

## Advanced Usage

### Custom Model Configuration

Edit `api/src/engines/poe.client.ts` to add custom models:

```typescript
private readonly modelCapabilities: Map<string, ModelCapabilities> = new Map([
  ['your-custom-model', {
    supportsText: true,
    supportsImages: true,
    supportsVideo: false,
    isMultimodal: true
  }],
]);
```

### Environment-Specific Configuration

Create multiple env files:

```bash
api/.env.development
api/.env.staging
api/.env.production
```

Load specific environment:
```bash
NODE_ENV=production npm run dev
```

---

## Documentation

- **POE Configuration Guide**: `.github/docs/POE_CONFIGURATION.md`
- **Media Generation**: `.github/docs/MEDIA_GENERATION.md`
- **API Reference**: Main README.md

---

## Support

Issues? Questions?

1. Check documentation in `.github/docs/`
2. Run test script: `node scripts/test-poe.js`
3. Review logs: `tail -f api/logs/poe-client.log`
4. Open GitHub issue with test results

---

## Contributing

To add new setup scripts:

1. Create script in `scripts/` directory
2. Add execution instructions to this README
3. Test on clean installation
4. Submit pull request

**Script Guidelines:**
- Use Node.js (no external dependencies if possible)
- Provide clear terminal output with colors
- Handle errors gracefully
- Update this README with usage instructions

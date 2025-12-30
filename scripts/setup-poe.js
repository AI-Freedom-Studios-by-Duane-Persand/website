#!/usr/bin/env node

/**
 * POE API Configuration Setup Script
 * 
 * This script helps configure the POE API for image/video generation
 * Run: node scripts/setup-poe.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('\n🚀 POE API Configuration Setup\n', 'bright');
  log('This wizard will help you configure the POE API for image/video generation.\n', 'blue');

  const envPath = path.join(__dirname, '..', 'api', '.env');
  const envExamplePath = path.join(__dirname, '..', 'api', '.env.example');

  // Check if .env.example exists
  if (!fs.existsSync(envExamplePath)) {
    log('❌ Error: .env.example not found!', 'red');
    log('Please ensure you are running this from the project root.', 'yellow');
    process.exit(1);
  }

  // Read current .env if exists
  let currentEnv = {};
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        currentEnv[key.trim()] = valueParts.join('=').trim();
      }
    });
  }

  log('📋 Configuration Steps:\n', 'bright');

  // Step 1: POE API URL
  log('1. POE API URL', 'green');
  log('   Default: https://api.poe.com/v1', 'blue');
  const poeUrl = await question(`   Enter POE API URL [${currentEnv.POE_API_URL || 'https://api.poe.com/v1'}]: `);
  const POE_API_URL = poeUrl.trim() || currentEnv.POE_API_URL || 'https://api.poe.com/v1';

  // Step 2: POE API Key
  log('\n2. POE API Key', 'green');
  log('   Get your key from: https://poe.com/api_key', 'blue');
  const poeKey = await question(`   Enter POE API Key [${currentEnv.POE_API_KEY ? '***hidden***' : 'required'}]: `);
  const POE_API_KEY = poeKey.trim() || currentEnv.POE_API_KEY || '';

  if (!POE_API_KEY) {
    log('\n❌ Error: POE API Key is required!', 'red');
    log('Please visit https://poe.com/api_key to get your API key.', 'yellow');
    process.exit(1);
  }

  // Step 3: Model Selection
  log('\n3. Model Selection', 'green');
  log('   Configure default models for different generation types', 'blue');

  const imageModels = ['dall-e-3', 'stable-diffusion-xl', 'gpt-4o'];
  log(`\n   Image Models: ${imageModels.join(', ')}`, 'blue');
  const imageModel = await question(`   Default image model [${currentEnv.POE_IMAGE_MODEL || 'dall-e-3'}]: `);
  const POE_IMAGE_MODEL = imageModel.trim() || currentEnv.POE_IMAGE_MODEL || 'dall-e-3';

  const videoModels = ['veo-3', 'gemini-1.5-pro'];
  log(`\n   Video Models: ${videoModels.join(', ')}`, 'blue');
  const videoModel = await question(`   Default video model [${currentEnv.POE_VIDEO_MODEL || 'veo-3'}]: `);
  const POE_VIDEO_MODEL = videoModel.trim() || currentEnv.POE_VIDEO_MODEL || 'veo-3';

  const textModels = ['gpt-4o', 'claude-3-opus-20240229', 'gemini-1.5-pro'];
  log(`\n   Text Models: ${textModels.join(', ')}`, 'blue');
  const textModel = await question(`   Default text model [${currentEnv.POE_TEXT_MODEL || 'gpt-4o'}]: `);
  const POE_TEXT_MODEL = textModel.trim() || currentEnv.POE_TEXT_MODEL || 'gpt-4o';

  // Step 4: Auto-generation
  log('\n4. Auto-generation Settings', 'green');
  const autoGen = await question(`   Enable automatic media generation? (yes/no) [${currentEnv.ENABLE_AUTO_MEDIA_GENERATION || 'yes'}]: `);
  const ENABLE_AUTO_MEDIA_GENERATION = (autoGen.trim().toLowerCase() || 'yes').startsWith('y') ? 'true' : 'false';

  // Step 5: Timeouts
  log('\n5. Timeout Settings', 'green');
  const imgTimeout = await question(`   Image generation timeout (ms) [${currentEnv.IMAGE_GENERATION_TIMEOUT || '30000'}]: `);
  const IMAGE_GENERATION_TIMEOUT = imgTimeout.trim() || currentEnv.IMAGE_GENERATION_TIMEOUT || '30000';

  const vidTimeout = await question(`   Video generation timeout (ms) [${currentEnv.VIDEO_GENERATION_TIMEOUT || '120000'}]: `);
  const VIDEO_GENERATION_TIMEOUT = vidTimeout.trim() || currentEnv.VIDEO_GENERATION_TIMEOUT || '120000';

  // Build new .env content
  log('\n📝 Generating configuration...', 'bright');

  let envContent = fs.readFileSync(envExamplePath, 'utf8');

  const updates = {
    POE_API_URL,
    POE_API_KEY,
    POE_IMAGE_MODEL,
    POE_VIDEO_MODEL,
    POE_TEXT_MODEL,
    ENABLE_AUTO_MEDIA_GENERATION,
    IMAGE_GENERATION_TIMEOUT,
    VIDEO_GENERATION_TIMEOUT,
  };

  Object.entries(updates).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'gm');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  });

  // Preserve other existing values
  Object.entries(currentEnv).forEach(([key, value]) => {
    if (!updates[key]) {
      const regex = new RegExp(`^${key}=.*$`, 'gm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      }
    }
  });

  // Write .env file
  fs.writeFileSync(envPath, envContent);

  log('\n✅ Configuration complete!', 'green');
  log('\n📄 Configuration saved to: api/.env', 'blue');

  log('\n📊 Summary:', 'bright');
  log(`   POE API URL: ${POE_API_URL}`, 'blue');
  log(`   POE API Key: ***${POE_API_KEY.slice(-8)}`, 'blue');
  log(`   Image Model: ${POE_IMAGE_MODEL}`, 'blue');
  log(`   Video Model: ${POE_VIDEO_MODEL}`, 'blue');
  log(`   Text Model: ${POE_TEXT_MODEL}`, 'blue');
  log(`   Auto-generation: ${ENABLE_AUTO_MEDIA_GENERATION}`, 'blue');

  log('\n🚀 Next Steps:', 'bright');
  log('   1. Review api/.env for additional settings', 'yellow');
  log('   2. Start the API server: cd api && npm run dev', 'yellow');
  log('   3. Test image generation: npm run test:image-gen', 'yellow');
  log('   4. Test video generation: npm run test:video-gen', 'yellow');

  log('\n📚 Documentation:', 'bright');
  log('   Configuration Guide: .github/docs/POE_CONFIGURATION.md', 'blue');
  log('   Media Generation: .github/docs/MEDIA_GENERATION.md', 'blue');

  log('\n✨ Happy creating!\n', 'green');

  rl.close();
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});

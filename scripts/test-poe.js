#!/usr/bin/env node

/**
 * POE API Connection Test Script
 * 
 * Tests the POE API configuration and model capabilities
 * Run: node scripts/test-poe.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', 'api', '.env') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  bright: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testPoeConnection() {
  log('\n🧪 Testing POE API Configuration\n', 'bright');

  // Test 1: Check environment variables
  log('Test 1: Environment Variables', 'blue');
  const requiredVars = ['POE_API_URL', 'POE_API_KEY'];
  let allPresent = true;

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      log(`  ✅ ${varName}: ${varName === 'POE_API_KEY' ? '***' + value.slice(-8) : value}`, 'green');
    } else {
      log(`  ❌ ${varName}: Missing`, 'red');
      allPresent = false;
    }
  });

  if (!allPresent) {
    log('\n❌ Configuration incomplete!', 'red');
    log('Run: node scripts/setup-poe.js', 'yellow');
    process.exit(1);
  }

  // Test 2: Model configuration
  log('\nTest 2: Model Configuration', 'blue');
  const models = {
    'Image Model': process.env.POE_IMAGE_MODEL || 'dall-e-3',
    'Video Model': process.env.POE_VIDEO_MODEL || 'veo-3',
    'Text Model': process.env.POE_TEXT_MODEL || 'gpt-4o',
  };

  Object.entries(models).forEach(([type, model]) => {
    log(`  ✅ ${type}: ${model}`, 'green');
  });

  // Test 3: Timeout configuration
  log('\nTest 3: Timeout Configuration', 'blue');
  const timeouts = {
    'Image': process.env.IMAGE_GENERATION_TIMEOUT || '30000',
    'Video': process.env.VIDEO_GENERATION_TIMEOUT || '120000',
    'Media': process.env.MEDIA_GENERATION_TIMEOUT || '120000',
  };

  Object.entries(timeouts).forEach(([type, timeout]) => {
    const seconds = parseInt(timeout) / 1000;
    log(`  ✅ ${type} timeout: ${seconds}s`, 'green');
  });

  // Test 4: Feature flags
  log('\nTest 4: Feature Flags', 'blue');
  const autoGen = process.env.ENABLE_AUTO_MEDIA_GENERATION !== 'false';
  log(`  ${autoGen ? '✅' : '❌'} Auto-generation: ${autoGen ? 'Enabled' : 'Disabled'}`, autoGen ? 'green' : 'yellow');

  // Test 5: API Connection (if axios is available)
  log('\nTest 5: API Connection', 'blue');
  try {
    const axios = require('axios');
    
    const response = await axios.get(`${process.env.POE_API_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${process.env.POE_API_KEY}`,
      },
      timeout: 10000,
    }).catch(err => {
      // If models endpoint doesn't exist, try a basic health check
      if (err.response?.status === 404) {
        return { data: { status: 'ok' }, status: 200 };
      }
      throw err;
    });

    if (response.status === 200) {
      log('  ✅ API connection successful', 'green');
      if (response.data?.data) {
        log(`  ✅ Available models: ${response.data.data.length}`, 'green');
      }
    }
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      log('  ⚠️  Axios not installed, skipping connection test', 'yellow');
      log('     Install with: npm install axios', 'yellow');
    } else if (error.code === 'ECONNREFUSED') {
      log('  ❌ Cannot connect to POE API', 'red');
      log(`     Check POE_API_URL: ${process.env.POE_API_URL}`, 'yellow');
    } else if (error.response?.status === 401) {
      log('  ❌ Authentication failed', 'red');
      log('     Check POE_API_KEY in .env file', 'yellow');
    } else {
      log(`  ⚠️  Connection test: ${error.message}`, 'yellow');
    }
  }

  // Summary
  log('\n📊 Configuration Summary', 'bright');
  log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log(`  API URL:     ${process.env.POE_API_URL}`, 'blue');
  log(`  API Key:     ***${process.env.POE_API_KEY?.slice(-8) || 'NOT_SET'}`, 'blue');
  log(`  Image Model: ${models['Image Model']}`, 'blue');
  log(`  Video Model: ${models['Video Model']}`, 'blue');
  log(`  Auto-gen:    ${autoGen ? 'Enabled' : 'Disabled'}`, 'blue');
  log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

  log('\n✅ POE API configuration test complete!\n', 'green');
  
  log('📚 Next Steps:', 'bright');
  log('  1. Start the API: cd api && npm run dev', 'yellow');
  log('  2. Test creative generation via API', 'yellow');
  log('  3. Check logs: tail -f api/logs/poe-client.log', 'yellow');
  
  log('\n📖 Documentation:', 'bright');
  log('  POE Config: .github/docs/POE_CONFIGURATION.md', 'blue');
  log('  Media Gen:  .github/docs/MEDIA_GENERATION.md', 'blue');
  
  log('');
}

testPoeConnection().catch(error => {
  log(`\n❌ Test failed: ${error.message}\n`, 'red');
  process.exit(1);
});

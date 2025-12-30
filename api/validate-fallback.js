#!/usr/bin/env node

/**
 * Provider Fallback Validation Script
 * 
 * This script validates:
 * 1. Both API keys are configured
 * 2. Error handling code is in place
 * 3. Fallback logic is properly wired
 */

const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

function log(message, status = 'info') {
  if (status === 'pass') console.log(`${GREEN}✓${RESET} ${message}`);
  else if (status === 'fail') console.log(`${RED}✗${RESET} ${message}`);
  else if (status === 'warn') console.log(`${YELLOW}⚠${RESET} ${message}`);
  else console.log(`  ${message}`);
}

function check(condition, passMsg, failMsg) {
  if (condition) {
    log(passMsg, 'pass');
    passed++;
  } else {
    log(failMsg, 'fail');
    failed++;
  }
}

console.log('\n=== Provider Fallback Validation ===\n');

// Check 1: Environment variables
console.log('1. Environment Configuration');
const poeKey = process.env.POE_API_KEY;
const replicateKey = process.env.REPLICATE_API_KEY;
const videoProvider = process.env.VIDEO_PROVIDER || 'replicate';
const imageProvider = process.env.IMAGE_PROVIDER || 'replicate';

check(!!poeKey, 'POE_API_KEY is configured', 'POE_API_KEY is missing');
check(!!replicateKey, 'REPLICATE_API_KEY is configured', 'REPLICATE_API_KEY is missing');
check(videoProvider === 'poe' || videoProvider === 'replicate', `VIDEO_PROVIDER is valid: ${videoProvider}`, 'VIDEO_PROVIDER is invalid');
check(imageProvider === 'poe' || imageProvider === 'replicate', `IMAGE_PROVIDER is valid: ${imageProvider}`, 'IMAGE_PROVIDER is invalid');

// Check 2: File existence and error handling code
console.log('\n2. Source Code Validation');
const creativesServicePath = path.join(__dirname, 'src', 'creatives', 'creatives.service.ts');
const poeClientPath = path.join(__dirname, 'src', 'engines', 'poe.client.ts');

let creativesContent = '';
let poeContent = '';

try {
  creativesContent = fs.readFileSync(creativesServicePath, 'utf-8');
  check(true, 'CreativesService found', '');
} catch {
  check(false, '', 'CreativesService not found');
}

try {
  poeContent = fs.readFileSync(poeClientPath, 'utf-8');
  check(true, 'PoeClient found', '');
} catch {
  check(false, '', 'PoeClient not found');
}

// Check 3: Fallback logic
console.log('\n3. Fallback Logic Validation');

if (creativesContent) {
  check(
    creativesContent.includes('Attempting Replicate fallback'),
    'Fallback attempt logged',
    'Fallback logging missing'
  );
  check(
    creativesContent.includes('poeError: any') || creativesContent.includes('catch (poeError'),
    'Poe error caught in try-catch',
    'Poe error handling missing'
  );
  check(
    creativesContent.includes('REPLICATE_API_KEY') && creativesContent.includes('fallback'),
    'Replicate key check before fallback',
    'Replicate key validation missing'
  );
  check(
    creativesContent.includes('replicateClient.generateVideo') || creativesContent.includes('generateImage'),
    'Fallback calls correct client method',
    'Fallback method call missing'
  );
}

// Check 4: Error handling in PoeClient
console.log('\n4. Error Handling Validation');

if (poeContent) {
  check(
    poeContent.includes('402'),
    'Handles 402 status code (insufficient quota)',
    '402 error handling missing'
  );
  check(
    poeContent.includes('poe.com/api_key'),
    'Returns actionable URL for 402 errors',
    'Error message missing helpful URL'
  );
  check(
    poeContent.includes('(err as any).status = status'),
    'Error status property is set',
    'Error status not attached to error object'
  );
  check(
    poeContent.includes('Video-Generator-PRO'),
    'Uses Video-Generator-PRO model',
    'Video-Generator-PRO not configured'
  );
}

// Check 5: Build status
console.log('\n5. Build Status');
const distPath = path.join(__dirname, 'dist');
check(
  fs.existsSync(distPath),
  'Project is built (dist/ exists)',
  'Project needs rebuild'
);

// Summary
console.log('\n=== Summary ===');
console.log(`${GREEN}${passed} checks passed${RESET}`);
if (failed > 0) {
  console.log(`${RED}${failed} checks failed${RESET}`);
}

console.log('\n=== Configuration Summary ===');
console.log(`VIDEO_PROVIDER: ${videoProvider}`);
console.log(`IMAGE_PROVIDER: ${imageProvider}`);
console.log(`POE_API_KEY: ${poeKey ? '✓ configured' : '✗ missing'}`);
console.log(`REPLICATE_API_KEY: ${replicateKey ? '✓ configured' : '✗ missing'}`);

if (failed === 0 && poeKey && replicateKey) {
  console.log(`\n${GREEN}✓ System is ready for fallback testing!${RESET}`);
  console.log('\nNext steps:');
  console.log('1. Start the server: npm run start');
  console.log('2. Call render endpoint: POST /api/creatives/{id}/render');
  console.log('3. Check logs for fallback messages');
  console.log('4. If using Poe primary, ensure it has credits at https://poe.com/api_key');
} else if (failed > 0) {
  console.log(`\n${RED}✗ Fix validation errors before testing${RESET}`);
  console.log('\nTo fix:');
  if (!poeKey) console.log('1. Set POE_API_KEY environment variable');
  if (!replicateKey) console.log('1. Set REPLICATE_API_KEY environment variable');
  console.log('2. Rebuild: npm run build');
  console.log('3. Restart: npm run start');
}

process.exit(failed > 0 ? 1 : 0);

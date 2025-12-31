#!/usr/bin/env node
/**
 * MongoDB Atlas Connection Diagnostic
 * Checks connectivity and common configuration issues
 */

import { connect } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

console.log('🔍 MongoDB Atlas Connection Diagnostic\n');
console.log('Configuration:');
console.log(`  URI: ${mongoUri ? mongoUri.replace(/:[^:]*@/, ':***@') : 'NOT SET'}`);
console.log(`  Environment: ${process.env.NODE_ENV || 'development'}\n`);

if (!mongoUri) {
  console.error('❌ ERROR: MONGO_URI or MONGODB_URI not set in .env');
  process.exit(1);
}

// Parse connection string
try {
  const url = new URL(mongoUri);
  console.log('Connection String Analysis:');
  console.log(`  Protocol: ${url.protocol}`);
  console.log(`  Host: ${url.hostname}`);
  console.log(`  Port: ${url.port || 'default'}`);
  console.log(`  Database: ${url.pathname.replace('/', '')}`);
  console.log(`  Auth: ${url.username ? 'Yes' : 'No'}`);
  console.log(`  Search params: ${url.searchParams.toString()}\n`);
} catch (e) {
  console.error('❌ Invalid connection string:', e.message);
  process.exit(1);
}

console.log('Testing connection...\n');

const testConnection = async () => {
  try {
    const connection = await connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 5,
      minPoolSize: 1,
    });

    console.log('✅ Connection successful!');
    console.log(`  Connected to: ${connection.connection.host}`);
    console.log(`  Database: ${connection.connection.name}`);
    
    // Try to ping the server
    const adminDb = connection.connection.getClient().db('admin');
    const pingResult = await adminDb.admin().ping();
    console.log('  Ping: Success');

    await connection.disconnect();
    console.log('\n✅ All checks passed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed!');
    console.error(`  Error: ${err.message}`);
    
    if (err.message.includes('ENOTFOUND')) {
      console.error('\n💡 Hint: DNS resolution failed. Check hostname spelling.');
    } else if (err.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Hint: Connection refused. Check IP whitelisting in MongoDB Atlas.');
      console.error('   - Go to MongoDB Atlas > Network Access');
      console.error('   - Add your IP address (or 0.0.0.0/0 for development)');
    } else if (err.message.includes('Authentication failed')) {
      console.error('\n💡 Hint: Invalid credentials. Check username and password in connection string.');
    } else if (err.message.includes('ETIMEDOUT') || err.message.includes('serverSelectionTimedOut')) {
      console.error('\n💡 Hint: Connection timeout. Check:');
      console.error('   - Network connectivity');
      console.error('   - MongoDB Atlas IP whitelist (Network Access)');
      console.error('   - Cluster status (not paused/sleeping)');
    }
    
    process.exit(1);
  }
};

testConnection();

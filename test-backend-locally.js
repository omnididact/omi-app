#!/usr/bin/env node

// Test script to verify backend configuration before Railway deployment
import fetch from 'node-fetch';

const LOCAL_API = 'http://localhost:3001';
const RAILWAY_API = 'https://omi-app-production.up.railway.app';

async function testEndpoint(baseUrl, endpoint, description) {
  console.log(`\n🔍 Testing ${description}:`);
  console.log(`   URL: ${baseUrl}${endpoint}`);
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OMI-Test-Client/1.0'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ SUCCESS: ${response.status}`);
      console.log(`   📄 Response:`, JSON.stringify(data, null, 4));
    } else {
      console.log(`   ❌ FAILED: ${response.status} ${response.statusText}`);
      console.log(`   📄 Error:`, JSON.stringify(data, null, 4));
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 OMI Backend Connection Tests');
  console.log('================================');
  
  // Test Railway deployment
  await testEndpoint(RAILWAY_API, '/api/health', 'Railway Health Check');
  await testEndpoint(RAILWAY_API, '/', 'Railway Root Endpoint');
  await testEndpoint(RAILWAY_API, '/health', 'Railway Simple Health Check');
  
  console.log('\n📊 Test Summary:');
  console.log('If Railway tests fail with 502 errors, the deployment needs to be fixed.');
  console.log('If Railway tests pass, the frontend should be able to connect successfully.');
  console.log('\n🔧 Next Steps:');
  console.log('1. If Railway is working: Update frontend environment variables');
  console.log('2. If Railway fails: Check Railway dashboard and redeploy');
  console.log('3. Update Netlify environment variables to use Railway URL');
}

runTests().catch(console.error);
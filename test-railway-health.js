#!/usr/bin/env node

/**
 * Railway Health Check Test Script
 * Tests the deployed Railway backend health endpoints
 */

const RAILWAY_URL = 'https://omi-8d441fd7-production.up.railway.app';

async function testRailwayHealth() {
  console.log('🚀 Testing Railway deployment health...');
  console.log(`📍 Railway URL: ${RAILWAY_URL}`);
  
  const endpoints = [
    '/api/health',
    '/health', 
    '/'
  ];
  
  for (const endpoint of endpoints) {
    const url = `${RAILWAY_URL}${endpoint}`;
    console.log(`\n🔍 Testing: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Railway-Health-Test/1.0'
        }
      });
      
      const status = response.status;
      const text = await response.text();
      
      console.log(`📊 Status: ${status}`);
      console.log(`📝 Response: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
      
      if (status === 200) {
        console.log('✅ Endpoint working!');
      } else {
        console.log('⚠️  Endpoint returned non-200 status');
      }
      
    } catch (error) {
      console.error('❌ Request failed:');
      console.error(`   Error: ${error.message}`);
      
      if (error.code === 'ENOTFOUND') {
        console.error('   This might mean Railway deployment is not ready yet');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('   This might mean the server is not responding');
      }
    }
  }
  
  console.log('\n🏁 Railway health check test completed');
}

// Run the test
testRailwayHealth().catch(console.error);
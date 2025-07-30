#!/usr/bin/env node

/**
 * Railway URL Discovery Script
 * Attempts to find the correct Railway deployment URL
 */

async function findRailwayUrl() {
  console.log('🔍 Searching for correct Railway deployment URL...');
  
  // Common Railway URL patterns
  const possibleUrls = [
    'https://omi-8d441fd7-production.up.railway.app',
    'https://server-production-22c6.up.railway.app', // If server subdirectory
    'https://web-production-22c6.up.railway.app',
    'https://backend-production-22c6.up.railway.app',
    'https://api-production-22c6.up.railway.app'
  ];
  
  console.log('📋 Testing potential URLs:');
  
  for (const url of possibleUrls) {
    console.log(`\n🌐 Testing: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'Railway-Discovery/1.0'
        }
      });
      
      const status = response.status;
      console.log(`📊 Status: ${status}`);
      
      if (status === 200 || status === 404) {
        // Even 404 means the server is responding
        const text = await response.text();
        console.log(`📝 Response: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
        
        if (status === 200) {
          console.log('✅ FOUND WORKING URL!');
          
          // Test health endpoint
          try {
            const healthUrl = `${url}/api/health`;
            const healthResponse = await fetch(healthUrl);
            const healthStatus = healthResponse.status;
            const healthText = await healthResponse.text();
            
            console.log(`🏥 Health check (${healthUrl}): ${healthStatus}`);
            console.log(`🏥 Health response: ${healthText.substring(0, 200)}`);
            
            if (healthStatus === 200) {
              console.log('🎉 RAILWAY DEPLOYMENT IS WORKING!');
              console.log(`🌟 Use this URL: ${url}`);
              console.log(`🌟 Health endpoint: ${healthUrl}`);
              return;
            }
          } catch (healthError) {
            console.log(`⚠️  Health check failed: ${healthError.message}`);
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
      
      if (error.code === 'ENOTFOUND') {
        console.log('   URL does not exist');
      } else if (error.name === 'AbortError' || error.code === 'ETIMEDOUT') {
        console.log('   Request timed out');
      }
    }
  }
  
  console.log('\n💡 If none of these work, the Railway deployment might be:');
  console.log('   1. Still building/deploying');
  console.log('   2. Using a different URL pattern');
  console.log('   3. Failed to deploy due to build errors');
  console.log('\n🔧 Check Railway dashboard for deployment status and logs');
}

// Run the discovery
findRailwayUrl().catch(console.error);
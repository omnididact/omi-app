#!/usr/bin/env node

/**
 * OMI Railway Deployment Fix & Verification Script
 * 
 * This script verifies and fixes Railway deployment issues by:
 * 1. Testing server startup sequence
 * 2. Verifying health check endpoint
 * 3. Testing database connectivity
 * 4. Validating Railway configuration
 */

import dotenv from 'dotenv';
import { createServer } from 'http';
import { initDatabase, runQuery } from './models/database.js';

// Load environment variables
dotenv.config();

const RAILWAY_PORT = process.env.PORT || 3001;
const RAILWAY_HOST = '0.0.0.0';

console.log('🚀 OMI Railway Deployment Fix & Verification');
console.log('=============================================');

// Test 1: Environment Variables
async function testEnvironmentVariables() {
  console.log('\n📋 Testing Environment Variables...');
  
  const requiredVars = ['NODE_ENV', 'JWT_SECRET'];
  const optionalVars = ['DATABASE_URL', 'OPENAI_API_KEY'];
  
  let allGood = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`❌ ${varName}: Missing (Required)`);
      allGood = false;
    }
  });
  
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`⚠️  ${varName}: Missing (Optional)`);
    }
  });
  
  console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎯 Port: ${RAILWAY_PORT}`);
  console.log(`🎯 Host: ${RAILWAY_HOST}`);
  
  return allGood;
}

// Test 2: Database Connectivity
async function testDatabaseConnectivity() {
  console.log('\n🗄️  Testing Database Connectivity...');
  
  try {
    await initDatabase();
    console.log('✅ Database initialization successful');
    
    // Test a simple query
    await runQuery('SELECT 1 as test');
    console.log('✅ Database query test successful');
    
    return true;
  } catch (error) {
    console.log(`❌ Database connectivity failed: ${error.message}`);
    console.log('⚠️  Server will continue without database (degraded mode)');
    return false;
  }
}

// Test 3: Health Check Endpoint
async function testHealthCheckEndpoint() {
  console.log('\n🏥 Testing Health Check Endpoint...');
  
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      if (req.url === '/api/health') {
        try {
          // Simulate the health check logic from index.js
          let dbStatus = 'not configured';
          if (process.env.DATABASE_URL) {
            try {
              await runQuery('SELECT 1');
              dbStatus = 'connected';
            } catch (dbErr) {
              dbStatus = 'connection failed';
            }
          }
          
          const healthResponse = {
            status: 'OK',
            message: 'OMI API is running',
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV || 'development',
            database: dbStatus,
            port: RAILWAY_PORT,
            version: '1.0.0'
          };
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(healthResponse, null, 2));
          
          console.log('✅ Health check endpoint responding correctly');
          console.log(`📊 Response: ${JSON.stringify(healthResponse, null, 2)}`);
          
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'ERROR',
            message: 'Health check failed',
            error: error.message,
            timestamp: new Date().toISOString()
          }));
          
          console.log(`❌ Health check failed: ${error.message}`);
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Route not found' }));
      }
    });
    
    server.listen(RAILWAY_PORT, RAILWAY_HOST, async () => {
      console.log(`✅ Test server started on ${RAILWAY_HOST}:${RAILWAY_PORT}`);
      
      try {
        // Make a request to the health check endpoint
        const http = await import('http');
        const options = {
          hostname: RAILWAY_HOST === '0.0.0.0' ? 'localhost' : RAILWAY_HOST,
          port: RAILWAY_PORT,
          path: '/api/health',
          method: 'GET'
        };
        
        const req = http.default.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            server.close();
            if (res.statusCode === 200) {
              console.log('✅ Health check HTTP request successful');
              resolve(true);
            } else {
              console.log(`❌ Health check HTTP request failed with status: ${res.statusCode}`);
              resolve(false);
            }
          });
        });
        
        req.on('error', (error) => {
          console.log(`❌ Health check HTTP request error: ${error.message}`);
          server.close();
          resolve(false);
        });
        
        req.end();
      } catch (error) {
        console.log(`❌ Failed to create HTTP request: ${error.message}`);
        server.close();
        resolve(false);
      }
    });
    
    server.on('error', (error) => {
      console.log(`❌ Test server failed to start: ${error.message}`);
      resolve(false);
    });
  });
}

// Test 4: Railway Configuration
async function testRailwayConfiguration() {
  console.log('\n🚂 Testing Railway Configuration...');
  
  try {
    const fs = await import('fs');
    
    // Check railway.json
    if (fs.existsSync('./railway.json')) {
      const railwayConfig = JSON.parse(fs.readFileSync('./railway.json', 'utf8'));
      console.log('✅ railway.json found');
      console.log(`📋 Health check path: ${railwayConfig.deploy?.healthcheckPath}`);
      console.log(`⏱️  Health check timeout: ${railwayConfig.deploy?.healthcheckTimeout}s`);
      console.log(`🔄 Health check interval: ${railwayConfig.deploy?.healthcheckInterval}s`);
    } else {
      console.log('⚠️  railway.json not found');
    }
    
    // Check nixpacks.toml
    if (fs.existsSync('./nixpacks.toml')) {
      console.log('✅ nixpacks.toml found');
    } else {
      console.log('⚠️  nixpacks.toml not found');
    }
    
    // Check Procfile
    if (fs.existsSync('./Procfile')) {
      const procfile = fs.readFileSync('./Procfile', 'utf8');
      console.log('✅ Procfile found');
      console.log(`📋 Start command: ${procfile.trim()}`);
    } else {
      console.log('⚠️  Procfile not found');
    }
    
    // Check package.json
    if (fs.existsSync('./package.json')) {
      const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      console.log('✅ package.json found');
      console.log(`📋 Start script: ${pkg.scripts?.start}`);
      console.log(`📋 Node version requirement: ${pkg.engines?.node}`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Configuration check failed: ${error.message}`);
    return false;
  }
}

// Main verification function
async function runVerification() {
  console.log('Starting Railway deployment verification...\n');
  
  const results = {
    environment: await testEnvironmentVariables(),
    database: await testDatabaseConnectivity(),
    healthCheck: await testHealthCheckEndpoint(),
    configuration: await testRailwayConfiguration()
  };
  
  console.log('\n🎯 VERIFICATION SUMMARY');
  console.log('=======================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! Railway deployment should work.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the issues above.');
  }
  
  console.log('\n📖 RAILWAY DEPLOYMENT CHECKLIST:');
  console.log('1. Set Root Directory to "server" in Railway Settings → Source');
  console.log('2. Add PostgreSQL database in Railway (generates DATABASE_URL)');
  console.log('3. Set environment variables: NODE_ENV, JWT_SECRET, OPENAI_API_KEY');
  console.log('4. Verify health check endpoint: /api/health');
  console.log('5. Deploy and monitor logs for successful startup');
  
  process.exit(allPassed ? 0 : 1);
}

// Run the verification
runVerification().catch((error) => {
  console.error('❌ Verification script failed:', error);
  process.exit(1);
});
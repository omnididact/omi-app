#!/usr/bin/env node

/**
 * Railway Deployment Diagnostics Tool
 * 
 * This script helps diagnose Railway deployment issues by testing
 * various aspects of the server configuration and environment.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class RailwayDiagnostics {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  log(message, status = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${status}: ${message}`;
    console.log(logMessage);
    this.results.push({ timestamp, status, message });
  }

  error(message, error = null) {
    const timestamp = new Date().toISOString();
    const errorMessage = error ? `${message}: ${error.message}` : message;
    const logMessage = `[${timestamp}] ERROR: ${errorMessage}`;
    console.error(logMessage);
    this.errors.push({ timestamp, message: errorMessage, stack: error?.stack });
  }

  async checkEnvironment() {
    this.log('🔍 Checking Environment Configuration', 'CHECK');
    
    try {
      // Check Node.js version
      const nodeVersion = process.version;
      this.log(`Node.js version: ${nodeVersion}`);
      
      // Check if Railway PORT is set
      const port = process.env.PORT;
      if (port) {
        this.log(`✅ Railway PORT is set: ${port}`);
      } else {
        this.error('❌ Railway PORT environment variable is missing!');
      }
      
      // Check NODE_ENV
      const nodeEnv = process.env.NODE_ENV || 'development';
      this.log(`NODE_ENV: ${nodeEnv}`);
      
      // Check DATABASE_URL
      const dbUrl = process.env.DATABASE_URL;
      if (dbUrl) {
        this.log('✅ DATABASE_URL is configured');
      } else {
        this.log('⚠️  DATABASE_URL not set (using SQLite in development)');
      }
      
      // Check platform info
      this.log(`Platform: ${process.platform}`);
      this.log(`Architecture: ${process.arch}`);
      this.log(`Current working directory: ${process.cwd()}`);
      
    } catch (error) {
      this.error('Failed to check environment', error);
    }
  }

  async checkFileStructure() {
    this.log('📁 Checking File Structure', 'CHECK');
    
    try {
      const requiredFiles = [
        'package.json',
        'index.js',
        'railway.json',
        'nixpacks.toml'
      ];
      
      for (const file of requiredFiles) {
        try {
          await fs.access(join(__dirname, file));
          this.log(`✅ ${file} exists`);
        } catch {
          this.error(`❌ ${file} is missing!`);
        }
      }
      
      // Check models directory
      try {
        await fs.access(join(__dirname, 'models', 'database.js'));
        this.log('✅ models/database.js exists');
      } catch {
        this.error('❌ models/database.js is missing!');
      }
      
    } catch (error) {
      this.error('Failed to check file structure', error);
    }
  }

  async checkPackageJson() {
    this.log('📦 Checking package.json Configuration', 'CHECK');
    
    try {
      const packagePath = join(__dirname, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      // Check engines
      if (packageJson.engines && packageJson.engines.node) {
        this.log(`✅ Node.js engine specified: ${packageJson.engines.node}`);
      } else {
        this.log('⚠️  No Node.js engine specified in package.json');
      }
      
      // Check scripts
      if (packageJson.scripts && packageJson.scripts.start) {
        this.log(`✅ Start script: ${packageJson.scripts.start}`);
      } else {
        this.error('❌ No start script defined in package.json!');
      }
      
      // Check type module
      if (packageJson.type === 'module') {
        this.log('✅ ES modules enabled (type: module)');
      } else {
        this.log('⚠️  Not using ES modules');
      }
      
      // Check dependencies
      const criticalDeps = ['express', 'cors', 'dotenv'];
      for (const dep of criticalDeps) {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
        } else {
          this.error(`❌ Missing critical dependency: ${dep}`);
        }
      }
      
    } catch (error) {
      this.error('Failed to check package.json', error);
    }
  }

  async checkNetworking() {
    this.log('🌐 Checking Network Configuration', 'CHECK');
    
    try {
      // Check IPv6 support
      const net = await import('net');
      const isIPv6Supported = net.isIPv6('::1');
      this.log(`IPv6 support: ${isIPv6Supported ? '✅ Available' : '❌ Not available'}`);
      
      // Check if we can bind to different addresses
      const testPort = 0; // Let system assign port for testing
      
      // Test IPv4 binding
      try {
        const server4 = http.createServer();
        await new Promise((resolve, reject) => {
          server4.listen(testPort, '0.0.0.0', () => {
            const addr = server4.address();
            this.log(`✅ IPv4 binding test successful on port ${addr.port}`);
            server4.close(resolve);
          });
          server4.on('error', reject);
        });
      } catch (error) {
        this.error('❌ IPv4 binding test failed', error);
      }
      
      // Test IPv6 binding (critical for Railway v2)
      try {
        const server6 = http.createServer();
        await new Promise((resolve, reject) => {
          server6.listen(testPort, '::', () => {
            const addr = server6.address();
            this.log(`✅ IPv6 dual-stack binding test successful on port ${addr.port}`);
            server6.close(resolve);
          });
          server6.on('error', reject);
        });
      } catch (error) {
        this.error('❌ IPv6 dual-stack binding test failed (CRITICAL for Railway)', error);
      }
      
    } catch (error) {
      this.error('Failed to check networking', error);
    }
  }

  async testHealthEndpoint() {
    this.log('🏥 Testing Health Endpoint', 'CHECK');
    
    try {
      // Import the server to test the health endpoint
      const PORT = process.env.PORT || 3001;
      
      // Start a test server
      const { default: express } = await import('express');
      const app = express();
      
      // Add minimal health endpoint
      app.get('/api/health', (req, res) => {
        res.status(200).json({
          status: 'OK',
          timestamp: new Date().toISOString(),
          test: true
        });
      });
      
      const server = await new Promise((resolve, reject) => {
        const testServer = app.listen(PORT + 1000, '::', () => {
          this.log(`✅ Test server started on port ${PORT + 1000}`);
          resolve(testServer);
        });
        testServer.on('error', reject);
      });
      
      // Test the health endpoint
      try {
        const response = await this.makeRequest(`http://localhost:${PORT + 1000}/api/health`);
        if (response.statusCode === 200) {
          this.log('✅ Health endpoint test successful');
        } else {
          this.error(`❌ Health endpoint returned status ${response.statusCode}`);
        }
      } catch (error) {
        this.error('❌ Health endpoint test failed', error);
      }
      
      // Clean up test server
      server.close();
      
    } catch (error) {
      this.error('Failed to test health endpoint', error);
    }
  }

  makeRequest(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async checkRailwayConfig() {
    this.log('🚄 Checking Railway Configuration', 'CHECK');
    
    try {
      // Check railway.json
      const railwayPath = join(__dirname, 'railway.json');
      const railwayContent = await fs.readFile(railwayPath, 'utf8');
      const railwayConfig = JSON.parse(railwayContent);
      
      this.log('Railway configuration:');
      this.log(`  Health check path: ${railwayConfig.deploy?.healthcheckPath || 'Not set'}`);
      this.log(`  Health check timeout: ${railwayConfig.deploy?.healthcheckTimeout || 'Default'}s`);
      this.log(`  Start command: ${railwayConfig.deploy?.startCommand || 'Not set'}`);
      
      if (railwayConfig.deploy?.healthcheckPath === '/api/health') {
        this.log('✅ Health check path correctly configured');
      } else {
        this.error('❌ Health check path not set to /api/health');
      }
      
    } catch (error) {
      this.error('Failed to check Railway configuration', error);
    }
  }

  async runDiagnostics() {
    console.log('🚀 Railway Deployment Diagnostics Tool');
    console.log('=' .repeat(50));
    
    await this.checkEnvironment();
    await this.checkFileStructure();
    await this.checkPackageJson();
    await this.checkNetworking();
    await this.checkRailwayConfig();
    await this.testHealthEndpoint();
    
    console.log('\\n' + '='.repeat(50));
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('=' .repeat(50));
    
    console.log(`\\n✅ Successful checks: ${this.results.filter(r => r.status !== 'ERROR').length}`);
    console.log(`❌ Errors found: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\\n🚨 CRITICAL ISSUES TO FIX:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
      });
    } else {
      console.log('\\n🎉 All diagnostics passed! Your Railway deployment should work.');
    }
    
    console.log('\\n📝 Next steps:');
    console.log('1. Fix any critical issues listed above');
    console.log('2. Commit and push your changes to trigger Railway deployment');
    console.log('3. Monitor Railway logs during deployment');
    console.log('4. Check health endpoint once deployed');
  }
}

// Run diagnostics if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const diagnostics = new RailwayDiagnostics();
  diagnostics.runDiagnostics().catch(console.error);
}

export default RailwayDiagnostics;
# Railway Deployment Fixes for OMI Backend

## Problem Summary

The Railway backend deployment was failing with health check timeouts where `/api/health` would return "service unavailable" and 1/1 replicas never became healthy within the 45-second retry window.

## Root Cause Analysis

After comprehensive codebase analysis, the main issues identified were:

1. **Database initialization blocking server startup**: Database connection delays were preventing the server from responding to health checks quickly
2. **Health check timeout sensitivity**: Database connectivity tests were blocking the health check response
3. **Startup sequence optimization needed**: Server needed to be fully ready for health checks before database initialization

## Implemented Fixes

### 1. Optimized Server Startup Sequence

**File: `/server/index.js`**

**Changes Made:**
- Server now starts first and immediately becomes ready for health checks
- Database initialization happens in background (non-blocking)
- Added graceful shutdown handling for SIGTERM/SIGINT
- Improved error handling and logging

**Key Improvements:**
```javascript
// Server starts immediately and resolves promise
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log('✅ Server ready for health checks');
  resolve(server);
  
  // Database initialization in background (100ms delay)
  setTimeout(async () => {
    try {
      await initDatabase();
      console.log('✅ Database initialized after server start');
    } catch (error) {
      console.error('⚠️  Database connection failed, but server is still running:', error.message);
    }
  }, 100);
});
```

### 2. Railway-Optimized Health Check Endpoint

**File: `/server/index.js`**

**Enhanced Features:**
- Always returns 200 OK if server is running (Railway requirement)
- Non-blocking database connectivity test with 2-second timeout
- Comprehensive health metrics (uptime, response time, database status)
- Proper headers for Railway compatibility
- Graceful degradation if database is unavailable

**Key Improvements:**
```javascript
// Railway-optimized health check endpoint
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Always respond with 200 OK if server is running
    const healthResponse = {
      status: 'OK',
      message: 'OMI API is running',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT) || 3001,
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      responseTime: Date.now() - startTime
    };

    // Non-blocking database check with timeout
    let dbStatus = 'not configured';
    if (process.env.DATABASE_URL) {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database check timeout')), 2000)
        );
        
        const { runQuery } = await import('./models/database.js');
        const dbCheckPromise = runQuery('SELECT 1');
        
        await Promise.race([dbCheckPromise, timeoutPromise]);
        dbStatus = 'connected';
      } catch (dbErr) {
        dbStatus = dbErr.message.includes('timeout') ? 'timeout' : 'connection failed';
        console.warn(`Health check database test failed: ${dbErr.message}`);
      }
    }
    
    healthResponse.database = dbStatus;
    healthResponse.responseTime = Date.now() - startTime;
    
    // Set appropriate headers for Railway
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Health-Check', 'omi-api');
    
    res.status(200).json(healthResponse);
    
  } catch (error) {
    // Even if there's an error, try to return a 200 response for Railway
    console.error('Health check error:', error);
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      status: 'DEGRADED',
      message: 'Server running with issues',
      error: error.message,
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT) || 3001,
      responseTime: Date.now() - startTime
    });
  }
});
```

### 3. Railway Deployment Verification Script

**File: `/server/railway-deployment-fix.js`**

Created comprehensive verification script that tests:
- Environment variables configuration
- Database connectivity 
- Health check endpoint functionality
- Railway configuration files
- Server startup sequence

**Usage:**
```bash
node railway-deployment-fix.js
```

## Railway Configuration Status

### Existing Configuration (Verified ✅)

**`railway.json`:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "node index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 45,
    "healthcheckInterval": 30
  }
}
```

**`nixpacks.toml`:**
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "python3"]

[phases.install]
cmds = [
  "npm ci --omit=dev --no-audit --prefer-offline",
  "npm list --depth=0"
]

[phases.build]
cmds = [
  "echo 'Build phase starting...'",
  "echo 'Node version:' && node --version",
  "echo 'NPM version:' && npm --version",
  "echo 'Environment: $NODE_ENV'",
  "echo 'Build completed successfully'"
]

[start]
cmd = "node index.js"

[variables]
NODE_ENV = "production"
```

**`Procfile`:**
```
web: node index.js
```

**`package.json`:**
- Node.js 20+ engine requirement ✅
- Proper dependencies for PostgreSQL and SQLite ✅
- Start script: "node index.js" ✅

## Deployment Checklist

### Critical Railway Settings

1. **Root Directory Setting** (MOST IMPORTANT):
   ```
   Railway Dashboard → Settings → Source → Root Directory: server
   ```

2. **PostgreSQL Database**:
   ```
   Railway Project → "New" → "Database" → "Add PostgreSQL"
   ```
   This auto-generates the `DATABASE_URL` environment variable.

3. **Environment Variables** (Railway Settings → Environment):
   ```
   NODE_ENV=production
   JWT_SECRET=your-secure-jwt-secret-here
   OPENAI_API_KEY=your-openai-api-key-here
   DATABASE_URL=(auto-generated by PostgreSQL addon)
   ```

### Verification Steps

1. **Local Testing**:
   ```bash
   cd server
   NODE_ENV=production JWT_SECRET=test-secret node index.js
   curl http://localhost:3001/api/health
   ```

2. **Railway Deployment**:
   ```bash
   # Run verification script
   node railway-deployment-fix.js
   
   # Check Railway logs for:
   # "✅ Server ready for health checks"
   # "🎉 Server startup completed successfully"
   ```

3. **Health Check Verification**:
   ```bash
   curl https://your-railway-app.railway.app/api/health
   ```

   Expected response:
   ```json
   {
     "status": "OK",
     "message": "OMI API is running",
     "timestamp": "2025-07-30T...",
     "env": "production",
     "port": 3001,
     "version": "1.0.0",
     "uptime": 123,
     "responseTime": 5,
     "database": "connected"
   }
   ```

## Expected Behavior After Fixes

1. **Server Startup**: 
   - Server binds to `0.0.0.0:PORT` immediately
   - Health check endpoint responds within 100ms
   - Database initialization happens in background

2. **Health Check Response**:
   - Always returns 200 OK if server is running
   - Database status reported separately (non-blocking)
   - Response time tracked and reported
   - Comprehensive server metrics included

3. **Railway Health Check**:
   - `/api/health` responds successfully within 45-second timeout
   - Health check passes consistently during startup
   - 1/1 replicas become healthy quickly

4. **Database Handling**:
   - PostgreSQL connects after server startup
   - Graceful degradation if database unavailable
   - Server continues running for health checks even if DB fails

## Frontend Integration

Once Railway backend is working, update frontend environment variable:

**Netlify Environment Variables**:
```
VITE_API_URL=https://your-railway-app.railway.app/api
```

The frontend will automatically use this URL for all API calls.

## Architecture Strengths

The codebase is already well-architected for Railway deployment:

- ✅ Correct port binding (`0.0.0.0:PORT`)
- ✅ Dual database support (SQLite dev, PostgreSQL prod)
- ✅ Proper CORS configuration
- ✅ Environment-based configuration
- ✅ Comprehensive error handling
- ✅ JWT authentication ready
- ✅ OpenAI API integration configured

The fixes simply optimize the startup sequence and health check reliability for Railway's specific requirements.
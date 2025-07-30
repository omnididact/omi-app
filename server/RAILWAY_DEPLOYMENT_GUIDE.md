# Railway Deployment Guide - Health Check Troubleshooting

## 🚨 Health Check Failure Analysis

The Railway health check failing indicates that Railway cannot reach your `/api/health` endpoint within the timeout period. This comprehensive guide will help you diagnose and fix the issue.

## 🔍 Step 1: Run Diagnostics

First, run our diagnostic tool to identify potential issues:

```bash
cd server
node railway-deployment-diagnostics.js
```

This will check:
- Environment configuration
- File structure
- Package.json setup
- Network binding capabilities
- Health endpoint functionality
- Railway configuration

## 🛠️ Step 2: Critical Fix Checklist

### ✅ Port Configuration
- **Issue**: Server not binding to Railway's PORT variable
- **Fix**: Ensure you're using `process.env.PORT`
```javascript
const PORT = process.env.PORT || 3001;
```

### ✅ IPv6 Dual-Stack Binding (CRITICAL)
- **Issue**: Railway v2 runtime requires IPv6 compatibility
- **Fix**: Bind to `::` in production
```javascript
const bindAddress = process.env.NODE_ENV === 'production' ? '::' : '0.0.0.0';
app.listen(PORT, bindAddress, callback);
```

### ✅ Health Check Endpoint
- **Issue**: Health endpoint not responding with 200 status
- **Fix**: Ensure `/api/health` always returns 200
```javascript
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});
```

### ✅ Server Startup Order
- **Issue**: Database initialization blocking server startup
- **Fix**: Start server first, initialize database after
```javascript
const server = app.listen(PORT, bindAddress, () => {
  console.log('Server ready for health checks');
  
  // Initialize database after server is listening
  setTimeout(initDatabase, 100);
});
```

## 📋 Step 3: Railway Configuration Review

### railway.json
```json
{
  "deploy": {
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 60,
    "healthcheckInterval": 10
  }
}
```

### nixpacks.toml
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "python3"]

[start]
cmd = "node index.js"

[variables]
NODE_ENV = "production"
```

### package.json
```json
{
  "scripts": {
    "start": "node index.js"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "type": "module"
}
```

## 🚀 Step 4: Deployment Process

### 4.1 Pre-deployment Checklist
- [ ] All files committed to git
- [ ] Diagnostic tool shows no critical errors
- [ ] Health endpoint tested locally
- [ ] Environment variables configured in Railway dashboard

### 4.2 Deploy Command
```bash
# From the server directory
git add .
git commit -m "Fix Railway health check configuration"
git push origin main
```

### 4.3 Monitor Deployment
1. Go to Railway dashboard
2. Watch build logs for errors
3. Monitor health check attempts
4. Check server startup logs

## 🔧 Step 5: Common Issues and Solutions

### Issue 1: "service unavailable" Error
**Symptoms**: Health check returns service unavailable
**Causes**:
- Server not started
- Wrong port binding
- Process crashed during startup

**Solutions**:
1. Check Railway logs for startup errors
2. Verify PORT environment variable is set
3. Test IPv6 binding locally
4. Add extensive logging to startup process

### Issue 2: Health Check Timeout
**Symptoms**: Health check times out after 45-60 seconds
**Causes**:
- Database initialization taking too long
- Server not listening on correct address
- Health endpoint blocked by slow operations

**Solutions**:
1. Move database init to background
2. Use dual-stack binding (::)
3. Make health check endpoint ultra-lightweight
4. Increase timeout in railway.json

### Issue 3: Build Success but Runtime Failure
**Symptoms**: Build completes but health checks fail
**Causes**:
- Missing runtime dependencies
- Environment variable issues
- File permission problems

**Solutions**:
1. Check all dependencies in package.json
2. Verify environment variables in Railway dashboard
3. Test server startup locally with production settings

## 🧪 Step 6: Local Testing

### Test IPv6 Binding
```javascript
// test-ipv6.js
import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'OK', ipv6: true }));
});

server.listen(3001, '::', () => {
  console.log('IPv6 server running on [::]:3001');
  console.log('Test with: curl http://localhost:3001');
});
```

### Test Health Endpoint
```bash
# Test health endpoint locally
curl -v http://localhost:3001/api/health

# Expected response:
# HTTP/1.1 200 OK
# {"status":"OK","timestamp":"..."}
```

## 📊 Step 7: Railway Dashboard Configuration

### Environment Variables
Set these in Railway dashboard:
- `NODE_ENV=production`
- `DATABASE_URL=${{Postgres.DATABASE_URL}}` (if using database)
- Custom variables as needed

### Service Settings
1. **Public Networking**: Must be enabled
2. **Health Check**: Path set to `/api/health`
3. **Port**: Let Railway auto-assign (don't override)

## 🚨 Step 8: Emergency Debugging

If health checks still fail after following all steps:

### 1. Minimal Test Deployment
Create a minimal server that only responds to health checks:

```javascript
// minimal-test.js
import express from 'express';
const app = express();
const PORT = process.env.PORT || 3001;

app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV 
  });
});

app.listen(PORT, '::', () => {
  console.log(`Minimal test server on [::]:${PORT}`);
});
```

### 2. Enable Maximum Logging
Add this to your server startup:

```javascript
// Log every aspect of server startup
console.log('=== RAILWAY DEPLOYMENT DEBUG ===');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current directory:', process.cwd());
console.log('Memory usage:', process.memoryUsage());
console.log('=====================================');
```

### 3. Check Railway Logs
1. Go to Railway dashboard
2. Select your service
3. Click "Deployments"
4. Click on the failed deployment
5. Review "Build Logs" and "Deploy Logs"

### 4. Test with curl
Once deployed, test externally:
```bash
curl -v https://your-railway-domain.railway.app/api/health
```

## ✅ Step 9: Success Verification

When health checks pass, you should see:
1. Railway deployment shows "DEPLOYED"
2. Health endpoint returns 200 status
3. Server logs show "Health check successful"
4. Application is accessible via Railway URL

## 🆘 Emergency Contact

If all else fails:
1. Check Railway Status page for platform issues
2. Contact Railway support with deployment logs
3. Revert to last known working configuration
4. Consider using Railway's starter templates as reference

---

**Remember**: Railway health checks are performed only during deployment to ensure your service is ready. Once deployed successfully, Railway routes traffic to your application.
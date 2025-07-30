# Frontend-Backend Connection Fix Guide

## Problem Summary
The Netlify frontend is showing a blank page because it cannot connect to the Railway backend at `https://omi-app-production.up.railway.app`.

## Root Causes Identified

1. **Missing Environment Variables**: Frontend wasn't configured with the Railway backend URL
2. **CORS Configuration**: Backend CORS settings may not include all required domains
3. **Railway Deployment Issues**: Backend returning 502 errors
4. **Build Configuration**: Frontend build process not using production API URL

## Fixes Applied

### 1. Frontend Configuration Files Created

#### `.env.production`
```env
VITE_API_URL=https://omi-app-production.up.railway.app/api
NODE_ENV=production
```

#### `netlify.toml`
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  VITE_API_URL = "https://omi-app-production.up.railway.app/api"
  NODE_ENV = "production"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2. Vite Configuration Updated

- Modified to conditionally use proxy only in development
- Production builds now use environment variables directly

### 3. Backend CORS Configuration

Current CORS origins in `server/index.js`:
```javascript
origin: [
  'https://omi.symmetrycinema.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
]
```

## Deployment Steps

### Step 1: Fix Railway Backend (If 502 Errors)

1. **Check Railway Dashboard**
   - Go to https://railway.app/dashboard
   - Find your `omi-backend` service
   - Check deployment status and logs

2. **Redeploy Railway Service**
   ```bash
   # Option 1: Via Railway CLI
   cd server
   railway deploy
   
   # Option 2: Via Dashboard
   # Click "Deploy Latest" in Railway dashboard
   ```

3. **Verify Railway Backend**
   ```bash
   curl https://omi-app-production.up.railway.app/api/health
   ```

### Step 2: Update Netlify Environment Variables

1. **In Netlify Dashboard**
   - Go to Site settings > Environment variables
   - Add: `VITE_API_URL = https://omi-app-production.up.railway.app/api`

2. **Redeploy Netlify Site**
   - Go to Deploys tab
   - Click "Trigger deploy" > "Deploy site"

### Step 3: Verify Connection

1. **Test Backend Directly**
   ```bash
   curl https://omi-app-production.up.railway.app/api/health
   ```

2. **Check Frontend Console**
   - Open browser dev tools on your Netlify site
   - Look for API calls in Network tab
   - Check console for CORS or connection errors

## Testing Tools Created

### 1. `test-railway-connection.html`
- Browser-based testing tool
- Tests health endpoint, CORS, and API connectivity
- Open in browser to run tests

### 2. `test-backend-locally.js`
- Node.js testing script
- Comprehensive endpoint testing
- Run with: `node test-backend-locally.js`

## Expected Results

### Backend Working
```json
{
  "status": "OK",
  "message": "OMI API is running",
  "timestamp": "2025-07-30T02:45:49.123Z",
  "env": "production",
  "port": 3001
}
```

### Frontend Console (When Working)
```
🔧 API Configuration:
  - VITE_API_URL: https://omi-app-production.up.railway.app/api
  - API_BASE_URL: https://omi-app-production.up.railway.app/api
  - Environment: production
```

## Troubleshooting

### If Railway Returns 502
- Backend deployment failed
- Check Railway logs for startup errors
- Verify environment variables in Railway
- Redeploy with latest fixes

### If CORS Errors
- Add your Netlify domain to backend CORS origins
- Verify the domain matches exactly (including https://)
- Redeploy backend after CORS changes

### If Frontend Still Blank
- Check Netlify build logs
- Verify environment variables are set
- Check browser console for JavaScript errors
- Verify API calls are using correct URL

## Next Steps

1. **Test Railway Backend**: Verify it responds to health checks
2. **Update Netlify Env**: Set `VITE_API_URL` in Netlify dashboard
3. **Redeploy Frontend**: Trigger new Netlify deployment
4. **Test Connection**: Use provided testing tools to verify

The frontend should now successfully connect to the Railway backend once these steps are completed.
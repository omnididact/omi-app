# Quick Fix for Network Error

## Problem
Your frontend at `omi.symmetrycinema.com` is getting network errors because the backend is not deployed.

## Solution: Deploy Backend to Railway

### Step 1: Deploy Backend
1. **Go to [Railway.app](https://railway.app)**
2. **Sign up/Login** with GitHub
3. **Create new project** → "Deploy from GitHub repo"
4. **Select your repository** and set **Root Directory** to `server`
5. **Add these environment variables**:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   JWT_SECRET=random_secret_string_here
   CORS_ORIGIN=https://omi.symmetrycinema.com
   ```
6. **Deploy** - Railway will use the Dockerfile for reliable deployment

### Step 2: Get Your Backend URL
After deployment, Railway will give you a URL like:
`https://your-app-name.railway.app`

### Step 3: Update Frontend
1. **Go to your Netlify dashboard**
2. **Site settings** → **Environment variables**
3. **Add this variable**:
   - Key: `VITE_API_URL`
   - Value: `https://your-app-name.railway.app/api`
4. **Redeploy** your site

### Step 4: Test
1. **Visit** `omi.symmetrycinema.com`
2. **Try logging in** - should work now!
3. **Check browser console** for any remaining errors

## What Was Fixed
- ✅ **Database compatibility**: Switched from `better-sqlite3` to `sqlite3`
- ✅ **Node.js version**: Updated to require Node.js 20+
- ✅ **Async/await**: Fixed all database operations to be properly async
- ✅ **Dependencies**: Added missing `bcryptjs` and `jsonwebtoken`
- ✅ **Docker deployment**: Added Dockerfile for reliable Railway deployment
- ✅ **Build optimization**: Removed problematic postinstall script

## Alternative: Test Locally First
If you want to test before deploying:

```bash
cd server
./deploy.sh
```

This will test the server locally and show you the deployment steps.

## Troubleshooting
If you still get errors:
1. **Check Railway logs** for deployment issues
2. **Verify environment variables** are set correctly
3. **Test backend health**: Visit `https://your-backend-url.com/api/health`
4. **Check CORS**: Make sure your domain is in the allowed origins
5. **Docker build issues**: The new Dockerfile should resolve build problems

Your login should work perfectly once the backend is deployed! 🚀 
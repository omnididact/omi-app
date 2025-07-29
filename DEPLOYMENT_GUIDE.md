# OMI Deployment Guide

This guide will help you deploy both the frontend and backend of OMI to make it fully functional.

## Current Status

- ✅ **Frontend**: Deployed at `omi.symmetrycinema.com`
- ❌ **Backend**: Not deployed (causing network errors)

## Backend Deployment Options

### Option 1: Railway (Recommended - Easy & Free)

1. **Sign up** at [railway.app](https://railway.app)
2. **Create new project** from GitHub
3. **Connect your repository** and select the `server` folder
4. **Set environment variables**:
   ```
   PORT=3001
   OPENAI_API_KEY=your_openai_api_key
   JWT_SECRET=your_random_secret_key
   ```
5. **Deploy** - Railway will automatically build and deploy

### Option 2: Render (Free Tier Available)

1. **Sign up** at [render.com](https://render.com)
2. **Create new Web Service**
3. **Connect your GitHub repository**
4. **Configure**:
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Root Directory**: `server`
5. **Set environment variables** (same as above)
6. **Deploy**

### Option 3: Heroku (Paid)

1. **Install Heroku CLI**
2. **Login**: `heroku login`
3. **Create app**: `heroku create omi-backend`
4. **Set environment variables**:
   ```bash
   heroku config:set OPENAI_API_KEY=your_key
   heroku config:set JWT_SECRET=your_secret
   ```
5. **Deploy**: `git push heroku main`

## Frontend Configuration

Once your backend is deployed, update your frontend:

### Method 1: Environment Variable (Recommended)

1. **Add environment variable** to your Netlify deployment:
   - Go to Netlify dashboard
   - Site settings → Environment variables
   - Add: `VITE_API_URL=https://your-backend-url.com/api`

### Method 2: Direct Code Update

Update `src/api/client.js`:
```javascript
const API_BASE_URL = 'https://your-backend-url.com/api';
```

## Quick Deployment Steps

### Step 1: Deploy Backend (Railway)

1. **Go to** [railway.app](https://railway.app)
2. **Sign up/Login** with GitHub
3. **New Project** → Deploy from GitHub repo
4. **Select repository** and set root directory to `server`
5. **Add environment variables**:
   ```
   OPENAI_API_KEY=sk-your-openai-key
   JWT_SECRET=random-secret-string-here
   ```
6. **Deploy** and copy the generated URL

### Step 2: Update Frontend

1. **Go to** Netlify dashboard
2. **Site settings** → Environment variables
3. **Add variable**:
   - Key: `VITE_API_URL`
   - Value: `https://your-railway-url.railway.app/api`
4. **Redeploy** your site

### Step 3: Test

1. **Visit** `omi.symmetrycinema.com`
2. **Try logging in** - should work now!
3. **Check browser console** for any errors

## Environment Variables Reference

### Backend (.env file)
```env
PORT=3001
OPENAI_API_KEY=sk-your-openai-api-key
JWT_SECRET=your-random-secret-key
DATABASE_URL=./database.sqlite
CORS_ORIGIN=https://omi.symmetrycinema.com
```

### Frontend (Netlify Environment Variables)
```env
VITE_API_URL=https://your-backend-url.com/api
```

## Troubleshooting

### Network Error Still Appears

1. **Check backend URL** in browser console
2. **Verify backend is running** by visiting the health endpoint
3. **Check CORS settings** in backend
4. **Ensure environment variables** are set correctly

### CORS Errors

1. **Update CORS origin** in `server/index.js`
2. **Add your domain** to the allowed origins
3. **Redeploy backend**

### Authentication Issues

1. **Check JWT_SECRET** is set in backend
2. **Verify OpenAI API key** is valid
3. **Check database** is properly initialized

## Testing Your Deployment

### Backend Health Check
Visit: `https://your-backend-url.com/api/health`
Should return: `{"status":"OK","message":"OMI API is running"}`

### Frontend API Test
1. **Open browser console** on your site
2. **Look for** "Making request to: https://..." messages
3. **Check for** any error messages

## Security Notes

- ✅ **Use HTTPS** for all production URLs
- ✅ **Set strong JWT_SECRET** (random string)
- ✅ **Keep OpenAI API key** secure
- ✅ **Enable CORS** only for your domain
- ❌ **Don't commit** .env files to git

## Support

If you encounter issues:

1. **Check browser console** for error messages
2. **Verify backend health** endpoint
3. **Test API endpoints** directly
4. **Check deployment logs** in your hosting platform

---

Once deployed, your OMI app will be fully functional with authentication, AI processing, and data persistence! 🚀 
# 🔧 Fix Railway Backend Deployment

## 🚨 Current Problem
Your Railway service at `omi-app-production.up.railway.app` is serving React HTML instead of your Node.js API.

## ✅ Solution: Configure Railway for Backend Only

### Step 1: Check Railway Service Settings
1. Go to Railway Dashboard → Your Service
2. Click **Settings** → **Source**
3. Look for **"Root Directory"** setting

### Step 2: Set Root Directory to Server
**This is the key fix!**
- Set **Root Directory** to: `server`
- This tells Railway to deploy only the backend code

### Step 3: Verify Build Settings
In Railway Settings, confirm:
```
Root Directory: server
Build Command: npm ci
Start Command: node index.js
```

### Step 4: Redeploy
1. Save the settings
2. Go to **Deployments** tab
3. Click **Deploy Latest** or trigger a new deployment

## 🎯 Expected Result
After fixing, `https://omi-app-production.up.railway.app/api/health` should return:
```json
{"status": "OK", "message": "OMI API is running"}
```

## 🔍 Alternative: Check What's Currently Deployed
Look at your recent deployment logs in Railway:
- Do you see React/Vite build commands? (❌ Wrong - that's frontend)
- Do you see npm ci from server directory? (✅ Correct - that's backend)

## 📱 Once Backend is Fixed
Your Netlify frontend will need to use this Railway URL:
```javascript
const API_URL = 'https://omi-app-production.up.railway.app/api'
```

---

**The root cause**: Railway is deploying your entire repo instead of just the `server/` directory!
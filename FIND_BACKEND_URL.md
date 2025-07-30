# 🔍 Find Your Backend URL in Railway

## Step 1: Open Railway Dashboard
Go to: https://railway.app/dashboard

## Step 2: Look for Your Services
You should see **3 services** in your project:
1. **PostgreSQL** (database) ✅ 
2. **Frontend/React** (shows HTML when you visit) ✅
3. **Backend/API** (Node.js/Express) ❓ **← We need this one!**

## Step 3: Identify the Backend Service
The backend service will have:
- **Language**: Node.js
- **Framework**: Shows "Express" or similar
- **Port**: Usually 3001 or similar
- **Build**: Uses `npm ci` or `npm install`

## Step 4: Get the Public URL
1. Click on the **backend service** (not PostgreSQL, not frontend)
2. Go to **Settings** → **Networking**
3. Copy the **Public Domain** URL
4. It should look like: `https://something-production.up.railway.app`

## Step 5: Test the URL
The backend URL + `/api/health` should return JSON:
```json
{"status":"OK","message":"OMI API is running"}
```

## 🚨 If You Only See 2 Services

If you only see PostgreSQL + Frontend, then your backend might not be deployed separately. In that case:

1. **Check if backend is in the same service as frontend**
2. **Or you might need to deploy the backend separately**

## 🎯 What to Look For

**Backend Service Indicators:**
- Shows "Node.js" as runtime
- Has environment variables like `JWT_SECRET`, `OPENAI_API_KEY`
- Build logs show npm commands
- Starts with something like "🚀 OMI API server running"

**NOT the Backend:**
- PostgreSQL (database)
- Shows HTML/React content when visited
- Build shows Vite/React commands

## 📝 Tell Me What You See

Please check your Railway dashboard and tell me:
1. How many services do you see?
2. What are their names?
3. Which one shows Node.js/Express?

Then I can help you get the right URL!
# Railway Setup - Step by Step Guide

## 🚨 IMPORTANT: Follow these steps in order!

### Step 1: Open Railway Dashboard
1. Go to https://railway.app/dashboard
2. Find your project (should show recent deployment from GitHub push)

### Step 2: Add PostgreSQL Database
1. In your project, click the "+ New" button
2. Select "Database" 
3. Choose "Add PostgreSQL"
4. Wait for PostgreSQL to provision (takes ~30 seconds)

### Step 3: Configure Environment Variables
1. Click on your main service (not the PostgreSQL one)
2. Go to "Variables" tab
3. Add these variables (click "Add Variable" for each):

```
NODE_ENV=production
JWT_SECRET=your-secret-key-here-make-it-long-and-random
OPENAI_API_KEY=your-openai-api-key
```

**For JWT_SECRET**, use something like this (or generate your own):
```
JWT_SECRET=omi_jwt_secret_2024_secure_random_string_change_this
```

### Step 4: Verify Deployment
1. Go to "Deployments" tab
2. Look for the latest deployment (should be from your recent git push)
3. Click on the deployment to see logs
4. Look for these success messages:
   - "✅ PostgreSQL database initialized successfully"
   - "🚀 OMI API server running on port"

### Step 5: Get Your App URL
1. In the "Settings" tab
2. Under "Domains", you'll see your app URL
3. It will look like: `https://your-app-name.up.railway.app`

### Step 6: Test Your Deployment
Open a new terminal and run these commands:

```bash
# Test health endpoint (replace with your actual URL)
curl https://your-app-name.up.railway.app/api/health

# Expected response:
# {"status":"OK","message":"OMI API is running"}
```

### Step 7: Update Frontend Connection
1. In your frontend code, update the API URL to your Railway URL
2. The file to update is likely in `src/config` or similar

## 🚨 Troubleshooting

### If deployment fails:

1. **Check logs in Railway dashboard**
   - Look for red error messages
   - Common issues:
     - Missing environment variables
     - Database connection failed
     - Port binding issues

2. **If you see "OPENAI_API_KEY not set"**
   - Make sure you added all 3 environment variables
   - Click "Redeploy" after adding variables

3. **If you see database errors**
   - Make sure PostgreSQL is fully provisioned
   - Check that DATABASE_URL appears in variables (Railway adds this automatically)

4. **If health check fails**
   - Wait 2-3 minutes for full deployment
   - Check deployment logs for startup errors

## 📝 What Success Looks Like

When everything is working:
1. Deployment shows as "Success" in Railway
2. Logs show database initialized message
3. Health endpoint returns 200 OK
4. No error messages in logs

## 🎯 Next Steps After Success

1. Test all API endpoints
2. Update frontend to use Railway URL
3. Test the full application flow
4. Set up monitoring/alerts in Railway

---

**Need Help?**
- Railway Discord: https://discord.gg/railway
- Check deployment logs first
- Common issues are usually environment variables or database connection
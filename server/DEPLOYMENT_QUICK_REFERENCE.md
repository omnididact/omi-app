# Railway Deployment Quick Reference

## 🚨 Current Status
- Code pushed to GitHub ✅
- Waiting for Railway deployment
- PostgreSQL needs to be added in Railway dashboard

## 🎯 Immediate Actions Required

### 1. Add PostgreSQL in Railway
```
Railway Dashboard → Your Project → New → Database → Add PostgreSQL
```

### 2. Set Environment Variables
In Railway service settings, add:
```
NODE_ENV=production
JWT_SECRET=<generate-a-secure-random-string>
OPENAI_API_KEY=<your-openai-api-key>
```

Railway automatically provides:
```
DATABASE_URL=<postgresql-connection-string>
PORT=<assigned-port>
```

### 3. Monitor Deployment
```bash
# Watch deployment logs
railway logs

# Or use Railway CLI
railway up
```

## 🔍 Verify Deployment

### Quick Health Check
```bash
curl https://your-app.up.railway.app/api/health
```

### Run Full Verification
```bash
cd server
./verify-deployment.sh
```

### Test OpenAI Access Locally
```bash
cd server
node test-openai-access.js
```

## 🐛 Troubleshooting

### If deployment fails:

1. **Database Connection Error**
   - Ensure PostgreSQL service is added
   - Check DATABASE_URL is set

2. **OpenAI API Errors**
   - Verify API key is correct
   - Check model access permissions
   - Ensure billing is active

3. **Build Failures**
   - Check `railway logs` for errors
   - Verify Node.js version (needs >=20)

4. **Runtime Crashes**
   - Missing environment variables
   - Database initialization failed
   - Port binding issues

### Common Commands
```bash
# View logs
railway logs

# Restart service
railway restart

# View environment variables
railway variables

# Open in browser
railway open
```

## 📱 Frontend Connection
Update your frontend to use the Railway URL:
```javascript
// In your frontend config
const API_URL = 'https://your-app.up.railway.app/api'
```

## 🔐 Security Checklist
- [ ] JWT_SECRET is strong and unique
- [ ] OPENAI_API_KEY is kept secret
- [ ] CORS origins are properly configured
- [ ] Database has proper access controls

## 📞 Support
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check logs first: `railway logs`
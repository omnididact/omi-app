# Railway Deployment Guide

## Steps to Fix Railway Deployment

### 1. Add PostgreSQL Database in Railway (REQUIRED)

1. Go to your Railway project dashboard
2. Click "New" → "Database" → "Add PostgreSQL"
3. Railway will automatically create a `DATABASE_URL` environment variable

### 2. Set Environment Variables in Railway

Go to your service settings and add these environment variables:

```
NODE_ENV=production
JWT_SECRET=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key
```

### 3. Verify OpenAI API Access

Check that your OpenAI API key has access to:
- `whisper-1` (for audio transcription)
- `dall-e-3` (for image generation)
- `gpt-4-turbo-preview` (for text processing)

If not, you may need to:
- Add billing to your OpenAI account
- Request access to these models
- Or modify the code to use available models

### 4. Deploy the Application

The application is now configured to:
- Use PostgreSQL in production (when `DATABASE_URL` is present)
- Use SQLite for local development
- Handle database connections properly
- Use `npm ci` for deterministic builds

### 5. Monitor the Deployment

After deployment:
1. Check Railway logs: `railway logs`
2. Look for: "✅ PostgreSQL database initialized successfully"
3. Test the health endpoint: `https://your-app.railway.app/api/health`

## What Changed

1. **Database Configuration**: Updated to support both PostgreSQL (production) and SQLite (development)
2. **Build Process**: Using `npm ci` instead of `npm install` for production
3. **Health Checks**: Added proper health check endpoint
4. **Error Handling**: Better error messages for debugging

## Troubleshooting

If deployment still fails:

1. **Check Logs**: 
   ```bash
   railway logs
   ```

2. **Common Issues**:
   - Missing environment variables
   - Database connection errors
   - OpenAI API permission errors

3. **Database Issues**:
   - Ensure PostgreSQL service is running in Railway
   - Check `DATABASE_URL` is set correctly
   - Verify SSL connection settings

4. **API Issues**:
   - Verify OpenAI API key is valid
   - Check model access permissions
   - Look for rate limiting errors

## Next Steps

Once deployed successfully:
1. Test all API endpoints
2. Verify data persistence
3. Monitor performance
4. Set up proper logging
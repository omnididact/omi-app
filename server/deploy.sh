#!/bin/bash

echo "🚀 OMI Backend Deployment Script"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the server directory"
    exit 1
fi

# Check if required environment variables are set
echo "📋 Checking environment variables..."

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  Warning: OPENAI_API_KEY not set"
    echo "   You'll need to set this in Railway dashboard"
fi

if [ -z "$JWT_SECRET" ]; then
    echo "⚠️  Warning: JWT_SECRET not set"
    echo "   You'll need to set this in Railway dashboard"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Test the server locally
echo "🧪 Testing server locally..."
timeout 10s node index.js &
SERVER_PID=$!

sleep 3

# Test health endpoint
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Server is working locally!"
else
    echo "❌ Server failed to start locally"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

kill $SERVER_PID 2>/dev/null

echo ""
echo "🎉 Ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Go to Railway.app and create a new project"
echo "2. Connect your GitHub repository"
echo "3. Set root directory to 'server'"
echo "4. Add environment variables:"
echo "   - OPENAI_API_KEY=your_key_here"
echo "   - JWT_SECRET=random_secret_here"
echo "   - CORS_ORIGIN=https://omi.symmetrycinema.com"
echo "5. Deploy!"
echo ""
echo "After deployment, update your Netlify environment variable:"
echo "VITE_API_URL=https://your-railway-url.railway.app/api" 
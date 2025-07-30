#!/bin/bash

# Railway Deployment Verification Script
# This script helps verify Railway deployment requirements before pushing

echo "🚀 Railway Deployment Verification"
echo "=================================="

# Check if we're in the server directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the server directory"
    exit 1
fi

echo "✅ Running from server directory"

# Check required files
echo "📁 Checking required files..."
required_files=("package.json" "index.js" "railway.json" "nixpacks.toml")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file is missing!"
        exit 1
    fi
done

# Check if models/database.js exists
if [ -f "models/database.js" ]; then
    echo "✅ models/database.js exists"
else
    echo "❌ models/database.js is missing!"
    exit 1
fi

# Check package.json for required fields
echo "📦 Checking package.json..."
if grep -q '"start"' package.json; then
    echo "✅ Start script found"
else
    echo "❌ Start script missing in package.json"
    exit 1
fi

if grep -q '"type": "module"' package.json; then
    echo "✅ ES modules enabled"
else
    echo "⚠️  ES modules not enabled (might cause issues)"
fi

if grep -q '"engines"' package.json; then
    echo "✅ Node.js engine specified"
else
    echo "⚠️  Node.js engine not specified"
fi

# Check railway.json configuration
echo "🚄 Checking Railway configuration..."
if grep -q '"/api/health"' railway.json; then
    echo "✅ Health check path configured"
else
    echo "❌ Health check path not configured correctly"
    exit 1
fi

# Check if index.js has critical elements
echo "🔍 Checking index.js..."
if grep -q "process.env.PORT" index.js; then
    echo "✅ PORT environment variable used"
else
    echo "❌ PORT environment variable not used"
    exit 1
fi

if grep -q "/api/health" index.js; then
    echo "✅ Health check endpoint found"
else
    echo "❌ Health check endpoint not found"
    exit 1
fi

if grep -q "'::'\\|'0.0.0.0'" index.js; then
    echo "✅ Proper network binding found"
else
    echo "❌ Network binding might not be Railway-compatible"
    exit 1
fi

# Test local health endpoint
echo "🏥 Testing health endpoint locally..."
echo "Starting server for testing..."

# Start server in background
NODE_ENV=test PORT=3099 node index.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test health endpoint
if curl -s -f http://localhost:3099/api/health > /dev/null; then
    echo "✅ Health endpoint responds locally"
else
    echo "❌ Health endpoint not responding locally"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Clean up
kill $SERVER_PID 2>/dev/null
sleep 1

# Check git status
echo "📚 Checking git status..."
if git status --porcelain | grep -q .; then
    echo "⚠️  You have uncommitted changes. Consider committing them before deployment."
    git status --short
else
    echo "✅ All changes committed"
fi

echo ""
echo "🎉 Railway deployment verification complete!"
echo ""
echo "📋 Pre-deployment checklist:"
echo "  ✅ All required files present"
echo "  ✅ Configuration files valid"
echo "  ✅ Health endpoint working"
echo "  ✅ Network binding configured"
echo ""
echo "🚀 Ready to deploy! Run:"
echo "   git add ."
echo "   git commit -m 'Fix Railway health check issues'"
echo "   git push origin main"
echo ""
echo "📊 Monitor deployment at: https://railway.app/dashboard"
echo "🏥 After deployment, test: https://your-domain.railway.app/api/health"
#!/bin/bash

# Railway Deployment Script for OMI Backend
# This script helps deploy the OMI backend to Railway with proper configuration

echo "🚂 OMI Railway Deployment Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if we're in the server directory
if [ ! -f "package.json" ] || [ ! -f "index.js" ]; then
    print_error "Please run this script from the server directory"
    exit 1
fi

print_status "Running from server directory"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_warning "Railway CLI not found. Installing..."
    npm install -g @railway/cli
    if [ $? -ne 0 ]; then
        print_error "Failed to install Railway CLI"
        exit 1
    fi
fi

print_status "Railway CLI available"

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    print_warning "Not logged in to Railway. Please login:"
    railway login
    if [ $? -ne 0 ]; then
        print_error "Railway login failed"
        exit 1
    fi
fi

print_status "Logged in to Railway"

# Run pre-deployment verification
echo ""
echo "🔍 Running pre-deployment verification..."
node railway-deployment-fix.js
if [ $? -ne 0 ]; then
    print_error "Pre-deployment verification failed. Please fix issues before deploying."
    exit 1
fi

print_status "Pre-deployment verification passed"

# Check Railway project configuration
echo ""
echo "🔧 Checking Railway project configuration..."

# Check if connected to a Railway project
if ! railway status &> /dev/null; then
    print_warning "Not connected to a Railway project."
    echo "Please connect to an existing project or create a new one:"
    echo "1. Connect to existing: railway link"
    echo "2. Create new: railway login && railway init"
    exit 1
fi

print_status "Connected to Railway project"

# Verify environment variables
echo ""
echo "📋 Verifying environment variables..."

REQUIRED_VARS=("NODE_ENV" "JWT_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! railway variables | grep -q "$var"; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Set them using:"
    echo "  railway variables set NODE_ENV=production"
    echo "  railway variables set JWT_SECRET=your-secure-secret"
    echo "  railway variables set OPENAI_API_KEY=your-openai-key"
    exit 1
fi

print_status "Required environment variables are set"

# Check for PostgreSQL database
echo ""
echo "🗄️ Checking for PostgreSQL database..."

if ! railway variables | grep -q "DATABASE_URL"; then
    print_warning "DATABASE_URL not found. Adding PostgreSQL database..."
    echo "Please add PostgreSQL database in Railway dashboard:"
    echo "1. Go to your Railway project"
    echo "2. Click 'New' → 'Database' → 'Add PostgreSQL'"
    echo "3. This will automatically set the DATABASE_URL variable"
    echo ""
    read -p "Press Enter after adding PostgreSQL database..."
fi

print_status "Database configuration verified"

# Final deployment confirmation
echo ""
echo "🚀 Ready for deployment!"
echo ""
echo "Deployment configuration:"
echo "  - Root Directory: server (set this in Railway dashboard)"
echo "  - Health Check: /api/health"
echo "  - Start Command: node index.js"
echo "  - Environment: production"
echo ""

read -p "Deploy to Railway? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚂 Deploying to Railway..."
    
    # Deploy using Railway CLI
    railway up
    
    if [ $? -eq 0 ]; then
        print_status "Deployment completed!"
        echo ""
        echo "Next steps:"
        echo "1. Check deployment logs: railway logs"
        echo "2. Test health check: curl https://your-app.railway.app/api/health"
        echo "3. Update frontend VITE_API_URL if needed"
        echo ""
        echo "🎉 Your OMI backend is now live on Railway!"
    else
        print_error "Deployment failed. Check logs with: railway logs"
        exit 1
    fi
else
    echo "Deployment cancelled."
fi
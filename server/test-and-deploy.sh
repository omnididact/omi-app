#!/bin/bash

# Test and Deploy Script for Railway
echo "🚀 OMI Backend Test and Deploy Script"
echo "======================================"

# Function to test local server
test_local() {
    echo "🧪 Testing local server..."
    
    # Start server in background
    NODE_ENV=development node index.js &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 3
    
    # Test health endpoint
    echo "Testing health endpoint..."
    curl -s http://localhost:3001/api/health | jq '.'
    
    # Test root endpoint
    echo "Testing root endpoint..."
    curl -s http://localhost:3001/ | jq '.'
    
    # Stop server
    kill $SERVER_PID
    echo "✅ Local test completed"
}

# Function to deploy to Railway
deploy_railway() {
    echo "🚂 Deploying to Railway..."
    
    # Check if railway CLI is available
    if ! command -v railway &> /dev/null; then
        echo "❌ Railway CLI not found. Installing..."
        npm install -g @railway/cli
    fi
    
    # Deploy
    echo "Deploying to Railway..."
    railway up --service omi-backend || railway deploy
    
    echo "✅ Deployment initiated"
    echo "⏳ Waiting for deployment to complete..."
    sleep 30
    
    # Test production deployment
    echo "🧪 Testing production deployment..."
    curl -v https://omi-app-production.up.railway.app/api/health
}

# Main menu
case "${1:-menu}" in
    "local")
        test_local
        ;;
    "deploy")
        deploy_railway
        ;;
    "test")
        echo "🧪 Testing production deployment..."
        curl -v https://omi-app-production.up.railway.app/api/health
        ;;
    *)
        echo "Usage: $0 [local|deploy|test]"
        echo ""
        echo "Commands:"
        echo "  local  - Test server locally"
        echo "  deploy - Deploy to Railway"
        echo "  test   - Test production deployment"
        ;;
esac
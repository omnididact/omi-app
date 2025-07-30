#!/bin/bash

# Quick deployment test
# Usage: ./quick-test.sh YOUR_RAILWAY_URL

if [ -z "$1" ]; then
    echo "Usage: ./quick-test.sh YOUR_RAILWAY_URL"
    echo "Example: ./quick-test.sh https://omi-backend.up.railway.app"
    exit 1
fi

URL="$1"
echo "🔍 Testing Railway deployment at: $URL"
echo ""

# Health check
echo "Testing health endpoint..."
curl -s "$URL/api/health" | python3 -m json.tool
echo ""

# Test database
echo "Testing database connection..."
curl -s -X POST "$URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test123","name":"Test"}' \
    | python3 -m json.tool

echo ""
echo "✅ If you see JSON responses above, your deployment is working!"
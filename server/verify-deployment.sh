#!/bin/bash

echo "🚀 Railway Deployment Verification"
echo "================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the Railway app URL
echo -n "Enter your Railway app URL (e.g., https://your-app.up.railway.app): "
read APP_URL

if [ -z "$APP_URL" ]; then
    echo -e "${RED}❌ No URL provided${NC}"
    exit 1
fi

echo -e "\n🔍 Testing deployment at: $APP_URL\n"

# Test 1: Health check
echo "1. Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$APP_URL/api/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "   Response: $BODY"
else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
fi

# Test 2: CORS headers
echo -e "\n2. Testing CORS configuration..."
CORS_RESPONSE=$(curl -s -I -X OPTIONS "$APP_URL/api/health" -H "Origin: https://omi.symmetrycinema.com")
if echo "$CORS_RESPONSE" | grep -q "access-control-allow-origin"; then
    echo -e "${GREEN}✅ CORS headers present${NC}"
else
    echo -e "${YELLOW}⚠️  CORS headers not found in OPTIONS request${NC}"
fi

# Test 3: Database connection (via auth endpoint)
echo -e "\n3. Testing database connection..."
AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$APP_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test123","name":"Test"}')
HTTP_CODE=$(echo "$AUTH_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✅ Database connection working${NC}"
    echo "   (Got expected response from auth endpoint)"
else
    echo -e "${RED}❌ Database might not be connected (HTTP $HTTP_CODE)${NC}"
fi

# Test 4: Check logs command
echo -e "\n4. To view Railway logs, run:"
echo -e "${YELLOW}   railway logs${NC}"

echo -e "\n📊 Deployment Verification Complete!"
echo "===================================="

# Summary
echo -e "\nNext steps:"
echo "1. Check Railway logs for any startup errors"
echo "2. Test the frontend connection to this backend"
echo "3. Monitor performance and error rates"
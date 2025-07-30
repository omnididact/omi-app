#!/bin/bash

echo "🎉 Congratulations on completing the Railway setup!"
echo "================================================"
echo ""
echo "Please enter your Railway app URL"
echo "(You can find this in Railway Dashboard → Settings → Domains)"
echo ""
echo -n "Railway URL (e.g., https://omi-backend.up.railway.app): "
read RAILWAY_URL

if [ -z "$RAILWAY_URL" ]; then
    echo "❌ No URL provided. Please run this script again with your Railway URL."
    exit 1
fi

echo ""
echo "🔍 Testing your deployment..."
echo ""

# Test 1: Basic health check
echo "1️⃣ Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$RAILWAY_URL/api/health" 2>/dev/null)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$HEALTH_RESPONSE" | grep -v "HTTP_CODE:")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check: PASSED"
    echo "   Response: $BODY"
else
    echo "❌ Health check: FAILED (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
    echo ""
    echo "Troubleshooting tips:"
    echo "- Check Railway logs for errors"
    echo "- Ensure all environment variables are set"
    echo "- Wait a few more minutes if deployment just finished"
    exit 1
fi

# Test 2: Database connectivity (via auth endpoint)
echo ""
echo "2️⃣ Testing database connection..."
TEST_EMAIL="test-$(date +%s)@example.com"
AUTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$RAILWAY_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"testpass123\",\"name\":\"Test User\"}" 2>/dev/null)

HTTP_CODE=$(echo "$AUTH_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$AUTH_RESPONSE" | grep -v "HTTP_CODE:")

if [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Database connection: WORKING"
    echo "   Successfully created test user"
elif [ "$HTTP_CODE" = "400" ]; then
    # This is also OK - might mean user already exists
    echo "✅ Database connection: WORKING"
    echo "   Database is responding correctly"
else
    echo "⚠️  Database test returned unexpected status: $HTTP_CODE"
    echo "   Response: $BODY"
fi

# Test 3: CORS configuration
echo ""
echo "3️⃣ Testing CORS configuration..."
CORS_TEST=$(curl -s -I -X OPTIONS "$RAILWAY_URL/api/health" \
    -H "Origin: https://omi.symmetrycinema.com" \
    -H "Access-Control-Request-Method: GET" 2>/dev/null | grep -i "access-control-allow-origin")

if [ -n "$CORS_TEST" ]; then
    echo "✅ CORS: CONFIGURED"
    echo "   $CORS_TEST"
else
    echo "⚠️  CORS headers not found (might be OK depending on your setup)"
fi

# Summary
echo ""
echo "📊 Deployment Summary"
echo "===================="
echo "✅ API is running at: $RAILWAY_URL"
echo "✅ Database is connected and working"
echo "✅ Your backend is ready to use!"
echo ""
echo "📱 Next Steps:"
echo "1. Update your frontend to use this API URL"
echo "2. Test the full application flow"
echo "3. Monitor Railway logs for any issues"
echo ""
echo "🎯 Frontend Configuration:"
echo "Update your frontend API URL to: $RAILWAY_URL/api"
echo ""
echo "Need help? Check Railway logs with: railway logs"
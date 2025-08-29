#!/bin/bash

# Test Square Sync endpoints with artist role
# Usage: ./test-square-sync-curl.sh <auth-token>

BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
TOKEN="$1"

if [ -z "$TOKEN" ]; then
    echo "❌ Please provide an auth token"
    echo "Usage: $0 <auth-token>"
    echo ""
    echo "To get your auth token:"
    echo "1. Open browser dev tools (F12)"
    echo "2. Go to Network tab"
    echo "3. Log in to the app"
    echo "4. Find any API request to backend"
    echo "5. Copy the Bearer token from Authorization header (without 'Bearer ' prefix)"
    exit 1
fi

echo "🧪 Testing Square Sync Authorization"
echo "Backend URL: $BACKEND_URL"
echo ""

# Test 1: Check user role
echo "📋 Test 1: Checking user role..."
curl -s -X GET "$BACKEND_URL/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.user.role' || echo "Failed to get user role"

echo ""

# Test 2: Get Square sync status
echo "📋 Test 2: Getting Square sync status..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/square-sync/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Square sync status retrieved successfully (HTTP $HTTP_CODE)"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
elif [ "$HTTP_CODE" == "403" ]; then
    echo "❌ Authorization failed (HTTP $HTTP_CODE) - User does not have permission"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    echo "❌ Failed to get sync status (HTTP $HTTP_CODE)"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi

echo ""

# Test 3: Trigger a sync
echo "📋 Test 3: Triggering Square sync..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/square-sync/run" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Square sync triggered successfully (HTTP $HTTP_CODE)"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
elif [ "$HTTP_CODE" == "409" ]; then
    echo "⚠️  Sync already in progress (HTTP $HTTP_CODE)"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
elif [ "$HTTP_CODE" == "403" ]; then
    echo "❌ Authorization failed (HTTP $HTTP_CODE) - User does not have permission to trigger sync"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    echo "❌ Failed to trigger sync (HTTP $HTTP_CODE)"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi

echo ""

# Test 4: Get appointments with Square sync status
echo "📋 Test 4: Getting appointments with Square sync status..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/square-sync/appointments?limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Appointments retrieved successfully (HTTP $HTTP_CODE)"
    echo "Stats:"
    echo "$BODY" | jq '.stats' 2>/dev/null
else
    echo "❌ Failed to get appointments (HTTP $HTTP_CODE)"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi

echo ""
echo "✅ Square sync authorization test complete!"
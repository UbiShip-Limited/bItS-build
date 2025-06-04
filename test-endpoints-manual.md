# Manual API Testing Guide

## 🚀 Quick Test Setup

### 1. Start Both Servers
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend  
npm run dev
```

### 2. Test Commands (Copy & Paste)

#### ✅ Test Tattoo Request Creation (Should Work)
```bash
curl -X POST http://localhost:3000/api/tattoo-requests \
  -H "Content-Type: application/json" \
  -d '{
    "contactEmail": "test@example.com",
    "contactPhone": "+1234567890",
    "description": "Test tattoo request for endpoint testing. This is a detailed description that meets the minimum requirements.",
    "placement": "arm",
    "size": "medium",
    "colorPreference": "black and grey",
    "style": "traditional",
    "purpose": "personal",
    "preferredArtist": "any",
    "timeframe": "1-2 months",
    "contactPreference": "email",
    "additionalNotes": "This is a test request for endpoint validation."
  }'
```

**Expected Result:** Status 200 with tattoo request data including ID

#### ✅ Test Anonymous Appointment Creation (Should Work)
```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "contactEmail": "appointment@example.com",
    "contactPhone": "+1234567890",
    "startAt": "'$(date -d '+7 days' -Iseconds 2>/dev/null || date -v +7d -Iseconds 2>/dev/null || python -c "import datetime; print((datetime.datetime.now() + datetime.timedelta(days=7)).isoformat())")'",
    "duration": 120,
    "bookingType": "consultation",
    "note": "Test appointment booking",
    "isAnonymous": true
  }'
```

**Expected Result:** Status 200 with appointment data

#### ✅ Test Protected Endpoints (Should Require Auth)
```bash
# Should return 401 Unauthorized
curl -X GET http://localhost:3000/api/tattoo-requests

# Should return 401 Unauthorized  
curl -X GET http://localhost:3000/api/appointments
```

**Expected Result:** Status 401 Unauthorized

### 3. Test Your Form in Browser

1. Go to `http://localhost:3000` (your tattoo request form page)
2. Fill out the form completely
3. Submit and check if it works
4. Check browser Network tab to see the API calls

## 🔍 What to Look For

### ✅ Success Indicators:
- Form submissions return status 200
- Data is returned with proper IDs
- Protected endpoints return 401 (as expected)
- No console errors in browser

### ❌ Issues to Watch:
- 500 Internal Server Error (backend problem)
- CORS errors (configuration issue)
- Network errors (servers not running)
- Validation errors (check data format)

## 📊 Expected Test Results

| Endpoint | Method | Auth Required | Expected Status |
|----------|--------|---------------|-----------------|
| `/api/tattoo-requests` | POST | No | 200 |
| `/api/tattoo-requests` | GET | Yes | 401 |
| `/api/tattoo-requests/:id` | GET | Yes | 401 |
| `/api/appointments` | POST | No | 200 |
| `/api/appointments` | GET | Yes | 401 |

## 🐛 Troubleshooting

### Backend Not Responding?
```bash
# Check if backend is running
curl http://localhost:3001/users
```

### Frontend Not Proxying?
```bash
# Check if frontend is running
curl http://localhost:3000/api/upload
```

### Still Having Issues?
1. Check both server logs for errors
2. Verify environment variables are set
3. Make sure databases/services are running
4. Test direct backend endpoints first

## 🎯 Success Criteria

Your integration is working if:
1. ✅ You can create tattoo requests via form
2. ✅ You can create appointments  
3. ✅ Protected endpoints require authentication
4. ✅ Error messages are properly returned
5. ✅ No CORS or network errors

Once manual testing works, the automated tests will be easier to fix! 
# Production Deployment Guide

## Architecture Overview

This project has a **split deployment architecture**:
- **Backend (Fastify)**: Deployed to Railway 
- **Frontend (Next.js)**: Deployed to Vercel/Netlify/other

## Critical Environment Variables for Production

### 🔥 REQUIRED - Frontend Deployment (Vercel/Netlify)

```bash
# Backend API URL - MUST be set to your Railway backend domain
NEXT_PUBLIC_BACKEND_API_URL=https://your-app-name-production.up.railway.app

# Supabase (same as backend)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cloudinary (for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default

# Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 🔥 REQUIRED - Backend Deployment (Railway)

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Square API
SQUARE_ACCESS_TOKEN=your-production-token
SQUARE_LOCATION_ID=your-location-id
SQUARE_ENVIRONMENT=production
SQUARE_WEBHOOK_SIGNATURE_KEY=your-webhook-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email
RESEND_API_KEY=your-resend-key
EMAIL_FROM=noreply@yourdomain.com
OWNER_EMAIL=admin@yourdomain.com

# Frontend URL (for CORS and links in emails)
FRONTEND_URL=https://your-frontend-domain.com
```

## Deployment Steps

### 1. Deploy Backend to Railway

1. Connect your GitHub repo to Railway
2. Set environment variables in Railway dashboard
3. Deploy using: `npm run build:railway`
4. Note your Railway domain: `https://your-app.up.railway.app`

### 2. Deploy Frontend to Vercel

1. Connect repo to Vercel
2. **CRITICAL**: Set `NEXT_PUBLIC_BACKEND_API_URL=https://your-railway-domain.up.railway.app`
3. Set other frontend environment variables
4. Deploy

### 3. Update CORS Settings

Make sure your backend allows requests from your frontend domain:

```typescript
// In your Fastify backend
fastify.register(cors, {
  origin: [
    'https://your-frontend-domain.com',
    'http://localhost:3000' // for development
  ]
});
```

## Testing Production Setup

1. Check API connectivity:
   ```bash
   curl https://your-railway-app.up.railway.app/health
   ```

2. Check frontend can reach backend:
   - Open browser dev tools
   - Look for console message: "🔗 API Client configured for: https://your-railway-app.up.railway.app"
   - Should NOT show "localhost:3001"

## Common Issues

### ❌ "Failed to fetch" errors
- **Cause**: `NEXT_PUBLIC_BACKEND_API_URL` not set or incorrect
- **Fix**: Verify environment variable in frontend deployment

### ❌ CORS errors  
- **Cause**: Backend not configured to allow frontend domain
- **Fix**: Update CORS settings in backend

### ❌ 404 errors on API calls
- **Cause**: Backend not deployed or wrong URL
- **Fix**: Verify Railway deployment is successful

## Security Notes

- ✅ `NEXT_PUBLIC_*` variables are exposed to the browser (safe for URLs)
- ❌ Never put secrets in `NEXT_PUBLIC_*` variables
- ✅ Backend secrets stay on Railway (not exposed to browser)
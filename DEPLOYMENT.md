# 🚀 Production Deployment Guide

## Overview

This guide will deploy your Bowen Island Tattoo Shop application using:
- **Frontend**: Vercel (FREE)
- **Backend**: Railway ($5/month)
- **Database**: Supabase (FREE tier)

**Total Monthly Cost: ~$5**

---

## 📋 Prerequisites

- [x] GitHub repository with your code
- [x] Supabase project (already set up)
- [x] Vercel account (free)
- [x] Railway account (free)

---

## 🎯 Step 1: Prepare Your Repository

### 1.1 Update package.json Scripts
Ensure these scripts exist in your `package.json`:

```json
{
  "scripts": {
    "dev:frontend": "next dev --turbopack --port 3000",
    "dev:backend": "cross-env PORT=3001 tsx watch lib/server.ts",
    "build": "next build",
    "build:server": "tsc -p tsconfig.server.json",
    "start": "next start",
    "start:server": "cross-env PORT=3001 node dist/server.js"
  }
}
```

### 1.2 Create Production Environment Template
Copy your current environment variables to document what you'll need:

```bash
# Create a reference file (don't commit actual values)
cp .env.local .env.deployment-template
```

---

## 🗄️ Step 2: Deploy Backend to Railway

### 2.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Authorize Railway to access your repositories

### 2.2 Deploy Backend Service
1. **Create New Project**: Click "New Project"
2. **Deploy from GitHub**: Select "Deploy from GitHub repo"
3. **Select Repository**: Choose your tattoo shop repository
4. **Configure Service**:
   - Name: `bowen-tattoo-backend`
   - Root Directory: `/` (leave as default)
   - Build Command: `npm run build:server`
   - Start Command: `npm run start:server`

### 2.3 Set Environment Variables
In Railway dashboard, go to your service → Variables tab and add:

```bash
# Node Configuration
NODE_ENV=production
PORT=3001

# Database (Supabase)
DATABASE_URL=your_supabase_connection_string
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Square Payments
SQUARE_ACCESS_TOKEN=your_production_square_token
SQUARE_APPLICATION_ID=your_square_app_id
SQUARE_LOCATION_ID=your_square_location_id
SQUARE_ENVIRONMENT=production
SQUARE_WEBHOOK_SIGNATURE_KEY=your_webhook_signature_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# App Configuration
FRONTEND_URL=https://your-frontend-domain.vercel.app
MERCHANT_SUPPORT_EMAIL=support@yourdomain.com
```

### 2.4 Get Backend URL
- After deployment, Railway will provide a URL like: `https://bowen-tattoo-backend-production.up.railway.app`
- Copy this URL - you'll need it for the frontend

---

## 🌐 Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

### 3.2 Deploy Frontend
1. **Import Git Repository**: Click "New Project"
2. **Select Repository**: Choose your tattoo shop repository
3. **Configure Project**:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `/` (leave as default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

### 3.3 Set Environment Variables
In Vercel dashboard, go to Settings → Environment Variables:

```bash
# Supabase (Frontend)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API URL (from Railway)
NEXT_PUBLIC_API_URL=https://your-backend-url.up.railway.app

# Other public variables as needed
```

### 3.4 Update API Configuration
Update your `next.config.ts` to point to your Railway backend:

```typescript
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL + '/:path*',
      },
    ];
  },
  // ... rest of config
};
```

---

## 🔗 Step 4: Connect Frontend and Backend

### 4.1 Update CORS Settings
In your backend's CORS configuration, add your Vercel domain:

```typescript
// In lib/server.ts
fastifyInstance.register(cors, {
  origin: [
    'http://localhost:3000', // Development
    process.env.FRONTEND_URL, // Production Vercel URL
  ],
  credentials: true,
});
```

### 4.2 Update Frontend API Calls
Ensure your frontend API calls use the correct base URL:

```typescript
// In your frontend API utility
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Example API call
const response = await fetch(`${API_BASE_URL}/tattoo-requests`);
```

---

## ✅ Step 5: Test Deployment

### 5.1 Test Backend Endpoints
Visit your Railway backend URL and test key endpoints:
- `https://your-backend.railway.app/health`
- `https://your-backend.railway.app/tattoo-requests`

### 5.2 Test Frontend
Visit your Vercel frontend URL and test:
- Homepage loads correctly
- API calls work (check browser dev tools)
- Forms submit successfully
- Image uploads work (Cloudinary)

### 5.3 Test Database Connection
Verify in Railway logs that database queries are successful:
- Check Railway dashboard → Your service → Logs
- Look for successful database connection messages

---

## 🔄 Step 6: Set Up Automatic Deployments

### 6.1 Railway Auto-Deploy
- Push changes to your `main` branch
- Railway automatically rebuilds and deploys backend
- Monitor deployment in Railway dashboard

### 6.2 Vercel Auto-Deploy
- Push changes to your `main` branch
- Vercel automatically rebuilds and deploys frontend
- Monitor deployment in Vercel dashboard

---

## 📊 Step 7: Monitoring & Maintenance

### 7.1 Railway Monitoring
- **Logs**: Railway dashboard → Your service → Logs
- **Metrics**: CPU usage, memory usage, response times
- **Alerts**: Set up email notifications for downtime

### 7.2 Vercel Monitoring
- **Analytics**: Built-in web vitals and performance metrics
- **Functions**: Monitor API route performance
- **Bandwidth**: Track usage against free tier limits

### 7.3 Supabase Monitoring
- **Dashboard**: Monitor database usage and queries
- **Auth**: Track user registrations and logins
- **Storage**: Monitor file upload usage

---

## 🚨 Troubleshooting

### Common Issues

#### Backend Won't Start
1. Check Railway logs for error messages
2. Verify all environment variables are set
3. Ensure `start:server` script exists in package.json
4. Check that `dist/server.js` was built correctly

#### Frontend Can't Connect to Backend
1. Verify `NEXT_PUBLIC_API_URL` is set correctly
2. Check CORS configuration includes Vercel domain
3. Test backend endpoints directly in browser
4. Check browser dev tools for network errors

#### Database Connection Issues
1. Verify Supabase connection string is correct
2. Check Supabase project is active and accessible
3. Ensure service role key has correct permissions
4. Test connection locally first

#### Environment Variables Not Working
1. Restart services after adding new variables
2. Check variable names match exactly (case-sensitive)
3. Don't include quotes around values in Railway/Vercel dashboards
4. Ensure public variables start with `NEXT_PUBLIC_`

---

## 💰 Cost Breakdown

| Service | Free Tier | Paid Tier | Your Usage |
|---------|-----------|-----------|------------|
| **Vercel** | 100GB bandwidth | $20/month for Pro | FREE tier sufficient |
| **Railway** | $5 credit/month | $5+ usage-based | ~$5/month |
| **Supabase** | 500MB DB, 1GB storage | $25/month for Pro | FREE tier sufficient |

**Total Monthly Cost: ~$5** 🎯

---

## 🔐 Security Checklist

- [x] All environment variables are set correctly
- [x] No sensitive data in git repository
- [x] CORS configured for production domains only
- [x] HTTPS enabled on all services (automatic)
- [x] Supabase RLS policies configured
- [x] Database connection uses SSL

---

## 🔄 Alternative Deployment Options

### PM2 on VPS (Alternative)
If you prefer to deploy on your own VPS server instead:

1. **Use the included `ecosystem.config.js`** for PM2 process management
2. **Scripts available**:
   ```bash
   npm run build:server  # Build backend
   pm2 start ecosystem.config.js  # Start both services
   pm2 status  # Check status
   ```
3. **Cost**: $10-20/month for VPS
4. **Management**: Requires server administration knowledge

### Docker Deployment (Advanced)
The project includes Docker configuration (`docker-compose.production.yml`) if you need containerized deployment for enterprise environments.

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

---

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review service-specific documentation
3. Check community forums for each platform
4. Contact platform support if needed

**Deployment Complete! 🎉** 
# Password Reset Setup Guide

This guide covers the complete setup required for password reset functionality to work properly with your Vercel + Railway monorepo.

## 🔧 Required Configuration

### 1. Supabase Dashboard Configuration

**Navigate to your Supabase Dashboard > Authentication > URL Configuration**

#### Redirect URLs
Add these exact URLs to your "Redirect URLs" section:

**For Development:**
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/reset-password
```

**For Production (replace with your actual domain):**
```
https://yourdomain.com/auth/callback
https://yourdomain.com/auth/reset-password
https://www.yourdomain.com/auth/callback
https://www.yourdomain.com/auth/reset-password
```

#### Site URL
Set your "Site URL" to:
- **Development:** `http://localhost:3000`
- **Production:** `https://yourdomain.com`

### 2. Environment Variables

#### Frontend (Vercel) Environment Variables
```bash
# CRITICAL: Must be set in production
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API (Railway)
NEXT_PUBLIC_BACKEND_API_URL=https://your-railway-app.railway.app
```

#### Backend (Railway) Environment Variables
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Frontend URL for CORS
FRONTEND_URL=https://yourdomain.com
```

### 3. Email Template Configuration (Optional)

**Navigate to your Supabase Dashboard > Authentication > Email Templates**

#### Reset Password Email Template
Ensure the reset password email template uses the correct redirect URL:

```html
<h2>Reset Your Password</h2>
<p>Click the link below to reset your password:</p>
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery">Reset Password</a>
```

## 🔄 Password Reset Flow

Here's how the complete flow works:

1. **User requests reset** → Submits email on `/auth/forgot-password`
2. **Email sent** → Supabase sends email with link to `/auth/callback`
3. **User clicks link** → Redirected to `/auth/callback` route
4. **Auth callback handles** → Exchanges code for session, redirects to `/auth/reset-password`
5. **Reset password** → User enters new password with valid session
6. **Success** → User redirected to dashboard

## 🐛 Troubleshooting

### Common Issues

**1. "Invalid or expired token" error**
- Check that `NEXT_PUBLIC_SITE_URL` matches your Vercel deployment URL exactly
- Verify Supabase redirect URLs include both `/auth/callback` and `/auth/reset-password`
- Ensure no trailing slashes in URLs

**2. "Reset link must be opened in same browser" error**
- This is the old error - should be fixed with the callback route
- If still occurring, check browser console for auth errors

**3. CORS errors**
- Verify `FRONTEND_URL` in Railway matches your Vercel deployment
- Check that both www and non-www versions are configured

**4. Database connection issues (Railway)**
- Ensure `DATABASE_URL` is properly set in Railway
- Check that Supabase connection pooling is configured correctly

### Debug Steps

1. **Check environment variables are set:**
   ```bash
   # On Vercel (frontend)
   echo $NEXT_PUBLIC_SITE_URL
   
   # On Railway (backend) 
   echo $SUPABASE_URL
   ```

2. **Test auth callback directly:**
   ```
   GET https://yourdomain.com/auth/callback?code=test
   ```
   Should redirect to reset password page with error message.

3. **Check Supabase logs:**
   - Go to Supabase Dashboard > Logs > Auth Logs
   - Look for failed authentication attempts

4. **Check browser console:**
   - Open developer tools when testing password reset
   - Look for auth-related errors or failed requests

## ✅ Verification Checklist

- [ ] Supabase redirect URLs configured for both callback and reset-password routes
- [ ] `NEXT_PUBLIC_SITE_URL` set in Vercel environment variables
- [ ] Supabase credentials configured in both Vercel and Railway
- [ ] CORS configured in Railway to allow your Vercel domain
- [ ] Email template uses correct redirect URL (optional)
- [ ] Test complete flow: request reset → click email → reset password → login

## 🔒 Security Notes

- The callback route properly validates auth tokens before creating sessions
- Expired links are handled gracefully with appropriate error messages
- Sessions are properly established before allowing password changes
- All redirects use the configured site URL to prevent open redirect attacks

## 📞 Support

If you continue to have issues:
1. Check the browser console for detailed error messages
2. Verify all environment variables are properly set in both Vercel and Railway
3. Test with a fresh incognito browser session
4. Check Supabase dashboard logs for authentication errors
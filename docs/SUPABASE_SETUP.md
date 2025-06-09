# Supabase Authentication Setup Guide

This guide walks you through setting up Supabase authentication for the Bowen Island Tattoo Shop production environment.

## 🔐 Overview

**User Types:**
- **Admin**: Full system access, user management
- **Assistant**: Help with bookings, access analytics
- **Artist**: Manage own bookings, view tattoo requests
- **Customers**: Do NOT login to admin system (use public endpoints)

## 📋 Prerequisites

1. Supabase project created
2. Database URL and keys available
3. Admin access to Supabase dashboard

## 🛠️ Setup Steps

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend URL (for redirects)
FRONTEND_URL=https://yourdomain.com
```

### 2. Supabase Auth Settings

In your Supabase dashboard, configure:

**Auth Settings:**
- Enable email confirmations for new users
- Set redirect URLs to include your domain
- Configure email templates if needed

**Email Templates:**
- Invitation: `${FRONTEND_URL}/auth/set-password`
- Password Reset: `${FRONTEND_URL}/auth/reset-password`

### 3. Row Level Security (RLS) Policies

Execute these SQL commands in your Supabase SQL editor:

```sql
-- Enable RLS on the users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Policy: Admins can read all users
CREATE POLICY "Admins can read all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy: Admins can insert new users
CREATE POLICY "Admins can insert users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy: Admins can update users (except can't demote themselves)
CREATE POLICY "Admins can update users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy: Prevent admins from deleting themselves
CREATE POLICY "Admins can delete users except self" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        ) AND id != auth.uid()
    );
```

### 4. Database Functions

Create these functions for user management:

```sql
-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO users (id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.user_metadata->>'role', 'artist')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user record
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 5. Initial Admin User Setup

**Option A: Using SQL (Recommended for Production)**

```sql
-- Insert the first admin user directly into auth.users
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    user_metadata
) VALUES (
    gen_random_uuid(),
    'admin@yourdomain.com',
    crypt('your-secure-password', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"role": "admin"}'::jsonb
);
```

**Option B: Using the Setup Script**

Run the provided setup script:

```bash
npm run setup:admin
```

### 6. Email Configuration

**SMTP Settings:**
- Configure custom SMTP in Supabase Auth settings
- Use your domain's email service
- Set up proper SPF/DKIM records

**Email Templates:**
Customize the email templates in Supabase dashboard:
- Welcome email
- Password reset
- Email confirmation
- Invitation email

## 🔒 Security Best Practices

### JWT Configuration

```sql
-- Set JWT expiry time (recommended: 1 hour)
UPDATE auth.config SET 
    jwt_exp = 3600,
    refresh_token_rotation_enabled = true,
    security_update_password_require_reauthentication = true;
```

### Rate Limiting

Configure rate limiting in Supabase dashboard:
- Login attempts: 5 per minute
- Password reset: 2 per minute
- Email sending: 10 per hour

### Password Policy

Set strong password requirements:
- Minimum 8 characters
- Require uppercase, lowercase, numbers
- Prevent common passwords

## 📱 Frontend Integration

### Auth Provider Setup

Wrap your app with the AuthProvider:

```tsx
// app/layout.tsx
import { AuthProvider } from '@/hooks/useAuth';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Protected Routes

Use middleware to protect admin routes:

```tsx
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  return res;
}
```

## 🧪 Testing Authentication

### Test User Creation

```bash
# Create test users for different roles
curl -X POST http://localhost:3001/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "artist@test.com",
    "role": "artist",
    "sendInvite": true
  }'
```

### Test Login

```bash
# Test login endpoint
curl -X POST https://your-project.supabase.co/auth/v1/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "your-password",
    "grant_type": "password"
  }'
```

## 🚨 Production Checklist

### Security
- [ ] RLS policies enabled and tested
- [ ] Strong password policy configured
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Email confirmation required
- [ ] JWT secret rotated from default

### Email
- [ ] Custom SMTP configured
- [ ] Email templates customized
- [ ] SPF/DKIM records set
- [ ] Test emails working

### Access Control
- [ ] Initial admin user created
- [ ] Test all user roles
- [ ] Verify permission boundaries
- [ ] Test user invitation flow

### Monitoring
- [ ] Auth logs enabled
- [ ] Failed login alerts configured
- [ ] User activity monitoring
- [ ] Backup admin access method

## 🔧 Troubleshooting

### Common Issues

**Login not working:**
- Check CORS settings
- Verify environment variables
- Test with Supabase auth directly

**RLS blocking queries:**
- Verify user has correct role in database
- Check RLS policies match your use case
- Test with service role key

**Emails not sending:**
- Check SMTP configuration
- Verify email templates
- Check spam folders

### Debug Commands

```bash
# Check user exists in database
SELECT * FROM auth.users WHERE email = 'user@domain.com';

# Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'users';

# Test API endpoints
curl -X GET http://localhost:3001/users/me \
  -H "Authorization: Bearer TOKEN"
```

## 📞 Support

For additional help:
1. Check Supabase documentation
2. Review application logs
3. Test in development environment first
4. Contact your system administrator

---

**⚠️ Important:** Never commit real credentials to version control. Always use environment variables for sensitive data. 
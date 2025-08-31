# Resend Production Setup Guide

## Current Status
Your Resend account is in **test mode** and can only send emails to `bowenislandtattooshop@gmail.com`.

## Steps to Enable Production Email Sending

### Option 1: Use Free Email Domain (Quickest - 5 minutes)
If you don't have a custom domain, you can use a free email sending domain from Resend.

1. **Go to Resend Domains**: https://resend.com/domains
2. **Click "Add Domain"**
3. **Select "I don't have a domain"**
4. **Use the provided subdomain** (e.g., `send.bowenislandtattoo.com` if you own that domain, or use Resend's free domain)
5. **Your FROM address will be**: `noreply@send.yourdomain.com` or similar

### Option 2: Verify Custom Domain (Recommended - 15-30 minutes)
If you have a custom domain (e.g., `bowenislandtattoo.com`):

1. **Go to Resend Domains**: https://resend.com/domains
2. **Click "Add Domain"**
3. **Enter your domain**: `bowenislandtattoo.com` (or your actual domain)
4. **Add DNS Records** - Resend will show you exactly what to add:
   - **SPF Record**: TXT record to authorize Resend to send emails
   - **DKIM Records**: For email authentication (usually 3 CNAME records)
   - **Optional MX Record**: If you want to receive emails through Resend

5. **Where to add DNS records**:
   - GoDaddy: DNS Management section
   - Namecheap: Advanced DNS section
   - Cloudflare: DNS section
   - Google Domains: DNS section

6. **Verify Domain** - Click "Verify DNS Records" in Resend after adding them

### Option 3: Upgrade Without Domain (Immediate)
You can upgrade to a paid plan without verifying a domain:

1. **Go to**: https://resend.com/settings/billing
2. **Choose a plan**:
   - **Pro**: $20/month for 5,000 emails/month
   - **Or pay-as-you-go**: $0.0035 per email after free tier
3. **This removes test mode restrictions immediately**

## After Setup - Update Your Configuration

### 1. Update .env file:
```env
# Keep your existing API key
RESEND_API_KEY=re_MojNRjdr_Dx9jPC3S3xBGKuN3TZinUFiB

# Update FROM address based on your choice:
# Option 1 - Free subdomain:
EMAIL_FROM=noreply@send.yourdomain.com

# Option 2 - Custom domain:
EMAIL_FROM=noreply@bowenislandtattoo.com
# or keep using:
EMAIL_FROM=bowenislandtattooshop@gmail.com

# Owner notifications always go here:
OWNER_EMAIL=bowenislandtattooshop@gmail.com
```

### 2. Clean up duplicate API keys:
Remove the duplicate `RESEND_API_KEY` line in your .env file (you have two).

## Email Flow After Production Setup

### Customer Emails (will work in production):
- Tattoo request confirmations → Customer's email
- Appointment confirmations → Customer's email
- Payment links → Customer's email
- Appointment reminders → Customer's email

### Owner Notifications (already working):
- New tattoo requests → bowenislandtattooshop@gmail.com
- New appointments → bowenislandtattooshop@gmail.com
- Payment received → bowenislandtattooshop@gmail.com
- Cancellations → bowenislandtattooshop@gmail.com

## Testing Production Setup

Run this test after completing setup:
```bash
npm run test:email
```

This should successfully send to any email address, not just bowenislandtattooshop@gmail.com.

## Quick Start Recommendation

**For immediate production use:**
1. Go to https://resend.com/settings/billing
2. Upgrade to Pro plan ($20/month)
3. Your current setup will immediately work for all email addresses
4. You can verify a domain later for better deliverability

## Support Links
- Resend Dashboard: https://resend.com/emails
- Resend Domains: https://resend.com/domains
- Resend API Keys: https://resend.com/api-keys
- Resend Billing: https://resend.com/settings/billing
- Resend Docs: https://resend.com/docs

## Monitoring
After going to production, monitor your emails at:
- https://resend.com/emails (see all sent emails)
- Check the Email Logs in your database
- Owner will receive copies of important notifications
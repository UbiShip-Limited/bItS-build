# 🔐 Staff Access Code System - Setup Guide

## Overview

This system adds an extra security layer to your staff authentication pages (`/auth/login` and `/auth/register`) by requiring a shared access code before users can see the login form.

**Security Benefits:**
- Prevents casual discovery of staff login pages
- Blocks automated bot attacks
- Adds barrier against unauthorized access attempts
- No additional costs or infrastructure required

---

## 🚀 Quick Setup

### 1. Set Environment Variable

Add the following to your production environment:

```bash
STAFF_ACCESS_CODE=your-chosen-access-code
```

**Recommended Code Formats:**
- `BOWEN-TATTOO-2024` (business-themed)
- `ISLAND-STAFF-WINTER` (seasonal)
- `NEEDLE-AND-INK-23` (industry-themed)

### 2. Deploy to Production

After setting the environment variable, deploy your application. The access code protection will be automatically active.

### 3. Share Code with Staff

Provide the current access code to your authorized staff members via secure communication (Signal, encrypted email, etc.).

---

## 🔄 Managing Access Codes

### Changing the Access Code

1. **Update Environment Variable:**
   - Vercel: Project Settings → Environment Variables
   - Railway: Project → Variables tab
   - Other platforms: Update via your hosting dashboard

2. **Redeploy if Necessary:**
   - Some platforms require redeploy for environment changes
   - Test the new code before informing staff

3. **Communicate Change:**
   - Notify all staff members of the new code
   - Give them 24-48 hours notice before making the change
   - Consider providing overlap period during transition

### Recommended Rotation Schedule

**Monthly Rotation (Recommended):**
- Change code on the 1st of each month
- Use predictable format: `BOWEN-JAN-2024`, `BOWEN-FEB-2024`, etc.
- Staff will know the pattern and expect changes

**Event-Based Changes:**
- When staff member leaves
- If code may have been compromised
- After suspicious access attempts
- During security reviews

---

## 👥 Staff Communication

### Initial Setup Message

```
Hi Team,

We've added an extra security layer to our staff portal. When you visit the login page, you'll now need to enter an access code first.

Current Access Code: BOWEN-TATTOO-2024

Steps to login:
1. Go to [your-site]/auth/login
2. Enter the access code above
3. Click "Verify Access"
4. Enter your normal email/password

Please keep this code confidential and don't share it with non-staff members.

Questions? Contact [admin-contact]
```

### Monthly Update Message

```
Staff Portal Update - New Access Code

New Access Code (effective [date]): BOWEN-FEB-2024
Old code will stop working on [date]

Same login process, just use the new code in step 2.

Thanks!
```

---

## 🛡️ Security Features

### Built-in Protections

1. **Rate Limiting:** 1-second delay after wrong code attempts
2. **Session Storage:** Code verification stored only for browser session
3. **No Permanent Storage:** Code not saved to localStorage
4. **Audit Logging:** All attempts logged (without exposing codes)
5. **Generic Error Messages:** No hints about expected format

### What Gets Logged

```
🔐 Staff access attempt: SUCCESS from 192.168.1.100
🔐 Staff access attempt: FAILED from 203.0.113.45
```

### Monitoring Access Attempts

Check your application logs for suspicious patterns:
- Multiple failed attempts from same IP
- Attempts during unusual hours
- High frequency of attempts

---

## 🧪 Testing

### Development Testing

Access codes are **disabled in development** by default. To test locally:

```bash
# In your .env.local file
NODE_ENV=production
STAFF_ACCESS_CODE=TEST-CODE-123
```

### Production Testing

1. **Test with Correct Code:**
   - Should proceed to login form smoothly
   - No error messages

2. **Test with Wrong Code:**
   - Should show "Invalid access code" error
   - Should not proceed to login form

3. **Test Session Persistence:**
   - Access code should be remembered during browser session
   - Should require re-entry in new browser/incognito

---

## 🔧 Troubleshooting

### Common Issues

**"Access code system not configured" Error:**
- Environment variable `STAFF_ACCESS_CODE` is not set
- Check your hosting platform's environment variables
- Redeploy after adding the variable

**Staff Can't Access After Code Change:**
- Verify the new code is correct in environment variables
- Check if platform requires redeploy for env changes
- Confirm staff are using the new code, not the old one

**Code Works Locally But Not in Production:**
- Environment variables are different between environments
- Production might not have the `STAFF_ACCESS_CODE` set
- Check platform-specific environment variable configuration

### Emergency Access

If you get locked out or the system fails:

1. **Remove Environment Variable:**
   - Temporarily remove `STAFF_ACCESS_CODE` from production
   - System will show warning but allow access
   - Fix the issue, then re-add the variable

2. **Check Server Logs:**
   - Look for access code verification errors
   - Check if API endpoint is accessible

---

## 📊 Analytics & Monitoring

### Key Metrics to Track

- **Success Rate:** Percentage of successful access code attempts
- **Failed Attempts:** Number of failed attempts per day/week
- **Unique IPs:** Number of different IPs attempting access
- **Peak Times:** When most access attempts occur

### Monthly Review Questions

1. Are there unusual patterns in access attempts?
2. How many failed attempts are we seeing?
3. Are staff reporting any difficulties with the current code?
4. Should we update our rotation schedule?

---

## 🚨 Security Incidents

### If Code is Compromised

1. **Immediate Actions:**
   - Change access code immediately
   - Notify all staff of emergency code change
   - Monitor logs for suspicious activity

2. **Investigation:**
   - Review recent access logs
   - Identify how code was compromised
   - Update security procedures if needed

3. **Prevention:**
   - Remind staff not to share codes
   - Use more complex codes if needed
   - Consider shorter rotation periods

---

## 💡 Best Practices

### Code Selection

**Good Codes:**
- `BOWEN-ISLAND-2024` (memorable, business-related)
- `TATTOO-STUDIO-WINTER` (seasonal rotation)
- `NEEDLE-ART-JAN24` (short but specific)

**Avoid:**
- Common words: `PASSWORD`, `ADMIN`, `LOGIN`
- Sequential: `CODE1`, `CODE2`, `CODE3`
- Personal info: Staff names, birthdays
- Too complex: Random strings difficult to remember

### Staff Training

- Explain why the access code exists
- Show them the two-step process
- Remind them to keep code confidential
- Provide backup contact for issues

### Documentation

- Keep record of current and past codes
- Document when codes were changed and why
- Maintain list of who has access to codes
- Review access list when staff changes occur

---

## 🔮 Future Enhancements

### Possible Improvements

1. **Multiple Codes:** Different codes for different roles
2. **Automatic Rotation:** Codes that change automatically
3. **Time-Based Access:** Codes that only work during business hours
4. **Two-Factor:** SMS or email verification in addition to code

### Integration Options

- Add access code requirement to other admin routes
- Integrate with existing audit logging system
- Connect to monitoring/alerting systems

---

## 📞 Support

### For Staff Members

If you're having trouble with the access code:
1. Double-check you're using the current code
2. Try in a different browser or incognito mode
3. Contact your administrator
4. Use the exact code provided (case-sensitive)

### For Administrators

Need help with setup or management:
1. Check this documentation first
2. Review server logs for error messages
3. Test in development environment
4. Verify environment variables are set correctly

---

**Last Updated:** [Current Date]  
**Version:** 1.0  
**Next Review:** [Next Month] 
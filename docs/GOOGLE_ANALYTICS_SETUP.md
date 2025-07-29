# Google Analytics Setup Guide

## Overview
This guide explains how to set up and test Google Analytics 4 (GA4) for Bowen Island Tattoo Shop.

## Setup Instructions

### 1. Create a Google Analytics 4 Property
1. Go to [Google Analytics](https://analytics.google.com)
2. Click "Admin" (gear icon)
3. Click "Create Property"
4. Enter property name: "Bowen Island Tattoo Shop"
5. Select your timezone and currency
6. Complete the property setup

### 2. Get Your Measurement ID
1. In GA4, go to Admin > Data Streams
2. Click on your web stream
3. Copy the Measurement ID (format: G-XXXXXXXXXX)

### 3. Configure Environment Variable
Add your Measurement ID to your environment variables:

```bash
# .env.local (for development)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Production environment (Railway, etc.)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Events Being Tracked

### Form Events
- `form_start` - When user starts the tattoo request form
- `form_submit` - When user successfully submits the tattoo request form

### Gallery Events
- `lightbox_open` - When user opens the gallery lightbox
- `view_item` - When user views a specific gallery image

### Navigation Events
- `navigation_click` - When user clicks a navigation menu item

### Contact Events
- `contact_method` - When user clicks phone or email links
- `social_click` - When user clicks social media links

### CTA Events
- `cta_click` - When user clicks call-to-action buttons

## Testing Your Implementation

### 1. Enable Debug Mode
1. Install the [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension
2. Enable the extension
3. Open Chrome DevTools Console

### 2. Test in Real-Time
1. Go to GA4 > Reports > Real-time
2. Visit your website
3. Perform actions and verify they appear in real-time reports

### 3. Verify Events
Test each event type:
- Navigate through menu items
- Start and submit the tattoo request form
- View gallery images
- Click social media links
- Click CTA buttons

### 4. Check Debug View
1. In GA4, go to Admin > DebugView
2. Events should appear here with detailed parameters

## Troubleshooting

### Events Not Appearing
1. Check that `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set correctly
2. Verify the measurement ID format (G-XXXXXXXXXX)
3. Clear browser cache and cookies
4. Check browser console for errors

### Testing Locally
GA4 works on localhost. Just ensure your `.env.local` file has the correct measurement ID.

## Privacy Considerations

The current implementation:
- Uses GA4 which is more privacy-focused than Universal Analytics
- No personally identifiable information (PII) is sent
- Consider adding a cookie consent banner for GDPR compliance

## Next Steps

1. Set up conversion goals for tattoo request submissions
2. Create custom audiences for remarketing
3. Set up custom reports for business insights
4. Consider implementing Enhanced Ecommerce for appointment tracking

## Maintenance

- Review analytics data monthly
- Update tracking when new features are added
- Monitor for any tracking errors in GA4's Admin > Data quality
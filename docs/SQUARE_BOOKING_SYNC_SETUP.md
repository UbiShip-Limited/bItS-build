# Square Booking Sync Setup Guide

This guide explains how to set up and use the Square Booking sync feature for Bowen Island Tattoo Shop.

## Overview

The Square Booking sync feature provides bi-directional synchronization between your local appointment system and Square Bookings. This ensures that:

- Appointments created locally are automatically created in Square
- Bookings created in Square are synced to your local system
- Updates and cancellations are synchronized in both directions
- Customer data is kept consistent across both platforms

## Prerequisites

Before setting up Square Booking sync, you need:

1. An active Square account for your business
2. Square Bookings API access (included with Square appointments)
3. A verified Square location
4. Square API credentials

## Configuration Steps

### 1. Get Your Square API Credentials

1. Log in to your Square Dashboard at https://squareup.com/dashboard
2. Navigate to **Apps** → **My Applications**
3. Create a new application or select an existing one
4. Note down the following credentials:
   - **Access Token** (for production)
   - **Application ID**
   - **Location ID** (from Locations section)

### 2. Set Environment Variables

Add the following to your `.env` file:

```env
# Square API Configuration
SQUARE_ACCESS_TOKEN=your-production-access-token
SQUARE_APPLICATION_ID=your-application-id
SQUARE_LOCATION_ID=your-location-id
SQUARE_ENVIRONMENT=production
SQUARE_WEBHOOK_SIGNATURE_KEY=your-webhook-signature-key
```

For testing/development, use sandbox credentials:

```env
SQUARE_ENVIRONMENT=sandbox
SQUARE_ACCESS_TOKEN=your-sandbox-access-token
```

### 3. Configure Webhooks

To receive real-time updates from Square:

1. In Square Dashboard, go to your application settings
2. Navigate to **Webhooks**
3. Add a new webhook endpoint:
   - URL: `https://your-domain.com/api/v1/webhooks/square`
   - Events to subscribe:
     - `booking.created`
     - `booking.updated`
     - `payment.created`
     - `payment.updated`
4. Copy the **Signature Key** and add it to your `.env` as `SQUARE_WEBHOOK_SIGNATURE_KEY`

### 4. Set Up Square Catalog (Optional but Recommended)

Configure your services in Square for better organization:

1. In Square Dashboard, go to **Items** → **Services**
2. Create service items for:
   - Consultation (30-60 minutes)
   - Drawing Consultation (60-120 minutes)
   - Tattoo Session (variable duration)
   - Touch-up Session (30-60 minutes)

3. Note the Service Variation IDs if you want to map specific services

## Using the Sync Feature

### Manual Sync

#### From the Dashboard

1. Navigate to the Appointments page
2. Click the **"Sync Square"** button in the header
3. The sync will run in the background and update the UI when complete

#### Using the Script

Run the sync script manually:

```bash
# Sync default date range (7 days past, 30 days future)
npm run sync:square-bookings

# Sync specific number of days
npm run sync:square-bookings -- --days=60

# Sync specific date range
npm run sync:square-bookings -- --start=2024-01-01 --end=2024-12-31
```

### Automatic Sync

The system automatically syncs in the following scenarios:

1. **Real-time via Webhooks**: Square sends updates instantly when bookings are created/modified
2. **On Appointment Creation**: When you create an appointment locally, it syncs to Square immediately
3. **On Appointment Update**: Changes to appointments sync to Square automatically

### Setting Up Scheduled Sync (Recommended)

For production environments, set up a cron job to sync regularly:

```bash
# Add to crontab (runs every 30 minutes)
*/30 * * * * cd /path/to/project && npm run sync:square-bookings >> /var/log/square-sync.log 2>&1
```

Or use a process manager like PM2:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'square-sync',
    script: 'npm',
    args: 'run sync:square-bookings',
    cron_restart: '*/30 * * * *',
    autorestart: false
  }]
};
```

## Understanding Sync Status

### In the Dashboard

The dashboard shows Square sync status with indicators:

- **Green Cloud Icon**: Appointment is synced with Square
- **Gray Cloud-Off Icon**: Appointment exists locally but not in Square
- **N/A**: Anonymous booking (cannot sync without customer)

### Square Sync Status Widget

The dashboard homepage displays:
- Connection status
- Last sync time
- Number of appointments synced/created/updated
- Any sync errors

## Troubleshooting

### Common Issues

#### 1. "Square not configured" Error

**Cause**: Missing or invalid Square credentials

**Solution**: 
- Verify all environment variables are set correctly
- Ensure the access token has not expired
- Check that the location ID matches your Square account

#### 2. Appointments Not Syncing

**Cause**: Missing customer information or Square customer ID

**Solution**:
- Ensure appointments have associated customers
- Verify customer email addresses are valid
- Check that customers have Square IDs (created automatically on first sync)

#### 3. Webhook Events Not Received

**Cause**: Webhook URL not configured or signature mismatch

**Solution**:
- Verify webhook URL is publicly accessible
- Check `SQUARE_WEBHOOK_SIGNATURE_KEY` matches Square Dashboard
- Ensure your server allows POST requests to `/api/v1/webhooks/square`

#### 4. Sync Job Failing

**Cause**: API rate limits or network issues

**Solution**:
- Check Square API status
- Review error logs: `tail -f logs/square-sync.log`
- Reduce sync frequency if hitting rate limits

### Checking Logs

Monitor sync activity in the audit logs:

```sql
-- View recent sync activity
SELECT * FROM audit_logs 
WHERE action LIKE 'square_%' 
ORDER BY created_at DESC 
LIMIT 20;

-- Check for sync errors
SELECT * FROM audit_logs 
WHERE action = 'square_sync_job_failed' 
ORDER BY created_at DESC;
```

## Best Practices

1. **Regular Monitoring**: Check the Square sync status widget daily
2. **Customer Data**: Ensure all customers have valid email addresses
3. **Time Zones**: Square uses UTC; ensure your server time is configured correctly
4. **Error Handling**: Set up alerts for sync failures
5. **Backup**: Regular database backups before major syncs

## API Endpoints

The following endpoints are available for Square sync management:

### Get Sync Status
```
GET /api/v1/square-sync/status
```

Returns current configuration and last sync information.

### Trigger Manual Sync
```
POST /api/v1/square-sync/run
Body: {
  "startDate": "2024-01-01T00:00:00Z",  // Optional
  "endDate": "2024-12-31T23:59:59Z"     // Optional
}
```

### Get Appointments with Square Status
```
GET /api/v1/square-sync/appointments?hasSquareId=true&limit=50
```

## Security Considerations

1. **API Keys**: Never commit Square API keys to version control
2. **Webhook Validation**: Always verify webhook signatures
3. **Access Control**: Only admin users can trigger manual syncs
4. **Data Privacy**: Customer data synced to Square follows their privacy policy

## Support

For issues with Square Booking sync:

1. Check this documentation first
2. Review error logs in the dashboard
3. Contact Square Support for API-related issues
4. Submit issues to the development team for sync-specific problems
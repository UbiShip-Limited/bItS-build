# Square API Setup Requirements

## Required OAuth Scopes

For the dashboard to display revenue correctly, your Square Access Token needs the following OAuth scopes:

### Essential Scopes:
- **PAYMENTS_READ** - Read payment information
- **ORDERS_READ** - Read order information  
- **MERCHANT_PROFILE_READ** - Read merchant/location information

### Additional Scopes (for full functionality):
- **CUSTOMERS_READ** - Read customer data
- **CUSTOMERS_WRITE** - Create/update customers
- **INVOICES_READ** - Read invoice data
- **INVOICES_WRITE** - Create/send invoices
- **APPOINTMENTS_READ** - Read booking data
- **APPOINTMENTS_WRITE** - Create/update bookings

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Square API Configuration
SQUARE_ACCESS_TOKEN=your_access_token_here
SQUARE_APPLICATION_ID=your_app_id_here
SQUARE_LOCATION_ID=your_location_id_here
SQUARE_ENVIRONMENT=sandbox  # or 'production' for live
SQUARE_WEBHOOK_SIGNATURE_KEY=your_webhook_signature_key  # For webhook verification
```

## How to Get Your Square Credentials

### 1. Access Token with Correct Permissions

#### For Development/Testing (Sandbox):
1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Select your sandbox application
3. Go to "Sandbox Test Accounts"
4. Copy the **Sandbox Access Token**

#### For Production:
1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Select your production application
3. Go to "OAuth" section
4. Click "Get Personal Access Token"
5. Select ALL the required scopes listed above
6. Generate the token
7. **Important**: Save this token immediately - you can't view it again!

### 2. Location ID
1. In Square Dashboard, go to "Locations"
2. Select your location
3. Copy the Location ID from the URL or details

### 3. Application ID
1. In Square Developer Dashboard
2. Select your application
3. Find the Application ID on the main page

## Webhook Configuration

For payment notifications to work:

1. Go to Square Developer Dashboard
2. Select your application
3. Go to "Webhooks"
4. Add endpoint URL: `https://yourdomain.com/api/v1/webhooks/square`
5. Subscribe to these events:
   - `payment.created`
   - `payment.updated`
   - `invoice.payment_made`
   - `checkout.created`
   - `checkout.updated`
6. Save the **Webhook Signature Key** to your environment variables

## Testing Your Setup

Run this command to verify Square API access:

```bash
npx tsx scripts/test-square-revenue.ts
```

This will:
- Check if credentials are configured
- Attempt to fetch payments
- Display revenue totals
- Show any permission errors

## Common Issues

### "UNAUTHORIZED" or 401 Error
- Your access token is invalid or expired
- Generate a new token with the correct scopes

### "FORBIDDEN" or 403 Error  
- Your token lacks required permissions
- Regenerate token with PAYMENTS_READ and ORDERS_READ scopes

### "NOT_FOUND" or 404 Error
- Wrong location ID
- Check you're using the correct environment (sandbox vs production)

### Revenue Shows $0.00
- No completed payments in the time period
- Payments exist but aren't marked as COMPLETED
- Wrong location ID configured

## Syncing Historical Data

To import existing Square payments into your database:

```bash
npx tsx scripts/sync-square-payments.ts
```

This will fetch the last 30 days of payments and store them locally for faster dashboard loading.
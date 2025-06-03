# Square Payment Integration Setup Guide

## Overview

This guide covers the complete setup and configuration of Square payment integration for the Bowen Island Tattoo Shop application.

## Prerequisites

1. Square Developer Account
2. Square Application created in the Square Developer Dashboard
3. Access to production/sandbox credentials

## Environment Setup

### 1. Square Credentials

Add the following to your `.env` file:

```env
# Square API Configuration
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_ENVIRONMENT=sandbox # or production
SQUARE_APPLICATION_ID=your_application_id  
SQUARE_LOCATION_ID=your_location_id
SQUARE_WEBHOOK_SIGNATURE_KEY=your_webhook_signature_key

# Application Configuration
APP_URL=https://your-domain.com
MERCHANT_SUPPORT_EMAIL=support@bowenislandtattoo.com
```

### 2. Getting Square Credentials

1. **Access Token**:
   - Log in to [Square Developer Dashboard](https://developer.squareup.com)
   - Navigate to your application
   - Copy the sandbox/production access token

2. **Application ID**:
   - Found in the application overview page
   - Starts with "sq0idp-" for production or "sandbox-sq0idp-" for sandbox

3. **Location ID**:
   - Go to Locations in the Square Dashboard
   - Copy the location ID for your shop

4. **Webhook Signature Key**:
   - In Square Developer Dashboard, go to Webhooks
   - Create a webhook endpoint pointing to: `https://your-domain.com/api/webhooks/square`
   - Copy the signature key

## Database Setup

Run the database migrations if not already done:

```bash
npx prisma migrate deploy
```

This creates the necessary tables:
- `payment_links` - Stores payment link references
- `checkout_sessions` - Stores checkout session data
- `payments` - Records payment transactions
- `invoices` - Stores invoice records

## Feature Overview

### 1. Payment Links
Quick payment collection for deposits, consultations, or full payments.

**Use Cases**:
- Consultation fees ($35 minimum)
- Drawing consultations ($50 minimum)
- Tattoo deposits ($75 minimum)
- Final payments ($100 minimum)

### 2. Invoices
Detailed billing with optional payment schedules.

**Use Cases**:
- Split payments (deposit + balance)
- Detailed line items
- Scheduled due dates
- Multiple delivery methods (Email, SMS, Manual)

### 3. Checkout Sessions
Complex orders with multiple items.

**Use Cases**:
- Tattoo session + aftercare products
- Multiple service bookings
- Custom checkout flows

## Integration Points

### Frontend Components

1. **PaymentButton** - Simple payment link creation
```tsx
<PaymentButton
  customerId={customerId}
  appointmentId={appointmentId}
  defaultAmount={150}
  defaultType={PaymentType.TATTOO_DEPOSIT}
  onSuccess={(paymentLink) => console.log('Created:', paymentLink)}
/>
```

2. **PaymentDropdown** - Multiple payment options
```tsx
<PaymentDropdown
  customerId={customerId}
  appointmentId={appointmentId}
  defaultAmount={800}
  showInvoiceOption={true}
  onSuccess={(result) => console.log('Payment created')}
/>
```

3. **CreatePaymentLinkModal** - Full payment link creation form
4. **CreateInvoiceModal** - Invoice creation with payment schedules

### API Endpoints

- `POST /api/payments/links` - Create payment link
- `GET /api/payments/links` - List payment links
- `GET /api/payments/links/:id` - Get payment link details
- `DELETE /api/payments/links/:id` - Cancel payment link
- `POST /api/payments/invoices` - Create invoice
- `POST /api/payments/checkout` - Create checkout session

### Webhooks

Configure webhook endpoint in Square Dashboard:
```
https://your-domain.com/api/webhooks/square
```

Handled events:
- `payment.created` - Payment initiated
- `payment.updated` - Payment status changed
- `invoice.payment_made` - Invoice paid
- `checkout.created` - Checkout session created
- `checkout.updated` - Checkout session updated

## Testing

### 1. Sandbox Testing

Use Square's test card numbers:
- **Success**: 4111 1111 1111 1111
- **Declined**: 4000 0000 0000 0002
- **CVV Failure**: 4000 0000 0000 0010

### 2. Test Payment Flow

```bash
# Run integration tests
npm test lib/__tests__/integration/square-payment-flow.test.ts

# Run service tests
npm test lib/__tests__/services/paymentLinkService.test.ts
```

### 3. Manual Testing

1. Create a test appointment
2. Navigate to appointment details
3. Click "Request Payment" button
4. Fill in payment details
5. Verify payment link is created
6. Test the payment link in Square's sandbox

## Common Issues & Solutions

### Issue: "SQUARE_ACCESS_TOKEN is required"
**Solution**: Ensure all Square environment variables are set in `.env`

### Issue: "Customer not found or missing Square ID"
**Solution**: Ensure customers are created with Square integration enabled

### Issue: Payment link creation fails
**Solution**: 
1. Check Square API credentials
2. Verify location ID is correct
3. Ensure amount meets minimum requirements

### Issue: Webhook signature verification fails
**Solution**:
1. Verify webhook signature key is correct
2. Ensure webhook URL is exactly as configured in Square
3. Check server logs for signature mismatch details

## Production Checklist

- [ ] Switch `SQUARE_ENVIRONMENT` to "production"
- [ ] Update `SQUARE_ACCESS_TOKEN` to production token
- [ ] Update webhook URL in Square Dashboard to production URL
- [ ] Test payment flow with real card (small amount)
- [ ] Verify webhook events are being received
- [ ] Set up monitoring for payment failures
- [ ] Configure error alerting
- [ ] Review and test refund process
- [ ] Ensure SSL certificate is valid (required for Square)

## Monitoring & Maintenance

### Daily Checks
- Review payment success rate in Square Dashboard
- Check for failed webhook deliveries
- Monitor application logs for payment errors

### Weekly Tasks
- Reconcile payments in Square Dashboard
- Review and process any pending refunds
- Check for any stuck checkout sessions

### Monthly Tasks
- Review payment analytics
- Update Square SDK if new version available
- Audit payment security settings

## Support Resources

- [Square API Documentation](https://developer.squareup.com/docs)
- [Square Checkout API Reference](https://developer.squareup.com/reference/square/checkout-api)
- [Square Status Page](https://www.issquareup.com/)
- Application logs: Check `/logs/payment-*.log`
- Audit trail: Query `audit_logs` table for payment actions 
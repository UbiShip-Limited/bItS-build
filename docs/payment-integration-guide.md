# Square Payment Integration Guide

## Overview

The Bowen Island Tattoo Shop application now supports multiple secure payment methods through Square, without storing any payment information in our database.

## Available Payment Methods

### 1. Payment Links
Best for: Quick payments, deposits, consultations

```javascript
// Create a payment link
const response = await fetch('/api/payments/links', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    amount: 150.00,
    title: 'Tattoo Consultation - John Doe',
    description: 'Initial consultation for sleeve tattoo design',
    customerId: 'customer-123',
    appointmentId: 'appointment-456',
    paymentType: 'consultation',
    allowTipping: true,
    customFields: [
      { title: 'Preferred consultation date' },
      { title: 'Design style preferences' }
    ]
  })
});

const { data } = await response.json();
console.log('Payment link URL:', data.url);
// Send this URL to customer via email/SMS
```

### 2. Invoices
Best for: Scheduled payments, deposits + final payments

```javascript
// Create an invoice with payment schedule
const response = await fetch('/api/payments/invoices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    customerId: 'customer-123',
    appointmentId: 'appointment-456',
    items: [
      {
        description: 'Full sleeve tattoo - 8 hour session',
        amount: 1200.00
      }
    ],
    paymentSchedule: [
      {
        amount: 300.00,
        dueDate: '2024-02-01',
        type: 'DEPOSIT'
      },
      {
        amount: 900.00,
        dueDate: '2024-02-15',
        type: 'BALANCE'
      }
    ],
    deliveryMethod: 'EMAIL'
  })
});

const { data } = await response.json();
console.log('Invoice sent to customer');
```

### 3. Checkout Sessions
Best for: Multiple items, complex orders

```javascript
// Create a checkout session
const response = await fetch('/api/payments/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    customerId: 'customer-123',
    appointmentId: 'appointment-456',
    items: [
      {
        name: 'Tattoo Session - 4 hours',
        quantity: 1,
        price: 600.00,
        note: 'Includes setup and aftercare kit'
      },
      {
        name: 'Premium Aftercare Package',
        quantity: 1,
        price: 45.00
      }
    ],
    redirectUrl: 'https://bowenislandtattoo.com/booking/success'
  })
});

const { data } = await response.json();
// Redirect customer to Square checkout
window.location.href = data.checkoutUrl;
```

## API Endpoints

### Payment Links

- `POST /payments/links` - Create a payment link
- `GET /payments/links` - List all payment links
- `GET /payments/links/:id` - Get payment link details
- `DELETE /payments/links/:id` - Delete a payment link

### Invoices

- `POST /payments/invoices` - Create an invoice

### Checkout

- `POST /payments/checkout` - Create a checkout session

## Webhook Integration

Square will send webhook notifications for payment events. Configure your webhook endpoint in Square Dashboard:

```
https://your-domain.com/api/webhooks/square
```

### Webhook Events Handled

- `payment.created` - When a payment is created
- `payment.updated` - When a payment status changes
- `invoice.payment_made` - When an invoice is paid
- `checkout.created` - When a checkout session is created
- `checkout.updated` - When a checkout session is updated

## Security Best Practices

1. **Never store card details** - All payment information is handled by Square
2. **Use HTTPS** - Always use secure connections
3. **Verify webhooks** - The webhook handler verifies signatures automatically
4. **Limit access** - Only admin and artist roles can create payment links
5. **Track everything** - All payment actions are logged in the audit log

## Environment Variables

Add these to your `.env` file:

```env
# Square API Configuration
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_ENVIRONMENT=sandbox # or production
SQUARE_APPLICATION_ID=your_application_id
SQUARE_LOCATION_ID=your_location_id
SQUARE_WEBHOOK_SIGNATURE_KEY=your_webhook_signature_key

# Merchant Configuration
MERCHANT_SUPPORT_EMAIL=support@bowenislandtattoo.com
```

## Testing

### Sandbox Environment

Use Square's sandbox environment for testing:
- Test card numbers are available in [Square documentation](https://developer.squareup.com/docs/testing/test-values)
- Webhook events can be simulated from Square Dashboard
- All payment links in sandbox mode will use test payment forms

### Test Card Numbers

- **Success**: 4111 1111 1111 1111
- **Declined**: 4000 0000 0000 0002
- **CVV Failure**: 4000 0000 0000 0010

## Common Use Cases

### 1. Consultation Payment

```javascript
// When booking a consultation
const paymentLink = await createPaymentLink({
  amount: 50.00,
  title: 'Tattoo Consultation',
  customerId: customer.id,
  appointmentId: appointment.id,
  paymentType: 'consultation',
  description: 'Initial design consultation'
});

// Send link to customer
await sendEmail(customer.email, paymentLink.url);
```

### 2. Tattoo Session with Deposit

```javascript
// Create invoice with deposit schedule
const invoice = await createInvoice({
  customerId: customer.id,
  appointmentId: appointment.id,
  items: [{
    description: 'Custom tattoo design and application',
    amount: 800.00
  }],
  paymentSchedule: [
    {
      amount: 200.00,
      dueDate: getDepositDueDate(),
      type: 'DEPOSIT'
    },
    {
      amount: 600.00,
      dueDate: getSessionDate(),
      type: 'BALANCE'
    }
  ]
});
```

### 3. Walk-in Payment

```javascript
// Quick payment link for walk-in customer
const paymentLink = await createPaymentLink({
  amount: 150.00,
  title: 'Walk-in Tattoo Service',
  customerId: customer.id,
  paymentType: 'tattoo_final',
  allowTipping: true
});

// Display QR code or send link
displayPaymentQR(paymentLink.url);
```

## Error Handling

All endpoints return consistent error responses:

```javascript
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

Common error codes:
- `400` - Bad request (invalid parameters)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `500` - Server error

## Support

For Square-specific issues:
- [Square Developer Documentation](https://developer.squareup.com)
- [Square Support](https://squareup.com/help)

For application issues:
- Check the audit logs for detailed error information
- Contact your system administrator 
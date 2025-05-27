# Frontend Payment Integration Guide

## Overview

The Bowen Island Tattoo Shop frontend now includes comprehensive Square payment integration components that allow admins and artists to create payment links, invoices, and manage payments without storing any sensitive payment information.

## Components

### 1. Payment Service (`src/lib/api/services/paymentService.ts`)

The payment service provides all the API methods for interacting with the payment backend:

```typescript
import { paymentService, PaymentType } from '@/lib/api/services/paymentService';

// Create a payment link
const response = await paymentService.createPaymentLink({
  amount: 150.00,
  title: 'Tattoo Consultation',
  customerId: 'customer-123',
  paymentType: PaymentType.CONSULTATION
});

// List payment links
const links = await paymentService.listPaymentLinks();

// Create an invoice
const invoice = await paymentService.createInvoice({
  customerId: 'customer-123',
  items: [{ description: 'Tattoo Session', amount: 500 }]
});
```

### 2. Payment Button Component (`src/components/payments/PaymentButton.tsx`)

A reusable button component for quickly creating payment links:

```tsx
import PaymentButton from '@/components/payments/PaymentButton';

<PaymentButton
  customerId={customer.id}
  customerName={customer.name}
  appointmentId={appointment.id}
  defaultAmount={150.00}
  defaultType={PaymentType.TATTOO_DEPOSIT}
  buttonText="Request Deposit"
  onSuccess={() => {
    // Handle success
  }}
/>
```

### 3. Payment Dropdown Component

For offering multiple payment options:

```tsx
import { PaymentDropdown } from '@/components/payments/PaymentButton';

<PaymentDropdown
  customerId={customer.id}
  customerName={customer.name}
  appointmentId={appointment.id}
  showInvoiceOption={true}
  onSuccess={() => {
    // Handle success
  }}
/>
```

### 4. Create Payment Link Modal (`src/components/payments/CreatePaymentLinkModal.tsx`)

A full-featured modal for creating payment links with validation:

```tsx
import CreatePaymentLinkModal from '@/components/payments/CreatePaymentLinkModal';

const [showModal, setShowModal] = useState(false);

<CreatePaymentLinkModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  customerId={customer.id}
  customerName={customer.name}
  appointmentId={appointment.id}
  defaultAmount={200.00}
  defaultType={PaymentType.TATTOO_DEPOSIT}
  onSuccess={(paymentLink) => {
    console.log('Payment link created:', paymentLink.url);
  }}
/>
```

### 5. Create Invoice Modal (`src/components/payments/CreateInvoiceModal.tsx`)

For creating detailed invoices with payment schedules:

```tsx
import CreateInvoiceModal from '@/components/payments/CreateInvoiceModal';

<CreateInvoiceModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  customerId={customer.id}
  customerName={customer.name}
  appointmentId={appointment.id}
  onSuccess={(invoice) => {
    console.log('Invoice created:', invoice.publicUrl);
  }}
/>
```

## Payment Types

The system supports four payment types:

```typescript
enum PaymentType {
  CONSULTATION = 'consultation',              // Min: $35
  DRAWING_CONSULTATION = 'drawing_consultation', // Min: $50
  TATTOO_DEPOSIT = 'tattoo_deposit',         // Min: $75
  TATTOO_FINAL = 'tattoo_final'              // Min: $100
}
```

## Integration Examples

### In Appointment Details

```tsx
// In your appointment details component
import PaymentButton from '@/components/payments/PaymentButton';
import { PaymentType } from '@/lib/api/services/paymentService';

function AppointmentDetails({ appointment }) {
  return (
    <div>
      {/* Other appointment details */}
      
      <div className="payment-actions">
        {!appointment.depositPaid && (
          <PaymentButton
            customerId={appointment.customerId}
            customerName={appointment.customerName}
            appointmentId={appointment.id}
            defaultAmount={appointment.priceQuote * 0.25}
            defaultType={PaymentType.TATTOO_DEPOSIT}
            buttonText="Request Deposit"
          />
        )}
        
        {appointment.status === 'completed' && (
          <PaymentButton
            customerId={appointment.customerId}
            customerName={appointment.customerName}
            appointmentId={appointment.id}
            defaultAmount={appointment.priceQuote}
            defaultType={PaymentType.TATTOO_FINAL}
            buttonText="Request Final Payment"
          />
        )}
      </div>
    </div>
  );
}
```

### In Customer Profile

```tsx
// In customer profile component
import { PaymentDropdown } from '@/components/payments/PaymentButton';

function CustomerProfile({ customer }) {
  return (
    <div>
      {/* Customer details */}
      
      <div className="actions">
        <PaymentDropdown
          customerId={customer.id}
          customerName={customer.name}
          showInvoiceOption={true}
        />
      </div>
    </div>
  );
}
```

### In Tattoo Request Management

```tsx
// When approving a tattoo request
import PaymentButton from '@/components/payments/PaymentButton';

function TattooRequestActions({ request }) {
  return (
    <PaymentButton
      customerId={request.customerId}
      tattooRequestId={request.id}
      defaultAmount={request.estimatedPrice}
      defaultType={PaymentType.TATTOO_DEPOSIT}
      buttonText="Send Deposit Request"
      onSuccess={() => {
        // Update request status
      }}
    />
  );
}
```

## Payment Management Dashboard

The payment management dashboard is available at `/dashboard/payments` and provides:

- Quick actions to create payment links and invoices
- List of all payment links with status
- Copy link functionality
- Delete payment links
- Direct link access

## Best Practices

1. **Always provide customer context**: Pass `customerId` and `customerName` to payment components
2. **Link to appointments/requests**: Use `appointmentId` or `tattooRequestId` to associate payments
3. **Set appropriate defaults**: Pre-fill amounts and payment types based on context
4. **Handle success callbacks**: Update your UI after successful payment creation
5. **Validate minimum amounts**: The system enforces minimum amounts per payment type

## Error Handling

All payment components include built-in error handling and display user-friendly error messages. Common errors:

- Minimum amount validation
- Network errors
- Missing customer information
- Square API errors

## Security

- No payment card information is ever stored in the application
- All payment processing is handled by Square's secure infrastructure
- Payment links expire according to Square's policies
- Webhook signatures are verified for all payment notifications

## Testing

When testing in development:

1. Ensure Square sandbox credentials are configured
2. Use test card numbers from Square documentation
3. Payment links will use Square's test payment forms
4. Webhooks can be tested using Square's webhook simulator

## Customization

### Styling

All components use Tailwind CSS classes and can be customized:

```tsx
<PaymentButton
  buttonVariant="secondary" // 'primary' | 'secondary' | 'ghost'
  className="custom-class"
/>
```

### Custom Fields

Payment links support custom fields:

```tsx
await paymentService.createPaymentLink({
  // ... other params
  customFields: [
    { title: 'Preferred appointment date' },
    { title: 'Special requests' }
  ]
});
```

### Redirect URLs

Configure where customers go after payment:

```tsx
await paymentService.createPaymentLink({
  // ... other params
  redirectUrl: 'https://yoursite.com/payment-success'
});
``` 
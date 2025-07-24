# Square Integration Test Data Guide

This guide walks you through testing the Square integration using sandbox test data.

## Prerequisites

1. **Square Sandbox Account**: Ensure you have access to Square's sandbox environment
2. **Environment Variables**: Configure your `.env` file with:
   ```
   SQUARE_ENVIRONMENT=sandbox
   SQUARE_ACCESS_TOKEN=your_sandbox_access_token
   SQUARE_LOCATION_ID=your_sandbox_location_id
   ```

## Step 1: Generate Test Data

Run the test data creation script to populate your Square sandbox with realistic tattoo shop data:

```bash
npm run create:square-test-data
```

This creates:
- **5 test customers** with different scenarios:
  - John Smith: Regular client with multiple sessions (full back piece)
  - Sarah Johnson: New consultation client
  - Mike Chen: Walk-in customer
  - Emma Wilson: Deposit-only customer
  - Alex Rivera: Completed project with refund scenario

- **Various payment types**:
  - Consultation fees ($50-$100)
  - Deposits ($200-$300)
  - Session payments ($800-$1,500)
  - Touch-ups and refunds

## Step 2: Verify in Square Sandbox

1. Log into your [Square Sandbox Dashboard](https://squareup.com/dashboard/sales/transactions)
2. Navigate to **Customers** to see the created test customers
3. Check **Transactions** to verify all payments were created
4. Note any refunded transactions (Alex Rivera should have one)

## Step 3: Test Import Process

### Dry Run First
Always start with a dry run to preview what will be imported:

```bash
npm run import:square:enhanced -- --dry-run
```

Review the output to ensure:
- Customer count matches expectations
- Payment totals are correct
- No unexpected errors

### Run Actual Import
```bash
npm run import:square:enhanced
```

Expected output:
```
🔄 Starting Square data import...
📊 Import Summary:
  - 5 customers processed
  - 5 customers imported successfully
  - 16 payments imported successfully
  - 1 payment skipped (refunded)
```

## Step 4: Verify Database Import

### Using Prisma Studio
```bash
npx prisma studio
```

Check the following tables:
1. **Customer** table: Verify all 5 test customers
2. **Payment** table: Confirm payment records with correct amounts
3. **squareCustomerId** and **squarePaymentId** fields should be populated

### Quick Database Check
```bash
# Count customers
npx prisma db execute --sql "SELECT COUNT(*) FROM \"Customer\" WHERE email LIKE '%example.com'"

# Check recent payments
npx prisma db execute --sql "SELECT * FROM \"Payment\" ORDER BY \"createdAt\" DESC LIMIT 10"
```

## Step 5: Test Dashboard Display

1. Start the development server:
   ```bash
   npm run dev:all
   ```

2. Navigate to the payments dashboard:
   - Go to `http://localhost:3000/dashboard/payments`
   - Verify imported payments appear
   - Check payment statistics (total revenue, payment methods)

3. Test customer views:
   - Click on a customer name to view payment history
   - Verify all payments for that customer are displayed

## Validation Checklist

- [ ] All 5 test customers imported successfully
- [ ] Payment amounts converted correctly (cents to dollars)
- [ ] Payment dates preserved from Square
- [ ] Payment methods mapped properly (CASH, CREDIT_CARD)
- [ ] Customer-payment relationships maintained
- [ ] Dashboard statistics calculate correctly
- [ ] Refunded payment handled appropriately
- [ ] Square IDs stored for future reference

## Common Issues & Solutions

### Issue: Payments not appearing
- Verify `SQUARE_LOCATION_ID` matches your sandbox location
- Check if payments are within the default date range (last 12 months)

### Issue: Customer duplicates
- The import script checks for existing customers by email
- Clear test data with: `npx prisma db execute --sql "DELETE FROM \"Customer\" WHERE email LIKE '%example.com'"`

### Issue: Authentication errors
- Ensure you're using SANDBOX access token, not production
- Verify `SQUARE_ENVIRONMENT=sandbox` in .env

## Cleanup Test Data

To remove test data after testing:

```sql
-- Remove test payments
DELETE FROM "Payment" WHERE "customerId" IN (
  SELECT id FROM "Customer" WHERE email LIKE '%example.com'
);

-- Remove test customers
DELETE FROM "Customer" WHERE email LIKE '%example.com';
```

## Next Steps

After successful testing:
1. Document any customizations needed for production
2. Plan production data migration strategy
3. Set up monitoring for Square webhook events
4. Configure production Square credentials when ready
# Square Integration Developer Setup Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- Square account credentials from shop owner

## Environment Configuration

### 1. Update .env file
Add the following Square configuration to your `.env` file:

```env
# Square API Configuration
SQUARE_ACCESS_TOKEN="YOUR_SANDBOX_OR_PRODUCTION_TOKEN"
SQUARE_APPLICATION_ID="YOUR_APPLICATION_ID"
SQUARE_LOCATION_ID="YOUR_LOCATION_ID"
SQUARE_ENVIRONMENT="sandbox"  # or "production" for live

# Existing configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bowenislandtattoo"
JWT_SECRET="your-secret-key-here"
PORT=3001
NODE_ENV="development"
```

### 2. Verify Square Integration

Run the backend server:
```bash
cd lib
npm run dev
```

The server should start without Square-related errors. You should see:
```
[timestamp] INFO: Server listening at http://0.0.0.0:3001
[timestamp] INFO: Backend server listening on port 3001
```

## Testing Square Integration

### 1. Create a Test Customer
```bash
curl -X POST http://localhost:3001/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "+1234567890"
  }'
```

### 2. Create a Test Appointment with Square Sync
```bash
curl -X POST http://localhost:3001/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUSTOMER_ID_FROM_STEP_1",
    "startAt": "2025-01-20T14:00:00Z",
    "duration": 120,
    "bookingType": "TATTOO_SESSION",
    "note": "Test appointment"
  }'
```

### 3. Check Square Dashboard
- Log into Square Dashboard (or Sandbox)
- Navigate to Appointments
- Verify the appointment was created

## Common Issues and Solutions

### Issue: "SQUARE_ACCESS_TOKEN is required"
**Solution**: Ensure your .env file has all required Square variables

### Issue: "Square sync failed: Customer not found or missing email"
**Solution**: 
- Ensure customer has an email address
- For anonymous appointments, Square sync is skipped

### Issue: "Square sync failed: booking -> appointmentSegments -> [0] -> teamMemberId: Expected string"
**Solution**: This has been fixed in the code. The system now handles appointments without assigned artists.

## Square Integration Features

### Currently Implemented:
1. **Appointment Sync**
   - Creates Square bookings when appointments are created
   - Updates Square bookings when appointments are modified
   - Cancels Square bookings when appointments are cancelled

2. **Customer Requirements**
   - Customers must have email addresses for Square sync
   - Anonymous appointments (no customerId) skip Square sync

3. **Optional Artist Assignment**
   - Appointments can be created without an artist
   - Artist can be assigned later

### Not Yet Implemented:
1. **Square Customer Sync**
   - Creating Square customers from our customer records
   - Syncing customer updates

2. **Square Payments**
   - Processing payments through Square
   - Handling deposits and refunds

3. **Square Catalog Integration**
   - Importing services from Square Catalog
   - Syncing service prices and durations

## Development Workflow

### 1. Sandbox Testing
Always start with sandbox credentials:
- No real money is processed
- Can test all features safely
- Square provides test card numbers

### 2. Integration Testing
Test the full flow:
1. Create customer
2. Create appointment
3. Verify Square booking created
4. Update appointment
5. Verify Square booking updated
6. Cancel appointment
7. Verify Square booking cancelled

### 3. Production Deployment
Before going live:
- [ ] Replace sandbox credentials with production
- [ ] Test with a real appointment
- [ ] Verify Square Dashboard shows bookings
- [ ] Set up error monitoring
- [ ] Configure backup/fallback for Square outages

## API Endpoints with Square Integration

### Appointments
- `POST /api/appointments` - Creates appointment and Square booking
- `PUT /api/appointments/:id` - Updates appointment and Square booking
- `POST /api/appointments/:id/cancel` - Cancels appointment and Square booking

### Response Format
```json
{
  "success": true,
  "appointment": {
    "id": "uuid",
    "customerId": "uuid",
    "startTime": "2025-01-20T14:00:00Z",
    "duration": 120,
    "squareId": "square_booking_id"
  },
  "squareId": "square_booking_id"
}
```

## Monitoring Square Integration

### Check Logs
Square sync failures are logged but don't fail the request:
```
[timestamp] WARN: Square sync failed: [error message]
```

### Audit Logs
Check the audit_logs table for Square-related entries:
```sql
SELECT * FROM audit_logs 
WHERE action LIKE 'square_%' 
ORDER BY created_at DESC;
```

## Security Best Practices

1. **Never commit .env files**
2. **Use environment variables in production**
3. **Rotate access tokens periodically**
4. **Monitor for unusual API usage**
5. **Implement rate limiting**

## Next Steps

1. **Test with shop owner's sandbox credentials**
2. **Implement remaining Square features as needed**
3. **Set up production monitoring**
4. **Create admin UI for Square sync status**
5. **Add Square webhook support for real-time updates** 
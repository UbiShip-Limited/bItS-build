# Bowen Island Tattoo Shop API Documentation

## Overview

This is the backend API for the Bowen Island Tattoo Shop built with Fastify and Prisma. The API provides comprehensive business management capabilities including customer management, appointment booking, payment processing, and tattoo request workflows.

## Base URL

- Development: `http://localhost:3001`
- Production: `https://your-production-url.com`

## Authentication

Most endpoints require authentication using Bearer tokens from Supabase Auth. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Architecture

### Core Services
- **AppointmentService**: Handles all appointment/booking operations
- **TattooRequestService**: Manages tattoo request submissions and conversions
- **PaymentService**: Handles payment processing with Square integration
- **EnhancedCustomerService**: Customer relationship management with analytics
- **SquareIntegrationService**: Integrates with Square for payments and bookings
- **CloudinaryService**: Image upload and gallery management
- **RealtimeService**: Server-Sent Events for real-time notifications
- **UserService**: User management and authentication
- **AuditService**: Audit logging for all critical operations
- **CommunicationService**: Handles customer communications (email/SMS) for custom notifications beyond Square's automatic ones

### Supporting Services
- **AvailabilityService**: Appointment slot availability management
- **TattooRequestWorkflowService**: Workflow management for tattoo requests
- **PaymentLinkService**: Square payment link generation
- **EmailService**: Email notifications (when configured)
- **AnalyticsService**: Business analytics and reporting

## API Endpoints

### Health Check

#### Health Status
```
GET /health
```
No authentication required. Returns server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": 12345,
  "environment": "production",
  "services": {
    "database": "connected",
    "square": "configured",
    "cloudinary": "configured"
  }
}
```

### Authentication

#### Verify Staff Access Code
```
POST /auth/verify-staff-access
```
No authentication required. Rate limited to 10 attempts per 15 minutes.

**Body:**
```json
{
  "accessCode": "your-access-code"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Access granted"
}
```

### Users

#### Get Current User Profile
```
GET /users/me
```
Requires authentication. Available to all authenticated users.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "artist",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### List All Users (Admin only)
```
GET /users?page=1&limit=20
```

#### Get User by ID (Admin only)
```
GET /users/:id
```

#### Create User (Admin only)
```
POST /users
```

**Body:**
```json
{
  "email": "user@example.com",
  "role": "artist",
  "password": "securepassword",
  "sendInvite": false
}
```

#### Update User (Admin only)
```
PUT /users/:id
```

### Customers

#### List Customers (Admin/Artist only)
```
GET /customers?search=john&page=1&limit=20
```

**Query Parameters:**
- `search`: Search by name, email, or phone
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)

#### Get Customer by ID (Admin/Artist only)
```
GET /customers/:id
```

#### Create Customer (Admin/Artist only)
```
POST /customers
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "notes": "Prefers traditional style"
}
```

#### Update Customer (Admin/Artist only)
```
PUT /customers/:id
```

### Tattoo Requests

#### Submit a Tattoo Request (Public)
```
POST /tattoo-requests
```
Rate limited to 3 submissions per hour per IP.

**Body:**
```json
{
  "contactEmail": "customer@example.com",
  "contactPhone": "123-456-7890",
  "description": "Detailed description of the tattoo",
  "placement": "upper arm",
  "size": "medium",
  "colorPreference": "black and grey",
  "style": "traditional",
  "purpose": "new_tattoo",
  "preferredArtist": "Any artist",
  "timeframe": "1-3 months",
  "contactPreference": "email",
  "additionalNotes": "Any additional information",
  "referenceImages": [
    {
      "url": "https://example.com/image.jpg",
      "publicId": "cloudinary_id"
    }
  ]
}
```

#### Upload Images for Tattoo Request (Public)
```
POST /tattoo-requests/upload-images
```
Multipart form upload. Rate limited to 3 uploads per hour per IP.

#### List Tattoo Requests (Admin/Artist only)
```
GET /tattoo-requests?status=new&page=1&limit=20
```

#### Update Tattoo Request Status (Admin/Artist only)
```
PUT /tattoo-requests/:id/status
```

**Body:**
```json
{
  "status": "reviewed"
}
```

#### Convert to Appointment (Admin/Artist only)
```
POST /tattoo-requests/:id/convert-to-appointment
```

**Body:**
```json
{
  "startAt": "2024-01-01T10:00:00Z",
  "duration": 120,
  "artistId": "uuid",
  "bookingType": "tattoo_session",
  "priceQuote": 500,
  "note": "First session"
}
```

#### Link Images to Request (Admin/Artist only)
```
POST /tattoo-requests/:id/link-images
```

### Appointments

#### List Appointments (Admin/Artist only)
```
GET /appointments?status=scheduled&customerId=uuid&from=2024-01-01&to=2024-12-31&page=1&limit=20
```

#### Get Appointment by ID (Admin/Artist only)
```
GET /appointments/:id
```

#### Create Appointment (Admin/Artist only)
```
POST /appointments
```

**Body:**
```json
{
  "customerId": "uuid",
  "contactEmail": "customer@example.com",
  "contactPhone": "123-456-7890",
  "startAt": "2024-01-01T10:00:00Z",
  "duration": 120,
  "bookingType": "tattoo_session",
  "artistId": "uuid",
  "note": "Additional notes",
  "priceQuote": 500.00
}
```

#### Update Appointment (Admin/Artist only)
```
PUT /appointments/:id
```

#### Cancel Appointment (Admin/Artist only)
```
POST /appointments/:id/cancel
```

**Body:**
```json
{
  "reason": "Customer requested cancellation"
}
```

#### Get Appointment Notification Status (Admin/Artist only)
```
GET /appointments/:id/notifications
```

Returns the notification status for an appointment, including Square automatic notifications and communication history.

**Response:**
```json
{
  "success": true,
  "appointmentId": "uuid",
  "squareNotificationsEnabled": true,
  "communicationHistory": [
    {
      "id": "log-uuid",
      "type": "booking_created_webhook",
      "sentAt": "2024-01-01T10:00:00Z",
      "details": {
        "squareBookingId": "square-id",
        "notificationsSent": true,
        "notificationType": "square_automatic"
      }
    }
  ]
}
```

#### Create Anonymous Appointment (Public)
```
POST /appointments/anonymous
```

**Body:**
```json
{
  "contactEmail": "customer@example.com",
  "contactPhone": "123-456-7890",
  "startAt": "2024-01-01T10:00:00Z",
  "duration": 60,
  "bookingType": "consultation",
  "note": "First time consultation"
}
```

### Payments

#### List Payments (Admin/Artist only)
```
GET /payments?customerId=uuid&status=completed&page=1&limit=20&includeSquare=true
```

#### Process Payment (Admin/Artist only)
```
POST /payments
```

**Body for Payment Link:**
```json
{
  "type": "payment_link",
  "amount": 500,
  "customerId": "uuid",
  "paymentType": "tattoo_deposit",
  "title": "Tattoo Deposit",
  "description": "Deposit for sleeve tattoo",
  "redirectUrl": "https://example.com/success"
}
```

**Body for Invoice:**
```json
{
  "type": "invoice",
  "customerId": "uuid",
  "items": [
    {
      "description": "Tattoo Session",
      "amount": 500
    }
  ],
  "deliveryMethod": "EMAIL"
}
```

**Body for Direct Payment:**
```json
{
  "type": "direct_payment",
  "sourceId": "card_nonce",
  "amount": 500,
  "customerId": "uuid",
  "paymentType": "tattoo_final",
  "note": "Final payment for tattoo"
}
```

#### Admin Payment Operations (Admin only)
```
GET /payments/admin/dashboard
GET /payments/admin/reports?startDate=2024-01-01&endDate=2024-12-31
GET /payments/admin/sync-status
POST /payments/admin/sync-square
```

#### Process Refund (Admin only)
```
POST /payments/refunds
```

**Body:**
```json
{
  "paymentId": "uuid",
  "amount": 100,
  "reason": "Customer request"
}
```

#### Payment Links (Admin/Artist only)
```
GET /payments/links?status=active&page=1&limit=20
POST /payments/links
PUT /payments/links/:id
DELETE /payments/links/:id
```

### Analytics

#### Get Dashboard Metrics (Admin/Artist only)
```
GET /analytics/dashboard?timeframe=today
```

Query parameters:
- `timeframe`: today, yesterday, last7days, last30days, thisMonth, lastMonth, thisYear, custom
- `startDate`: ISO 8601 date string (for custom timeframe)
- `endDate`: ISO 8601 date string (for custom timeframe)

Returns comprehensive business metrics including revenue, appointments, customers, and trends.

#### Get Revenue Analytics (Admin only)
```
GET /analytics/revenue?timeframe=last30days
```

Returns detailed revenue breakdown by payment type, trends, and projections.

#### Get Customer Insights (Admin/Artist only)
```
GET /analytics/customers
```

Returns customer segmentation (new, regular, VIP), retention rates, and lifetime values.

#### Get Appointment Metrics (Admin/Artist only)
```
GET /analytics/appointments?timeframe=last30days
```

Returns appointment efficiency metrics including completion rates, no-show rates, and utilization.

#### Get Tattoo Request Metrics (Admin/Artist only)
```
GET /analytics/requests
```

Returns request conversion rates, popular styles, and rejection reasons.

#### Get Business Trends (Admin only)
```
GET /analytics/trends?period=monthly&metric=revenue
```

Query parameters:
- `period`: daily, weekly, monthly
- `metric`: revenue, appointments, customers

Returns historical data, forecasts, and growth rates.

#### Get Notification Metrics (Admin/Artist only)
```
GET /analytics/notifications?timeframe=last30days
```

Returns Square notification statistics including confirmations and reminders sent.

#### Export Analytics Data (Admin only)
```
GET /analytics/export?type=revenue&format=csv&startDate=2024-01-01&endDate=2024-12-31
```

Query parameters:
- `type`: revenue, appointments, customers, full (required)
- `format`: csv, json (default: csv)
- `startDate`: ISO date string
- `endDate`: ISO date string

Exports analytics data in the requested format.

### Cloudinary (Image Management)

#### Generate Upload Signature (Public)
```
POST /cloudinary/signature/public
```

#### Generate Upload Signature (Authenticated)
```
POST /cloudinary/signature
```

#### Validate Upload
```
POST /cloudinary/validate
```

**Body:**
```json
{
  "publicId": "cloudinary_public_id"
}
```

#### Get Gallery Images
```
GET /cloudinary/gallery?folder=shop_content&artist=Kelly&style=traditional&limit=50
```

#### Get Customer Uploads
```
GET /cloudinary/customer-uploads?customerId=uuid
```

### Events (Server-Sent Events)

#### Subscribe to Real-time Events
```
GET /events?userId=uuid&eventTypes=appointment_created,payment_received&lastEventId=last-id
```

This is a Server-Sent Events endpoint for real-time notifications.

### Audit Logs (Admin only)

#### List Audit Logs
```
GET /audit-logs?userId=uuid&action=CREATE&resource=Customer&from=2024-01-01&to=2024-12-31&page=1&limit=20
```

#### Get User Activity Summary
```
GET /audit-logs/user-activity/:userId?from=2024-01-01&to=2024-12-31
```

### Webhooks

#### Square Webhook
```
POST /webhooks/square
```
Rate limited to 100 requests per minute. Requires Square webhook signature verification.

**Supported Event Types:**
- `payment.created` - When a payment is created
- `payment.updated` - When a payment is updated
- `invoice.payment_made` - When an invoice is paid
- `checkout.created` - When a checkout is created
- `checkout.updated` - When a checkout is updated
- `booking.created` - When a booking/appointment is created (triggers automatic notifications)
- `booking.updated` - When a booking/appointment is updated or cancelled (triggers update notifications)

**Booking Event Details:**
When Square creates or updates a booking, the webhook handler:
1. Updates the appointment status in the database
2. Logs notification delivery in audit logs
3. Tracks that Square has sent automatic SMS/email notifications to the customer

Square automatically sends notifications for bookings based on your Square Dashboard settings.

## Rate Limiting

All endpoints are rate limited to prevent abuse. Rate limit headers are included in responses:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the limit resets

Rate limit categories:
- **AUTH**: 10 requests per 15 minutes (authentication endpoints)
- **WRITE_HEAVY**: 20 requests per minute (create/update operations)
- **READ_HEAVY**: 60 requests per minute (list/search operations)
- **UPLOAD**: 5 requests per minute (file uploads)
- **PUBLIC_SUBMISSION**: 3 requests per hour (public form submissions)
- **WEBHOOK**: 100 requests per minute (webhook endpoints)
- **PAYMENT_CREATION**: 5 requests per minute (payment creation)
- **REFUNDS**: 3 requests per minute (refund processing)

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional information about the error"
}
```

Common HTTP status codes:
- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Missing or invalid authentication
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error
- `503`: Service Unavailable

## Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `SQUARE_ACCESS_TOKEN`: Square API access token
- `SQUARE_LOCATION_ID`: Square location ID
- `SQUARE_ENVIRONMENT`: 'sandbox' or 'production'
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret

Optional:
- `SQUARE_WEBHOOK_SIGNATURE_KEY`: For webhook verification
- `FRONTEND_URL`: Frontend application URL
- `STAFF_ACCESS_CODE`: Staff access verification code

## Frontend Integration

The frontend should use the `/api` prefix for all requests, which will be proxied to the backend server running on port 3001.

Example:
```javascript
// Frontend code
const response = await fetch('/api/tattoo-requests', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(formData)
});
```

## Running the Backend

```bash
# Development
npm run dev:backend

# Production
npm run build:server
npm run start:server

# Run both frontend and backend
npm run dev:all
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- lib/services/__tests__/CustomerService.test.ts
```
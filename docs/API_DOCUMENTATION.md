# Bowen Island Tattoo Shop API Documentation

## Overview

This is the backend API for the Bowen Island Tattoo Shop built with Fastify and Prisma.

## Architecture

### Services
- **AppointmentService**: Handles all appointment/booking operations
- **TattooRequestService**: Manages tattoo request submissions and conversions
- **SquareIntegrationService**: Integrates with Square for payments and bookings
- **CustomerService**: Manages customer data
- **PaymentService**: Handles payment processing

### Deprecated Services
- **BookingService**: This service is deprecated. Use AppointmentService instead.

## API Endpoints

### Tattoo Requests

#### Submit a Tattoo Request
```
POST /tattoo-requests
```

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

**Response:**
```json
{
  "id": "uuid",
  "trackingToken": "uuid-token",
  "contactEmail": "customer@example.com",
  "description": "...",
  "status": "new",
  "createdAt": "2024-01-01T00:00:00Z",
  // ... all other fields
}
```

#### List Tattoo Requests (Admin/Artist only)
```
GET /tattoo-requests?status=new&page=1&limit=20
```

#### Get Tattoo Request by ID (Admin/Artist only)
```
GET /tattoo-requests/:id
```

#### Update Tattoo Request Status (Admin/Artist only)
```
PUT /tattoo-requests/:id
```

#### Convert to Appointment (Admin/Artist only)
```
POST /tattoo-requests/:id/convert-to-appointment
```

### Appointments

#### Create Appointment
```
POST /appointments
```

**Body:**
```json
{
  "customerId": "uuid", // OR contactEmail
  "contactEmail": "customer@example.com",
  "contactPhone": "123-456-7890",
  "startAt": "2024-01-01T10:00:00Z",
  "duration": 120, // minutes
  "bookingType": "tattoo_session",
  "artistId": "uuid",
  "note": "Additional notes",
  "priceQuote": 500.00
}
```

#### List Appointments (Admin/Artist only)
```
GET /appointments?status=scheduled&from=2024-01-01&to=2024-12-31
```

#### Update Appointment (Admin/Artist only)
```
PUT /appointments/:id
```

#### Cancel Appointment (Admin/Artist only)
```
POST /appointments/:id/cancel
```

#### Create Anonymous Appointment
```
POST /appointments/anonymous
```

### Customers

#### List Customers (Admin/Artist only)
```
GET /customers
```

#### Get Customer by ID (Admin/Artist only)
```
GET /customers/:id
```

### Payments

#### Process Consultation Payment
```
POST /payments/consultation
```

#### Process Tattoo Payment
```
POST /payments/tattoo
```

## Frontend Integration

The frontend should use the `/api` prefix for all requests, which will be proxied to the backend server running on port 3001.

Example:
```javascript
// Frontend code
const response = await fetch('/api/tattoo-requests', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(formData)
});
```

## Running the Backend

```bash
# Development
npm run dev:server

# Production
npm run build:server
npm run start:server

# Run both frontend and backend
npm run dev:all
```

## Testing

```bash
# Run backend tests
npm run test:backend

# Run integration tests
npm run test:integration
``` 
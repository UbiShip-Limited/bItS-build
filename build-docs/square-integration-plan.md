# Square Integration and Booking Management Implementation Plan

This document outlines the plan for implementing Square payment integration and booking management for Bowen Island Tattoo Shop.

## Current Status

- Square client implementation exists in `lib/square/index.ts`
- Basic integration tests are working
- Environment variables for Square are configured

## Goals

1. Implement payment processing for:
   - Consultations
   - Drawing consultations
   - Tattoo appointments
2. Create booking management system
3. Build admin dashboard for viewing all bookings and payments

## Implementation Plan

### Phase 1: Backend Square Payment Processing Enhancement

#### 1.1 Extend Square Client (`lib/square/index.ts`)

```typescript
// Add these methods to SquareClient class

// Create a payment method
async createPayment(params: {
  sourceId: string;
  amount: number;
  currency: string;
  customerId?: string;
  note?: string;
  idempotencyKey: string;
  referenceId?: string;
}): Promise<CreatePaymentResponse> {
  const { sourceId, amount, currency, customerId, note, idempotencyKey, referenceId } = params;
  
  return this.client.paymentsApi.createPayment({
    sourceId,
    amountMoney: {
      amount: BigInt(amount * 100), // Convert to cents
      currency
    },
    customerId,
    note,
    idempotencyKey,
    referenceId
  });
}

// Create a customer method
async createCustomer(params: {
  givenName?: string;
  familyName?: string;
  emailAddress?: string;
  phoneNumber?: string;
  idempotencyKey: string;
}): Promise<any> {
  return this.client.customersApi.createCustomer(params);
}

// Create booking
async createBooking(params: {
  startAt: string;
  locationId: string;
  customerId: string;
  serviceId?: string;
  duration: number;
  idempotencyKey: string;
  staffId?: string;
  note?: string;
}): Promise<any> {
  return this.client.bookingsApi.createBooking({
    booking: {
      startAt: params.startAt,
      locationId: params.locationId,
      customerId: params.customerId,
      appointmentSegments: [
        {
          durationMinutes: params.duration,
          serviceId: params.serviceId,
          teamMemberId: params.staffId,
        }
      ],
      sellerNote: params.note
    },
    idempotencyKey: params.idempotencyKey
  });
}
```

#### 1.2 Create Payment Service (`lib/services/paymentService.ts`)

```typescript
// Create a dedicated payment service to handle different payment types
import { v4 as uuidv4 } from 'uuid';
import SquareClient from '../square';
import prisma from '../prisma';

export enum PaymentType {
  CONSULTATION = 'consultation',
  DRAWING_CONSULTATION = 'drawing_consultation',
  TATTOO_DEPOSIT = 'tattoo_deposit',
  TATTOO_FINAL = 'tattoo_final'
}

interface ProcessPaymentParams {
  sourceId: string;
  amount: number;
  customerId: string;
  paymentType: PaymentType;
  bookingId?: string;
  note?: string;
  customerEmail?: string;
  staffId?: string;
}

export default class PaymentService {
  private squareClient: ReturnType<typeof SquareClient.fromEnv>;
  
  constructor() {
    this.squareClient = SquareClient.fromEnv();
  }
  
  async processPayment(params: ProcessPaymentParams) {
    const { 
      sourceId, 
      amount, 
      customerId, 
      paymentType,
      bookingId,
      note,
      customerEmail
    } = params;
    
    // Generate unique reference for this payment
    const idempotencyKey = uuidv4();
    const referenceId = bookingId || uuidv4();
    
    try {
      // Process payment with Square
      const paymentResponse = await this.squareClient.createPayment({
        sourceId,
        amount,
        currency: 'CAD',
        customerId,
        note: note || `Payment for ${paymentType}`,
        idempotencyKey,
        referenceId
      });
      
      // Store payment in database
      const payment = await prisma.payment.create({
        data: {
          amount,
          status: 'completed',
          paymentMethod: 'card',
          paymentType,
          squareId: paymentResponse.result.payment.id,
          customerId,
          bookingId,
          paymentDetails: paymentResponse.result.payment,
          referenceId
        }
      });
      
      // Create audit log entry
      await prisma.auditLog.create({
        data: {
          action: 'payment_processed',
          resourceType: 'payment',
          resourceId: payment.id,
          details: { paymentType, amount, customerId }
        }
      });
      
      return {
        success: true,
        payment,
        squarePayment: paymentResponse.result.payment
      };
    } catch (error) {
      // Log error
      console.error('Payment processing error:', error);
      
      // Create audit log for failed payment
      await prisma.auditLog.create({
        data: {
          action: 'payment_failed',
          resourceType: 'payment',
          details: { 
            paymentType, 
            amount, 
            customerId,
            error: error.message || 'Unknown error'
          }
        }
      });
      
      throw error;
    }
  }
}
```

#### 1.3 Create Booking Service (`lib/services/bookingService.ts`)

```typescript
import { v4 as uuidv4 } from 'uuid';
import SquareClient from '../square';
import prisma from '../prisma';

export enum BookingType {
  CONSULTATION = 'consultation',
  DRAWING_CONSULTATION = 'drawing_consultation',
  TATTOO_SESSION = 'tattoo_session'
}

interface CreateBookingParams {
  startAt: Date;
  duration: number; // minutes
  customerId: string;
  bookingType: BookingType;
  customerEmail?: string;
  customerPhone?: string;
  staffId?: string;
  note?: string;
  priceQuote?: number;
}

export default class BookingService {
  private squareClient: ReturnType<typeof SquareClient.fromEnv>;
  
  constructor() {
    this.squareClient = SquareClient.fromEnv();
  }
  
  async createBooking(params: CreateBookingParams) {
    const { 
      startAt, 
      duration, 
      customerId, 
      bookingType,
      customerEmail,
      customerPhone,
      staffId,
      note,
      priceQuote
    } = params;
    
    // Generate unique identifier for this booking
    const idempotencyKey = uuidv4();
    
    try {
      // Create booking in Square
      const squareBooking = await this.squareClient.createBooking({
        startAt: startAt.toISOString(),
        locationId: process.env.SQUARE_LOCATION_ID,
        customerId,
        duration,
        idempotencyKey,
        staffId,
        note: `Booking type: ${bookingType}${note ? ` - ${note}` : ''}`
      });
      
      // Store booking in database
      const booking = await prisma.appointment.create({
        data: {
          startTime: startAt,
          endTime: new Date(startAt.getTime() + duration * 60000),
          status: 'scheduled',
          type: bookingType,
          customerId,
          staffId,
          notes: note,
          squareId: squareBooking.result.booking.id,
          priceQuote
        }
      });
      
      // Create audit log entry
      await prisma.auditLog.create({
        data: {
          action: 'booking_created',
          resourceType: 'appointment',
          resourceId: booking.id,
          details: { bookingType, startAt, customerId }
        }
      });
      
      return {
        success: true,
        booking,
        squareBooking: squareBooking.result.booking
      };
    } catch (error) {
      // Log error
      console.error('Booking creation error:', error);
      
      // Create audit log for failed booking
      await prisma.auditLog.create({
        data: {
          action: 'booking_failed',
          resourceType: 'appointment',
          details: { 
            bookingType, 
            startAt: startAt.toISOString(), 
            customerId,
            error: error.message || 'Unknown error'
          }
        }
      });
      
      throw error;
    }
  }
}
```

### Phase 2: API Endpoints

#### 2.1 Payment Routes (`lib/routes/payment.ts` - Extend existing)

Add these new endpoints to the existing payment routes:

```typescript
// Process a consultation payment
fastify.post('/consultation', {
  preHandler: authenticate,
  schema: {
    body: {
      type: 'object',
      required: ['sourceId', 'amount', 'customerId'],
      properties: {
        sourceId: { type: 'string' },
        amount: { type: 'number' },
        customerId: { type: 'string' },
        note: { type: 'string' },
        consultationDate: { type: 'string' },
        duration: { type: 'number', default: 60 } // minutes
      }
    }
  }
}, async (request, reply) => {
  const { sourceId, amount, customerId, note, consultationDate, duration } = request.body as any;
  
  const paymentService = new PaymentService();
  const bookingService = new BookingService();
  
  try {
    // Create booking first
    let bookingResult;
    if (consultationDate) {
      bookingResult = await bookingService.createBooking({
        startAt: new Date(consultationDate),
        duration: duration || 60,
        customerId,
        bookingType: BookingType.CONSULTATION,
        note,
        priceQuote: amount
      });
    }
    
    // Process payment
    const paymentResult = await paymentService.processPayment({
      sourceId,
      amount,
      customerId,
      paymentType: PaymentType.CONSULTATION,
      bookingId: bookingResult?.booking?.id,
      note
    });
    
    // If we have both a booking and payment, link them
    if (bookingResult && paymentResult) {
      await prisma.appointment.update({
        where: { id: bookingResult.booking.id },
        data: { paymentId: paymentResult.payment.id }
      });
    }
    
    return {
      success: true,
      payment: paymentResult.payment,
      booking: bookingResult?.booking
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Failed to process consultation payment', 
      error: error.message 
    });
  }
});

// Process a drawing consultation payment
fastify.post('/drawing-consultation', {
  preHandler: authenticate,
  schema: {
    body: {
      type: 'object',
      required: ['sourceId', 'amount', 'customerId'],
      properties: {
        sourceId: { type: 'string' },
        amount: { type: 'number' },
        customerId: { type: 'string' },
        note: { type: 'string' },
        consultationDate: { type: 'string' },
        duration: { type: 'number', default: 90 } // minutes
      }
    }
  }
}, async (request, reply) => {
  const { sourceId, amount, customerId, note, consultationDate, duration } = request.body as any;
  
  const paymentService = new PaymentService();
  const bookingService = new BookingService();
  
  try {
    // Create booking first
    let bookingResult;
    if (consultationDate) {
      bookingResult = await bookingService.createBooking({
        startAt: new Date(consultationDate),
        duration: duration || 90,
        customerId,
        bookingType: BookingType.DRAWING_CONSULTATION,
        note,
        priceQuote: amount
      });
    }
    
    // Process payment
    const paymentResult = await paymentService.processPayment({
      sourceId,
      amount,
      customerId,
      paymentType: PaymentType.DRAWING_CONSULTATION,
      bookingId: bookingResult?.booking?.id,
      note
    });
    
    // If we have both a booking and payment, link them
    if (bookingResult && paymentResult) {
      await prisma.appointment.update({
        where: { id: bookingResult.booking.id },
        data: { paymentId: paymentResult.payment.id }
      });
    }
    
    return {
      success: true,
      payment: paymentResult.payment,
      booking: bookingResult?.booking
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Failed to process drawing consultation payment', 
      error: error.message 
    });
  }
});

// Process a tattoo deposit payment
fastify.post('/tattoo-deposit', {
  preHandler: authenticate,
  schema: {
    body: {
      type: 'object',
      required: ['sourceId', 'amount', 'customerId', 'tattooRequestId'],
      properties: {
        sourceId: { type: 'string' },
        amount: { type: 'number' },
        customerId: { type: 'string' },
        tattooRequestId: { type: 'string' },
        sessionDate: { type: 'string' },
        duration: { type: 'number', default: 180 }, // minutes
        note: { type: 'string' },
        staffId: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  const { 
    sourceId, 
    amount, 
    customerId, 
    tattooRequestId, 
    sessionDate, 
    duration, 
    note,
    staffId 
  } = request.body as any;
  
  const paymentService = new PaymentService();
  const bookingService = new BookingService();
  
  try {
    // Create booking if session date is provided
    let bookingResult;
    if (sessionDate) {
      bookingResult = await bookingService.createBooking({
        startAt: new Date(sessionDate),
        duration: duration || 180,
        customerId,
        bookingType: BookingType.TATTOO_SESSION,
        staffId,
        note,
        priceQuote: amount
      });
    }
    
    // Process payment
    const paymentResult = await paymentService.processPayment({
      sourceId,
      amount,
      customerId,
      paymentType: PaymentType.TATTOO_DEPOSIT,
      bookingId: bookingResult?.booking?.id,
      note: `Deposit for tattoo request ${tattooRequestId}`
    });
    
    // Update tattoo request with deposit info
    await prisma.tattooRequest.update({
      where: { id: tattooRequestId },
      data: { 
        depositPaid: true,
        depositAmount: amount,
        paymentId: paymentResult.payment.id,
        status: 'deposit_paid'
      }
    });
    
    // If we have a booking, link it to the tattoo request
    if (bookingResult) {
      await prisma.appointment.update({
        where: { id: bookingResult.booking.id },
        data: { 
          paymentId: paymentResult.payment.id,
          tattooRequestId
        }
      });
    }
    
    return {
      success: true,
      payment: paymentResult.payment,
      booking: bookingResult?.booking
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Failed to process tattoo deposit payment', 
      error: error.message 
    });
  }
});
```

#### 2.2 Booking Routes (`lib/routes/booking.ts`)

```typescript
import { FastifyPluginAsync } from 'fastify';
import { authenticate, authorize } from '../middleware/auth';
import BookingService, { BookingType } from '../services/bookingService';
import prisma from '../prisma';

const bookingRoutes: FastifyPluginAsync = async (fastify, options) => {
  // Apply authentication middleware to all routes in this plugin
  fastify.addHook('preHandler', authenticate);
  
  // Initialize booking service
  const bookingService = new BookingService();
  
  // GET /bookings - List all bookings (admin only)
  fastify.get('/', {
    preHandler: authorize(['admin', 'artist']),
    schema: {
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          status: { type: 'string' },
          type: { type: 'string' },
          customerId: { type: 'string' },
          staffId: { type: 'string' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    const { 
      startDate, 
      endDate, 
      status, 
      type, 
      customerId, 
      staffId,
      page = 1, 
      limit = 20 
    } = request.query as any;
    
    const skip = (page - 1) * limit;
    
    // Build filter object
    const where = {} as any;
    
    if (startDate) {
      where.startTime = { gte: new Date(startDate) };
    }
    
    if (endDate) {
      where.endTime = { lte: new Date(endDate) };
    }
    
    if (status) {
      where.status = status;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    if (staffId) {
      where.staffId = staffId;
    }
    
    try {
      // Get bookings
      const [bookings, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { startTime: 'asc' },
          include: {
            customer: true,
            staff: true,
            payment: true,
            tattooRequest: true
          }
        }),
        prisma.appointment.count({ where })
      ]);
      
      // Return paginated results
      return {
        data: bookings,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ 
        success: false, 
        message: 'Error fetching bookings', 
        error: error.message 
      });
    }
  });
  
  // GET /bookings/:id - Get booking by ID
  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as any;
    
    try {
      // Get booking
      const booking = await prisma.appointment.findUnique({
        where: { id },
        include: {
          customer: true,
          staff: true,
          payment: true,
          tattooRequest: true
        }
      });
      
      if (!booking) {
        return reply.code(404).send({ 
          success: false, 
          message: 'Booking not found' 
        });
      }
      
      // Check access permission - only admin, the artist, or the customer can view
      const user = request.user;
      
      if (user.role !== 'admin' && 
          booking.staffId !== user.id && 
          booking.customerId !== user.id) {
        return reply.code(403).send({ 
          success: false, 
          message: 'You do not have permission to view this booking' 
        });
      }
      
      return {
        success: true,
        booking
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ 
        success: false, 
        message: 'Error fetching booking', 
        error: error.message 
      });
    }
  });
  
  // PUT /bookings/:id - Update booking
  fastify.put('/:id', {
    preHandler: authorize(['admin', 'artist']),
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          startTime: { type: 'string' },
          endTime: { type: 'string' },
          status: { type: 'string', enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'] },
          staffId: { type: 'string' },
          notes: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { startTime, endTime, status, staffId, notes } = request.body as any;
    
    try {
      // Get existing booking
      const existingBooking = await prisma.appointment.findUnique({
        where: { id }
      });
      
      if (!existingBooking) {
        return reply.code(404).send({ 
          success: false, 
          message: 'Booking not found' 
        });
      }
      
      // Update data object
      const updateData = {} as any;
      
      if (startTime) {
        updateData.startTime = new Date(startTime);
      }
      
      if (endTime) {
        updateData.endTime = new Date(endTime);
      }
      
      if (status) {
        updateData.status = status;
      }
      
      if (staffId) {
        updateData.staffId = staffId;
      }
      
      if (notes !== undefined) {
        updateData.notes = notes;
      }
      
      // Update booking
      const updatedBooking = await prisma.appointment.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          staff: true,
          payment: true,
          tattooRequest: true
        }
      });
      
      // Create audit log entry
      await prisma.auditLog.create({
        data: {
          action: 'booking_updated',
          resourceType: 'appointment',
          resourceId: id,
          userId: request.user.id,
          details: { 
            previousStatus: existingBooking.status,
            newStatus: status || existingBooking.status,
            changes: updateData
          }
        }
      });
      
      return {
        success: true,
        booking: updatedBooking
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ 
        success: false, 
        message: 'Error updating booking', 
        error: error.message 
      });
    }
  });
};

export default bookingRoutes;
```

### Phase 3: Database Schema Updates

Update your Prisma schema (`prisma/schema.prisma`) to support the booking and payment system:

```prisma
// Add new fields to existing models

model Payment {
  id             String   @id @default(uuid())
  amount         Float
  status         String   // pending, completed, failed, refunded
  paymentMethod  String
  paymentType    String?  // consultation, drawing_consultation, tattoo_deposit, tattoo_final
  squareId       String?  @unique
  customerId     String?
  bookingId      String?
  referenceId    String?
  paymentDetails Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  // Relations
  customer       Customer? @relation(fields: [customerId], references: [id])
  appointment    Appointment[]
  tattooRequest  TattooRequest[]
}

model Appointment {
  id              String   @id @default(uuid())
  startTime       DateTime
  endTime         DateTime
  status          String   // scheduled, confirmed, completed, cancelled, no_show
  type            String   // consultation, drawing_consultation, tattoo_session
  customerId      String?
  staffId         String?
  paymentId       String?
  tattooRequestId String?
  squareId        String?  @unique
  notes           String?
  priceQuote      Float?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  customer       Customer? @relation(fields: [customerId], references: [id])
  staff          User?     @relation(fields: [staffId], references: [id])
  payment        Payment?  @relation(fields: [paymentId], references: [id])
  tattooRequest  TattooRequest? @relation(fields: [tattooRequestId], references: [id])
}

model TattooRequest {
  id             String   @id @default(uuid())
  customerId     String
  title          String
  description    String
  size           String?
  placement      String?
  style          String?
  references     Json?    // Array of image URLs
  status         String   // submitted, reviewed, approved, deposit_paid, in_progress, completed
  depositPaid    Boolean  @default(false)
  depositAmount  Float?
  finalAmount    Float?
  paymentId      String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  // Relations
  customer      Customer @relation(fields: [customerId], references: [id])
  payment       Payment? @relation(fields: [paymentId], references: [id])
  appointments  Appointment[]
}
```

### Phase 4: Testing

#### 4.1 Test Payment Service (`lib/__tests__/services/paymentService.test.ts`)

Create tests for:
- Processing consultation payments
- Processing drawing consultation payments
- Processing tattoo deposit payments
- Error handling

#### 4.2 Test Booking Service (`lib/__tests__/services/bookingService.test.ts`)

Create tests for:
- Creating different types of bookings
- Error handling

#### 4.3 Test API Endpoints

Create integration tests for each endpoint using Supertest.

### Phase 5: Frontend Integration (Future)

1. Create payment forms for:
   - Consultation booking
   - Drawing consultation booking
   - Tattoo deposit payment

2. Create booking management dashboard:
   - Calendar view
   - List view
   - Booking details view
   - Payment history

## Next Steps

1. Implement the Square client extensions
2. Create the payment and booking services
3. Implement the API endpoints
4. Update the database schema
5. Write tests for each component
6. Integrate with the frontend

## References

- [Square API Documentation](https://developer.squareup.com/docs)
- [Square Payment Form Guide](https://developer.squareup.com/docs/payment-form/overview)
- [Square Booking API](https://developer.squareup.com/docs/bookings-api/overview) 
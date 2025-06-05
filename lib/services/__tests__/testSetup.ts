import { PrismaClient } from '@prisma/client';
import { vi, beforeAll, beforeEach, afterAll } from 'vitest';

// Shared test database client
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./test.db'
    }
  }
});

// Mock external services only (keep business logic real)
export const setupExternalMocks = () => {
  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.BYPASS_AUTH = 'true';
    
    // Mock Square SDK with realistic responses
    vi.mock('square', () => ({
      Client: vi.fn().mockImplementation(() => ({
        paymentsApi: {
          createPayment: vi.fn().mockResolvedValue({
            result: {
              payment: {
                id: 'sq-payment-mock',
                status: 'COMPLETED',
                amountMoney: { amount: 50000, currency: 'CAD' },
                sourceType: 'CARD',
                cardDetails: { card: { last4: '1234', cardBrand: 'VISA' } },
                createdAt: new Date().toISOString()
              }
            }
          }),
          createRefund: vi.fn().mockResolvedValue({
            result: {
              refund: {
                id: 'sq-refund-mock',
                paymentId: 'sq-payment-mock',
                amountMoney: { amount: 25000, currency: 'CAD' },
                status: 'COMPLETED'
              }
            }
          })
        },
        customersApi: {
          createCustomer: vi.fn().mockResolvedValue({
            result: {
              customer: {
                id: 'sq-customer-mock',
                givenName: 'Test',
                emailAddress: 'test@example.com'
              }
            }
          })
        },
        ordersApi: {
          createOrder: vi.fn().mockResolvedValue({
            result: {
              order: {
                id: 'sq-order-mock',
                totalMoney: { amount: 50000, currency: 'CAD' }
              }
            }
          })
        },
        checkoutApi: {
          createPaymentLink: vi.fn().mockResolvedValue({
            result: {
              paymentLink: {
                id: 'sq-link-mock',
                url: 'https://sandbox-squareup.com/checkout/sq-link-mock'
              }
            }
          })
        },
        bookingsApi: {
          createBooking: vi.fn().mockResolvedValue({
            result: {
              booking: {
                id: 'sq-booking-mock',
                startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                customerId: 'sq-customer-mock'
              }
            }
          }),
          getBooking: vi.fn().mockResolvedValue({
            result: {
              booking: {
                id: 'sq-booking-mock',
                version: 1
              }
            }
          }),
          cancelBooking: vi.fn().mockResolvedValue({
            result: { booking: { id: 'sq-booking-mock', status: 'CANCELLED' } }
          })
        }
      }))
    }));

    // Mock Cloudinary
    vi.mock('../../cloudinary', () => ({
      default: {
        validateUploadResult: vi.fn().mockResolvedValue({
          url: 'https://res.cloudinary.com/demo/test.jpg',
          publicId: 'test-image-123'
        }),
        transferImagesToCustomer: vi.fn().mockResolvedValue(true),
        getTattooRequestImages: vi.fn().mockResolvedValue([]),
        cloudinary: {
          uploader: {
            update_metadata: vi.fn().mockResolvedValue({ public_id: 'test' })
          }
        }
      }
    }));

    await testPrisma.$connect();
  });

  beforeEach(async () => {
    // Clean database before each test (order matters for foreign keys)
    await testPrisma.auditLog.deleteMany();
    await testPrisma.image.deleteMany();
    await testPrisma.invoice.deleteMany();
    await testPrisma.paymentLink.deleteMany();
    await testPrisma.appointment.deleteMany();
    await testPrisma.payment.deleteMany();
    await testPrisma.tattooRequest.deleteMany();
    await testPrisma.customer.deleteMany();
    await testPrisma.user.deleteMany();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });
};

// Test data factories
export const createTestUser = async (role: 'admin' | 'artist' = 'admin') => {
  return await testPrisma.user.create({
    data: {
      email: `${role}@test.com`,
      role
    }
  });
};

export const createTestCustomer = async (overrides: any = {}) => {
  return await testPrisma.customer.create({
    data: {
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '+1234567890',
      ...overrides
    }
  });
};

export const createTestTattooRequest = async (customerId?: string, overrides: any = {}) => {
  return await testPrisma.tattooRequest.create({
    data: {
      description: 'Test tattoo request for service testing',
      contactEmail: 'test@example.com',
      contactPhone: '+1234567890',
      placement: 'Upper arm',
      size: 'Medium',
      style: 'Traditional',
      status: 'new',
      trackingToken: customerId ? null : 'test-token-123',
      customerId,
      referenceImages: [],
      ...overrides
    }
  });
};

// Common assertions
export const expectValidTattooRequest = (request: any) => {
  expect(request).toBeDefined();
  expect(request.id).toBeTruthy();
  expect(request.description).toBeTruthy();
  expect(request.status).toBeTruthy();
  expect(request.createdAt).toBeInstanceOf(Date);
};

export const expectValidCustomer = (customer: any) => {
  expect(customer).toBeDefined();
  expect(customer.id).toBeTruthy();
  expect(customer.email).toBeTruthy();
  expect(customer.createdAt).toBeInstanceOf(Date);
};

export const expectValidPayment = (payment: any) => {
  expect(payment).toBeDefined();
  expect(payment.id).toBeTruthy();
  expect(payment.amount).toBeTypeOf('number');
  expect(payment.status).toBeTruthy();
  expect(payment.paymentType).toBeTruthy();
}; 
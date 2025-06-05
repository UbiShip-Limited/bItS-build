import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

// Test database setup
let testDbUrl: string;
let prisma: PrismaClient;

export const setupIntegrationTests = () => {
  beforeAll(async () => {
    // Create unique test database
    const testDbName = `test_tattoo_shop_${randomUUID().replace(/-/g, '')}`;
    testDbUrl = `postgresql://postgres:password@localhost:5432/${testDbName}`;
    
    // Set test environment variables
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true });
    process.env.DATABASE_URL = testDbUrl;
    process.env.BYPASS_AUTH = 'true'; // For auth middleware testing
    
    // Mock external services but keep our business logic
    setupExternalServiceMocks();
    
    try {
      // Create test database (you may need to adjust connection details)
      execSync(`createdb ${testDbName}`, { stdio: 'ignore' });
      
      // Run database migrations
      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: testDbUrl },
        stdio: 'ignore'
      });
      
      // Initialize Prisma client
      prisma = new PrismaClient({
        datasources: {
          db: {
            url: testDbUrl
          }
        }
      });
      
      await prisma.$connect();
      
    } catch (error) {
      console.warn('Database setup failed, using in-memory SQLite fallback');
      // Fallback to SQLite for environments without PostgreSQL
      process.env.DATABASE_URL = 'file:./test.db';
      prisma = new PrismaClient();
      await prisma.$connect();
    }
  });
  
  beforeEach(async () => {
    // Clean database before each test
    await cleanDatabase();
  });
  
  afterEach(async () => {
    // Clean up after each test
    vi.clearAllMocks();
  });
  
  afterAll(async () => {
    // Cleanup test database
    await prisma.$disconnect();
    
    if (testDbUrl && testDbUrl.includes('postgresql')) {
      try {
        const dbName = testDbUrl.split('/').pop();
        execSync(`dropdb ${dbName}`, { stdio: 'ignore' });
      } catch (error) {
        console.warn('Failed to drop test database:', error);
      }
    }
  });
  
  return { getPrisma: () => prisma };
};

// Clean database between tests
async function cleanDatabase() {
  if (!prisma) return;
  
  try {
    // Delete in correct order to respect foreign key constraints
    await prisma.auditLog.deleteMany();
    await prisma.image.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.checkoutSession.deleteMany();
    await prisma.paymentLink.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.tattooRequest.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    console.warn('Database cleanup failed:', error);
  }
}

// Mock external services while keeping business logic
function setupExternalServiceMocks() {
  // Mock Cloudinary
  vi.mock('@lib/cloudinary', () => ({
    default: {
      validateUploadResult: vi.fn().mockResolvedValue({
        url: 'https://res.cloudinary.com/demo/image/upload/test.jpg',
        publicId: 'test-image-123',
        format: 'jpg',
        width: 800,
        height: 600,
        resourceType: 'image',
        secureUrl: 'https://res.cloudinary.com/demo/image/upload/test.jpg'
      }),
      generateUploadSignature: vi.fn().mockReturnValue({
        signature: 'test-signature',
        timestamp: Date.now(),
        apiKey: 'test-api-key',
        cloudName: 'test-cloud'
      }),
      uploadImage: vi.fn().mockResolvedValue({
        url: 'https://res.cloudinary.com/demo/image/upload/test.jpg',
        publicId: 'test-image-123'
      }),
      deleteImage: vi.fn().mockResolvedValue(true),
      getShopGalleryImages: vi.fn().mockResolvedValue([]),
      getCustomerUploadedImages: vi.fn().mockResolvedValue([]),
      getTattooRequestImages: vi.fn().mockResolvedValue([]),
      transferImagesToCustomer: vi.fn().mockResolvedValue(true)
    }
  }));
  
  // Mock Square SDK but with realistic responses
  vi.mock('square', () => ({
    Client: vi.fn().mockImplementation(() => ({
      paymentsApi: {
        createPayment: vi.fn().mockResolvedValue({
          result: {
            payment: {
              id: 'sq-payment-123',
              status: 'COMPLETED',
              amountMoney: { amount: 50000, currency: 'CAD' },
              sourceType: 'CARD',
              cardDetails: {
                card: { last4: '1234', cardBrand: 'VISA' }
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        }),
        getPayment: vi.fn().mockResolvedValue({
          result: {
            payment: {
              id: 'sq-payment-123',
              status: 'COMPLETED',
              amountMoney: { amount: 50000, currency: 'CAD' }
            }
          }
        })
      },
      customersApi: {
        createCustomer: vi.fn().mockResolvedValue({
          result: {
            customer: {
              id: 'sq-customer-123',
              givenName: 'Test',
              emailAddress: 'test@example.com',
              phoneNumber: '+1234567890'
            }
          }
        }),
        retrieveCustomer: vi.fn().mockResolvedValue({
          result: {
            customer: {
              id: 'sq-customer-123',
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
              id: 'sq-order-123',
              state: 'OPEN',
              totalMoney: { amount: 50000, currency: 'CAD' }
            }
          }
        })
      },
      checkoutApi: {
        createPaymentLink: vi.fn().mockResolvedValue({
          result: {
            paymentLink: {
              id: 'sq-link-123',
              url: 'https://sandbox-squareup.com/checkout/sq-link-123',
              orderData: {
                order: {
                  id: 'sq-order-123',
                  totalMoney: { amount: 50000, currency: 'CAD' }
                }
              }
            }
          }
        })
      },
      bookingsApi: {
        createBooking: vi.fn().mockResolvedValue({
          result: {
            booking: {
              id: 'sq-booking-123',
              startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              appointmentSegments: [{
                durationMinutes: 120,
                serviceVariation: {
                  itemVariationData: {
                    name: 'Tattoo Session'
                  }
                }
              }],
              customerId: 'sq-customer-123',
              locationId: process.env.SQUARE_LOCATION_ID || 'test-location'
            }
          }
        }),
        retrieveBooking: vi.fn().mockResolvedValue({
          result: {
            booking: {
              id: 'sq-booking-123',
              status: 'ACCEPTED',
              startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }
          }
        })
      }
    }))
  }));
  
  // Mock environment variables for tests
  process.env.SQUARE_ACCESS_TOKEN = 'test-square-token';
  process.env.SQUARE_APPLICATION_ID = 'test-app-id';
  process.env.SQUARE_LOCATION_ID = 'test-location-id';
  process.env.SQUARE_ENVIRONMENT = 'sandbox';
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.CLOUDINARY_API_KEY = 'test-api-key';
  process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
  process.env.FRONTEND_URL = 'http://localhost:3000';
}

// Utility functions for tests
export const createTestUser = async (role: 'artist' | 'admin' = 'artist') => {
  return await prisma.user.create({
    data: {
      email: `test-${role}-${randomUUID()}@example.com`,
      role: role
    }
  });
};

export const createTestCustomer = async (overrides: any = {}) => {
  return await prisma.customer.create({
    data: {
      name: 'Test Customer',
      email: `customer-${randomUUID()}@example.com`,
      phone: '+1234567890',
      ...overrides
    }
  });
};

// Realistic test data
export const realisticTattooRequestData = {
  description: 'I want a traditional Japanese dragon design wrapping around my upper arm. The dragon should be detailed with scales, flowing whiskers, and surrounded by cherry blossoms and clouds. I\'m looking for authentic traditional colors - blacks, grays, with selective red accents.',
  contactEmail: 'tattoo.enthusiast@example.com',
  contactPhone: '+1 (555) 123-4567',
  placement: 'Upper arm (wrapping around)',
  size: 'Large (8-10 inches)',
  colorPreference: 'Traditional colors with red accents',
  style: 'Traditional Japanese',
  purpose: 'new_tattoo',
  preferredArtist: 'Any artist experienced with Japanese traditional work',
  timeframe: 'Within 2-3 months',
  contactPreference: 'email',
  additionalNotes: 'I have a few small tattoos already but this will be my first large piece. I\'m flexible with scheduling and happy to book consultation first. Budget range is $800-1200.',
  referenceImages: [
    {
      url: 'https://res.cloudinary.com/demo/image/upload/dragon-ref-1.jpg',
      publicId: 'dragon-ref-1'
    },
    {
      url: 'https://res.cloudinary.com/demo/image/upload/dragon-ref-2.jpg', 
      publicId: 'dragon-ref-2'
    }
  ]
};

export const realisticAppointmentData = {
  startAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
  duration: 180, // 3 hours for detailed work
  priceQuote: 900,
  note: 'Initial session for Japanese dragon sleeve. Client is prepared for multiple sessions.'
};

export const realisticPaymentData = {
  amount: 450, // 50% deposit
  paymentType: 'tattoo_deposit' as const,
  paymentMethod: 'credit_card'
};

export { prisma }; 
import { FastifyPluginAsync } from 'fastify';
import { authorize, getUserPermissions } from '../../middleware/auth';
import PaymentService from '../../services/paymentService';
import PaymentLinkService from '../../services/paymentLinkService';
import { PaymentType } from '../../services/paymentService';
import { realtimeService } from '../../services/realtimeService';

// Type definitions for request bodies
interface CreatePaymentBody {
  amount: number;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  paymentDetails?: Record<string, unknown>;
  squareId?: string;
}

interface UpdatePaymentBody {
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  paymentDetails?: Record<string, unknown>;
  squareId?: string;
}

// Define proper types for invoice items and payment schedule (matching PaymentLinkService expectations)
interface InvoiceItem {
  description: string;
  amount: number;
}

interface PaymentScheduleItem {
  amount: number;
  dueDate: string;
  type: 'DEPOSIT' | 'BALANCE';
}

interface ProcessPaymentBody {
  type: 'payment_link' | 'invoice' | 'direct_payment';
  amount: number;
  customerId: string;
  paymentType: PaymentType;
  title?: string;
  description?: string;
  appointmentId?: string;
  tattooRequestId?: string;
  redirectUrl?: string;
  allowTipping?: boolean;
  customFields?: Array<{ title: string }>;
  sourceId?: string;
  bookingId?: string;
  note?: string;
  items?: InvoiceItem[];
  paymentSchedule?: PaymentScheduleItem[];
  deliveryMethod?: 'EMAIL' | 'SMS' | 'SHARE_MANUALLY';
}

// Query parameters interface for GET requests
interface PaymentListQuery {
  customerId?: string;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  page?: number;
  limit?: number;
  includeSquare?: boolean;
}

// Payment processing request body interface
interface ProcessPaymentRequestBody {
  sourceId: string;
  amount: number;
  customerId: string;
  paymentType: PaymentType;
  note?: string;
  bookingId?: string;
  idempotencyKey?: string;
}

// Extended payment type for adding Square data
interface PaymentWithSquareData {
  id: string;
  amount: number;
  status: string;
  paymentType: string;
  squareId?: string;
  hasSquareData?: boolean;
  [key: string]: unknown;
}

// Where clause type for Prisma queries
interface PaymentWhereClause {
  customerId?: string;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
}

// Helper function to check if Square is configured
function isSquareConfigured(): boolean {
  const { 
    SQUARE_ACCESS_TOKEN,
    SQUARE_APPLICATION_ID,
    SQUARE_LOCATION_ID
  } = process.env;
  
  return !!(SQUARE_ACCESS_TOKEN && SQUARE_APPLICATION_ID && SQUARE_LOCATION_ID);
}

const coreRoutes: FastifyPluginAsync = async (fastify) => {
  try {
    fastify.log.info('🔄 Starting core payment routes registration...');
    
    // Check Square configuration on startup and log status
    const squareConfigured = isSquareConfigured();
    if (squareConfigured) {
      fastify.log.info('✅ Core payment routes: Square integration is configured and ready');
    } else {
      fastify.log.warn('⚠️  Core payment routes: Square integration is not configured - Square-related payment features will be disabled');
    }
  } catch (error) {
    fastify.log.error('❌ Error during Square configuration check:', error);
  }

  // Lazy service initialization - create services only when needed
  let paymentService: PaymentService | null = null;
  let paymentLinkService: PaymentLinkService | null = null;
  
  const getPaymentService = () => {
    if (!paymentService) {
      try {
        paymentService = new PaymentService(fastify.prisma);
      } catch (error) {
        fastify.log.error('Failed to initialize PaymentService:', error);
        throw new Error('Payment service initialization failed');
      }
    }
    return paymentService;
  };
  
  const getPaymentLinkService = () => {
    if (!paymentLinkService) {
      try {
        paymentLinkService = new PaymentLinkService(fastify.prisma);
      } catch (error) {
        fastify.log.error('Failed to initialize PaymentLinkService:', error);
        throw new Error('Payment link service initialization failed');
      }
    }
    return paymentLinkService;
  };
  
  fastify.log.info('🔄 Registering core payment routes...');

  // GET /payments/health - Simple health check (no auth required)
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      squareConfigured: isSquareConfigured(),
      timestamp: new Date().toISOString(),
      message: 'Payments route is working'
    };
  });
  
  // GET /payments/test - Test endpoint that doesn't require Square (no auth required)
  fastify.get('/test', async (request, reply) => {
    return {
      status: 'ok',
      message: 'Payment routes are registered and accessible',
      timestamp: new Date().toISOString(),
      squareConfigured: isSquareConfigured(),
      environment: {
        hasSquareToken: !!process.env.SQUARE_ACCESS_TOKEN,
        hasSquareAppId: !!process.env.SQUARE_APPLICATION_ID,
        hasSquareLocation: !!process.env.SQUARE_LOCATION_ID,
        nodeEnv: process.env.NODE_ENV
      }
    };
  });
  
  // GET /payments/debug - Debug route to test basic GET at root level
  fastify.get('/debug', async (request, reply) => {
    return {
      message: 'Debug route working',
      query: request.query,
      url: request.url,
      routerPath: request.routerPath
    };
  });
  
  // GET /payments/simple - Test root-level route without authorize middleware
  fastify.get('/simple', async (request, reply) => {
    return {
      message: 'Simple payments route without auth working',
      query: request.query,
      timestamp: new Date().toISOString()
    };
  });
  
  // GET /payments - Get customer's payments with optional Square data
  fastify.get('/', {
    preHandler: authorize(['artist', 'admin']),
    schema: {
      querystring: {
        type: 'object',
        properties: {
          customerId: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          includeSquare: { type: 'boolean', default: false }
        }
      }
    }
  }, async (request, reply) => {
    const { customerId, status, page = 1, limit = 20, includeSquare = false } = request.query as PaymentListQuery;
    
    // Validate customer exists if customerId is provided
    if (customerId) {
      const customerExists = await fastify.prisma.customer.findUnique({
        where: { id: customerId },
        select: { id: true, name: true }
      });
      
      if (!customerExists) {
        return reply.status(404).send({
          error: 'Customer not found',
          message: `Customer with ID ${customerId} does not exist`,
          code: 'CUSTOMER_NOT_FOUND',
          squareConfigured: isSquareConfigured()
        });
      }
    }
    
    // Build where clause for payment filtering
    const whereClause: PaymentWhereClause = {};
    
    // Artists and admins can filter by specific customer
    if (customerId) {
      whereClause.customerId = customerId;
    }
    
    if (status) {
      whereClause.status = status;
    }

    const [payments, total] = await Promise.all([
      fastify.prisma.payment.findMany({
        where: whereClause,
        include: { 
          invoices: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      fastify.prisma.payment.count({ where: whereClause })
    ]);

    // Determine appropriate message for the response
    let message: string;
    if (payments.length === 0) {
      if (customerId && status) {
        message = `No ${status} payments found for this customer`;
      } else if (customerId) {
        message = 'No payment history yet for this customer';
      } else if (status) {
        message = `No ${status} payments found`;
      } else {
        message = 'No payments found. This could mean no payments have been recorded yet.';
      }
    } else {
      message = `Found ${total} payment${total !== 1 ? 's' : ''}`;
    }

    // Build base response
    const response = {
      data: payments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1
      },
      squareConfigured: isSquareConfigured(),
      meta: {
        isEmpty: payments.length === 0,
        message,
        filters: {
          customerId: customerId || null,
          status: status || null
        }
      }
    };

    // If Square data requested and configured, enhance with Square payment data
    if (includeSquare && isSquareConfigured()) {
      try {
        // Add Square payment details for payments that have Square IDs
        for (const payment of response.data) {
          if (payment.squareId) {
            try {
              // Note: This would require modifying PaymentService to handle Square client initialization gracefully
              // For now, we'll just indicate that Square data could be available
              (payment as PaymentWithSquareData).hasSquareData = true;
            } catch (error) {
              fastify.log.warn(`Could not fetch Square data for payment ${payment.id}: ${error.message}`);
              (payment as PaymentWithSquareData).hasSquareData = false;
            }
          }
        }
      } catch (error) {
        fastify.log.warn('Could not enhance payments with Square data:', error.message);
      }
    } else if (includeSquare && !isSquareConfigured()) {
      return reply.status(503).send({
        error: 'Square integration not configured',
        message: 'Square environment variables are not set. Please contact administrator.',
        squareConfigured: false
      });
    }

    return response;
  });

  // POST /payments - Process different types of payments
  fastify.post('/', {
    preHandler: authorize(['admin', 'artist']),
    schema: {
      body: {
        type: 'object',
        required: ['type', 'amount', 'customerId', 'paymentType'],
        properties: {
          type: { type: 'string', enum: ['payment_link', 'invoice', 'direct_payment'] },
          amount: { type: 'number', minimum: 0 },
          customerId: { type: 'string' },
          paymentType: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          appointmentId: { type: 'string' },
          tattooRequestId: { type: 'string' },
          redirectUrl: { type: 'string' },
          allowTipping: { type: 'boolean' },
          customFields: { 
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' }
              }
            }
          },
          sourceId: { type: 'string' },
          bookingId: { type: 'string' },
          note: { type: 'string' },
          items: { type: 'array' },
          paymentSchedule: { type: 'object' },
          deliveryMethod: { type: 'string', enum: ['EMAIL', 'SMS', 'SHARE_MANUALLY'] }
        }
      }
    }
  }, async (request, reply) => {
    const { type, ...paymentData } = request.body as ProcessPaymentBody;

    try {
      switch (type) {
        case 'payment_link':
          const paymentLinkResult = await getPaymentLinkService().createPaymentLink({
            amount: paymentData.amount,
            title: paymentData.title || '',
            description: paymentData.description,
            customerId: paymentData.customerId,
            appointmentId: paymentData.appointmentId,
            tattooRequestId: paymentData.tattooRequestId,
            paymentType: paymentData.paymentType,
            redirectUrl: paymentData.redirectUrl,
            allowTipping: paymentData.allowTipping || true,
            customFields: paymentData.customFields
          });

          return {
            success: true,
            data: paymentLinkResult,
            type: 'payment_link'
          };

        case 'invoice':
          const invoiceResult = await getPaymentLinkService().createInvoice({
            customerId: paymentData.customerId,
            appointmentId: paymentData.appointmentId,
            tattooRequestId: paymentData.tattooRequestId,
            items: paymentData.items || [],
            paymentSchedule: paymentData.paymentSchedule,
            deliveryMethod: paymentData.deliveryMethod || 'EMAIL'
          });

          return {
            success: true,
            data: invoiceResult,
            type: 'invoice'
          };

        case 'direct_payment':
          if (!paymentData.sourceId) {
            return reply.status(400).send({
              error: 'sourceId is required for direct payments'
            });
          }

          const paymentResult = await getPaymentService().processPayment({
            sourceId: paymentData.sourceId,
            amount: paymentData.amount,
            customerId: paymentData.customerId,
            paymentType: paymentData.paymentType,
            bookingId: paymentData.bookingId,
            note: paymentData.note
          });

          return {
            success: true,
            data: paymentResult,
            type: 'direct_payment'
          };

        default:
          return reply.status(400).send({
            error: 'Invalid payment type specified'
          });
      }
    } catch (error) {
      fastify.log.error('Error processing payment:', error);
      return reply.status(500).send({
        error: 'Failed to process payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /payments/process - Process a new payment through Square
  fastify.post('/process', {
    preHandler: authorize(['artist', 'admin']),
    schema: {
      body: {
        type: 'object',
        required: ['sourceId', 'amount', 'customerId', 'paymentType'],
        properties: {
          sourceId: { type: 'string' },
          amount: { type: 'number', minimum: 0 },
          customerId: { type: 'string' },
          paymentType: { 
            type: 'string', 
            enum: ['consultation', 'deposit', 'final_payment', 'full_payment', 'touch_up', 'aftercare'] 
          },
          note: { type: 'string' },
          bookingId: { type: 'string' },
          idempotencyKey: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    // Check if Square is configured before processing payments
    if (!isSquareConfigured()) {
      return reply.status(503).send({
        error: 'Payment processing unavailable',
        message: 'Square payment integration is not configured. Please contact administrator.',
        squareConfigured: false
      });
    }

    const paymentData = request.body as ProcessPaymentRequestBody;
    
    try {
      const result = await getPaymentService().processPayment(paymentData);
      
      // Log audit
      await fastify.prisma.auditLog.create({
        data: {
          userId: request.user?.id,
          action: 'PROCESS_PAYMENT',
          resource: 'Payment',
          resourceId: result.payment.id,
          details: { 
            amount: paymentData.amount,
            paymentType: paymentData.paymentType,
            success: result.success
          }
        }
      });
      
      return {
        ...result,
        squareConfigured: true
      };
    } catch (error) {
      fastify.log.error('Error processing payment:', error);
      
      // Log failed payment attempt
      await fastify.prisma.auditLog.create({
        data: {
          userId: request.user?.id,
          action: 'PROCESS_PAYMENT_FAILED',
          resource: 'Payment',
          details: { 
            amount: paymentData.amount,
            paymentType: paymentData.paymentType,
            error: error.message
          }
        }
      });
      
      return reply.status(500).send({ 
        error: 'Payment processing failed',
        message: error.message,
        squareConfigured: isSquareConfigured()
      });
    }
  });

  // POST /payments (legacy) - Create a simple payment record
  fastify.post('/legacy', {
    preHandler: authorize(['admin']),
    schema: {
      body: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number', minimum: 0 },
          status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
          paymentMethod: { type: 'string' },
          paymentDetails: { type: 'object' },
          squareId: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    const paymentData = request.body as CreatePaymentBody;
    
    const payment = await fastify.prisma.payment.create({
      data: {
        ...paymentData,
        paymentDetails: paymentData.paymentDetails ? JSON.parse(JSON.stringify(paymentData.paymentDetails)) : null
      }
    });
    
    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.id,
        action: 'CREATE',
        resource: 'Payment',
        resourceId: payment.id,
        details: { payment }
      }
    });
    
    // Send real-time notification if payment is completed
    if (paymentData.status === 'completed') {
      await realtimeService.notifyPaymentReceived(
        payment.id,
        payment.amount,
        payment.customerId || undefined
      );
    }
    
    return {
      ...payment,
      squareConfigured: isSquareConfigured()
    };
  });

  // PUT /payments/:id - Update payment information
  fastify.put('/:id', {
    preHandler: authorize(['admin']),
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
          status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
          paymentMethod: { type: 'string' },
          paymentDetails: { type: 'object' },
          squareId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const updateData = request.body as UpdatePaymentBody;
    
    // Get original for audit
    const original = await fastify.prisma.payment.findUnique({
      where: { id }
    });
    
    if (!original) {
      return reply.status(404).send({ 
        error: 'Payment not found',
        squareConfigured: isSquareConfigured()
      });
    }
    
    const updated = await fastify.prisma.payment.update({
      where: { id },
      data: {
        ...updateData,
        paymentDetails: updateData.paymentDetails ? JSON.parse(JSON.stringify(updateData.paymentDetails)) : undefined
      }
    });
    
    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.id,
        action: 'UPDATE',
        resource: 'Payment',
        resourceId: id,
        details: { before: original, after: updated }
      }
    });
    
    // Send real-time notification if payment was just marked as completed
    if (original.status !== 'completed' && updated.status === 'completed') {
      await realtimeService.notifyPaymentReceived(
        updated.id,
        updated.amount,
        updated.customerId || undefined
      );
    }
    
    return {
      ...updated,
      squareConfigured: isSquareConfigured()
    };
  });

  // GET /payments/stats - Get payment system statistics
  fastify.get('/stats', {
    preHandler: authorize(['artist', 'admin'])
  }, async (request, reply) => {
    try {
      const [
        totalPayments,
        totalCustomersWithPayments,
        paymentsByStatus,
        recentPayments
      ] = await Promise.all([
        // Total payment count
        fastify.prisma.payment.count(),
        
        // Count of customers who have made payments
        fastify.prisma.payment.groupBy({
          by: ['customerId'],
          where: { customerId: { not: null } },
          _count: { customerId: true }
        }).then(result => result.length),
        
        // Payments grouped by status
        fastify.prisma.payment.groupBy({
          by: ['status'],
          _count: { status: true },
          orderBy: { _count: { status: 'desc' } }
        }),
        
        // Most recent payments (last 5)
        fastify.prisma.payment.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: { id: true, name: true }
            }
          }
        })
      ]);

      const stats = {
        overview: {
          totalPayments,
          totalCustomersWithPayments,
          isEmpty: totalPayments === 0,
          hasData: totalPayments > 0
        },
        statusBreakdown: paymentsByStatus.map(item => ({
          status: item.status,
          count: item._count.status
        })),
        recentPayments: recentPayments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          paymentType: payment.paymentType,
          customer: payment.customer?.name || 'Unknown',
          createdAt: payment.createdAt
        })),
        squareConfigured: isSquareConfigured()
      };

      return {
        success: true,
        data: stats,
        message: totalPayments === 0 
          ? 'No payment data found. This appears to be a fresh system or placeholder data is being used.'
          : `Payment system contains ${totalPayments} payment${totalPayments !== 1 ? 's' : ''} from ${totalCustomersWithPayments} customer${totalCustomersWithPayments !== 1 ? 's' : ''}.`
      };
    } catch (error) {
      fastify.log.error('Error fetching payment statistics:', error);
      return reply.status(500).send({
        error: 'Failed to fetch payment statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        squareConfigured: isSquareConfigured()
      });
    }
  });

  // GET /payments/permissions - Get current user's payment permissions
  fastify.get('/permissions', {
    preHandler: authorize(['artist', 'admin'])
  }, async (request, reply) => {
    if (!request.user?.role) {
      return reply.status(401).send({
        error: 'Authentication required',
        message: 'User role not found'
      });
    }

    const permissions = getUserPermissions(request.user.role);
    
    return {
      success: true,
      data: {
        ...permissions,
        squareConfigured: isSquareConfigured(),
        availableEndpoints: getAvailableEndpoints(request.user.role)
      }
    };
  });
  
  fastify.log.info('✅ Core payment routes registered successfully');
  
  // Log the registered routes for debugging
  const routes = fastify.printRoutes({ commonPrefix: false });
  fastify.log.debug(`Registered payment routes: ${routes}`);
};

// Helper function to get available endpoints based on user role
function getAvailableEndpoints(userRole: string) {
  const endpoints = {
    'GET /payments': ['artist', 'admin'],
    'GET /payments/stats': ['artist', 'admin'],
    'GET /payments/permissions': ['artist', 'admin'],
    'POST /payments': ['artist', 'admin'], 
    'POST /payments/process': ['artist', 'admin'],
    'POST /payments/legacy': ['admin'],
    'PUT /payments/:id': ['admin'],
    'GET /payments/admin/*': ['admin'],
    'POST /payments/links/*': ['artist', 'admin'],
    'GET /payments/links/*': ['artist', 'admin'],
    'DELETE /payments/links/:id': ['admin'],
    'POST /payments/links/invoices': ['artist', 'admin'],
    'POST /payments/links/checkout': ['artist', 'admin']
  };

  const available: string[] = [];
  const restricted: string[] = [];

  Object.entries(endpoints).forEach(([endpoint, allowedRoles]) => {
    if (allowedRoles.includes(userRole)) {
      available.push(endpoint);
    } else {
      restricted.push(endpoint);
    }
  });

  return {
    available,
    restricted,
    totalEndpoints: Object.keys(endpoints).length,
    accessibleCount: available.length
  };
}

export default coreRoutes;
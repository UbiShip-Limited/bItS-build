import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma/prisma';
import PaymentService from '../../../../lib/services/paymentService';

// GET /api/payments - Get customer's payments with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status') as 'pending' | 'completed' | 'failed' | 'refunded' | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const includeSquare = searchParams.get('includeSquare') === 'true';

    // TODO: Add proper authentication check here
    // For now, allowing access but should verify user role (artist/admin)

    // Validate customer exists if customerId is provided
    if (customerId) {
      const customerExists = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { id: true, name: true }
      });
      
      if (!customerExists) {
        return NextResponse.json({
          error: 'Customer not found',
          message: `Customer with ID ${customerId} does not exist`,
          code: 'CUSTOMER_NOT_FOUND'
        }, { status: 404 });
      }
    }
    
    // Build where clause for payment filtering
    let whereClause: any = {};
    
    if (customerId) {
      whereClause.customerId = customerId;
    }
    
    if (status) {
      whereClause.status = status;
    }

    // Get payments and total count
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        include: { 
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
      prisma.payment.count({ where: whereClause })
    ]);

    // Determine appropriate message for the response
    let message: string;
    if (payments.length === 0) {
      if (customerId && status) {
        message = `No ${status} payments found for this customer`;
      } else if (customerId) {
        message = 'No payments found for this customer';
      } else if (status) {
        message = `No ${status} payments found`;
      } else {
        message = 'No payments found. This could mean no payments have been recorded yet.';
      }
    } else {
      message = `Found ${total} payment${total !== 1 ? 's' : ''}`;
    }

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
      meta: {
        isEmpty: payments.length === 0,
        message,
        filters: {
          customerId: customerId || null,
          status: status || null
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({
      error: 'Failed to fetch payments',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/payments - Process payments  
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceId, amount, customerId, paymentType, note, bookingId, idempotencyKey } = body;

    // TODO: Add proper authentication check here
    // For now, allowing access but should verify user role (artist/admin)

    // Validate required fields
    if (!sourceId || !amount || !customerId || !paymentType) {
      return NextResponse.json({
        error: 'Missing required fields',
        message: 'sourceId, amount, customerId, and paymentType are required'
      }, { status: 400 });
    }

    const paymentService = new PaymentService();
    
    const result = await paymentService.processPayment({
      sourceId,
      amount,
      customerId,
      paymentType,
      bookingId,
      note,
      idempotencyKey
    });
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json({
      error: 'Payment processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
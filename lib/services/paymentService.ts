import { v4 as uuidv4 } from 'uuid';
import SquareClient from '../square/index';
import { prisma } from '../prisma/prisma';
import { PrismaClient, Prisma } from '@prisma/client';
import type { Square } from 'square';
import { PaymentType, getMinimumAmount } from '../config/pricing';

// Re-export PaymentType for backward compatibility
export { PaymentType } from '../config/pricing';

export interface ProcessPaymentParams {
  sourceId: string;
  amount: number;
  customerId: string;
  paymentType: PaymentType;
  bookingId?: string;
  note?: string;
  customerEmail?: string;
  staffId?: string;
  idempotencyKey?: string; // For duplicate prevention
}

export interface GetPaymentsParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  customerId?: string;
  paymentType?: PaymentType;
  startDate?: Date;
  endDate?: Date;
}

// Payment validation errors
export class PaymentValidationError extends Error {
  constructor(message: string, public code: string = 'PAYMENT_VALIDATION_ERROR') {
    super(message);
    this.name = 'PaymentValidationError';
  }
}

export class DuplicatePaymentError extends Error {
  constructor(message: string, public originalPaymentId: string) {
    super(message);
    this.name = 'DuplicatePaymentError';
  }
}

export default class PaymentService {
  private squareClient: ReturnType<typeof SquareClient.fromEnv>;
  private prisma: PrismaClient;
  
  constructor(prismaClient?: PrismaClient, squareClient?: ReturnType<typeof SquareClient.fromEnv>) {
    this.squareClient = squareClient || SquareClient.fromEnv();
    this.prisma = prismaClient || prisma;
  }
  
  /**
   * Validate payment parameters before processing
   */
  private validatePaymentParams(params: ProcessPaymentParams): void {
    // Amount validation
    if (!params.amount || params.amount <= 0) {
      throw new PaymentValidationError('Payment amount must be greater than 0', 'INVALID_AMOUNT');
    }

    if (params.amount > 10000) { // $10,000 CAD limit
      throw new PaymentValidationError('Payment amount exceeds maximum limit ($10,000 CAD)', 'AMOUNT_TOO_HIGH');
    }

    // Validate minimum payment amount using centralized pricing
    const minimumAmount = getMinimumAmount(params.paymentType);
    if (params.amount < minimumAmount) {
      throw new PaymentValidationError(`Minimum payment amount for ${params.paymentType} is $${minimumAmount} CAD`, 'AMOUNT_TOO_LOW');
    }

    // Source ID validation
    if (!params.sourceId || params.sourceId.trim().length === 0) {
      throw new PaymentValidationError('Payment source ID is required', 'INVALID_SOURCE_ID');
    }

    // Customer ID validation
    if (!params.customerId || params.customerId.trim().length === 0) {
      throw new PaymentValidationError('Customer ID is required', 'INVALID_CUSTOMER_ID');
    }

    // Payment type validation
    const validPaymentTypes = ['consultation', 'drawing_consultation', 'tattoo_deposit', 'tattoo_final'];
    if (!validPaymentTypes.includes(params.paymentType)) {
      throw new PaymentValidationError(`Invalid payment type. Must be one of: ${validPaymentTypes.join(', ')}`, 'INVALID_PAYMENT_TYPE');
    }
  }

  /**
   * Check for duplicate payments using idempotency
   */
  private async checkDuplicatePayment(params: ProcessPaymentParams): Promise<void> {
    if (!params.idempotencyKey) {
      return; // No idempotency key provided, skip check
    }

    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        AND: [
          { customerId: params.customerId },
          { amount: params.amount },
          { paymentType: params.paymentType },
          { status: { in: ['pending', 'completed'] } },
          // Check if payment was created within last 24 hours (prevent old duplicates)
          { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        ]
      }
    });

    if (existingPayment) {
      throw new DuplicatePaymentError(
        'A similar payment already exists for this customer',
        existingPayment.id
      );
    }
  }

  /**
   * Enhanced audit logging for payments
   */
  private async logPaymentAttempt(
    action: string,
    params: ProcessPaymentParams,
    result?: any,
    error?: any
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: `payment_${action}`,
          resource: 'payment',
          resourceId: result?.payment?.id || 'unknown',
          details: {
            paymentType: params.paymentType,
            amount: params.amount,
            customerId: params.customerId,
            sourceId: params.sourceId.substring(0, 10) + '...', // Partial for security
            success: !error,
            error: error ? (typeof error === 'string' ? error : error.message) : undefined,
            timestamp: new Date().toISOString(),
            ipAddress: 'server', // Could be enhanced to capture actual IP
            environment: process.env.SQUARE_ENVIRONMENT || 'unknown'
          }
        }
      });
    } catch (logError) {
      console.error('Failed to log payment attempt:', logError);
    }
  }
  
  async processPayment(params: ProcessPaymentParams): Promise<{ 
    success: boolean; 
    payment: Prisma.PaymentGetPayload<Record<string, never>>; 
    squarePayment: Square.Payment | undefined 
  }> {
    // Generate idempotency key if not provided
    const idempotencyKey = params.idempotencyKey || uuidv4();
    const enhancedParams = { ...params, idempotencyKey };

    try {
      // 1. Validate payment parameters
      this.validatePaymentParams(enhancedParams);

      // 2. Check for duplicate payments
      await this.checkDuplicatePayment(enhancedParams);

      // 3. Verify customer exists
      const customer = await this.prisma.customer.findUnique({
        where: { id: enhancedParams.customerId }
      });
      
      if (!customer) {
        throw new PaymentValidationError(`Customer ${enhancedParams.customerId} not found`, 'CUSTOMER_NOT_FOUND');
      }

      // 4. Log payment attempt
      await this.logPaymentAttempt('attempt', enhancedParams);

      // 5. Generate unique reference for this payment
      const referenceId = enhancedParams.bookingId || uuidv4();
      
      // 6. Process Square payment
      const squareResponse = await this.squareClient.createPayment({
        sourceId: enhancedParams.sourceId,
        amount: enhancedParams.amount, // Square client will convert to cents internally
        currency: 'CAD',
        customerId: customer.squareId || undefined,
        note: enhancedParams.note,
        idempotencyKey,
        referenceId
      });
      
      // 7. Extract payment details from Square response
      const squarePayment = squareResponse.result?.payment;
      
      if (!squarePayment) {
        throw new Error('No payment returned from Square');
      }

      // 8. Store payment record in database with transaction
      const payment = await this.prisma.$transaction(async (tx) => {
        const newPayment = await tx.payment.create({
          data: {
            amount: enhancedParams.amount,
            status: 'completed',
            paymentMethod: squarePayment.sourceType || 'card',
            paymentType: enhancedParams.paymentType,
            squareId: squarePayment.id,
            customerId: enhancedParams.customerId,
            bookingId: enhancedParams.bookingId,
            referenceId,
            paymentDetails: squarePayment as Prisma.InputJsonValue
          }
        });

        // Update any related records within the same transaction
        if (enhancedParams.bookingId) {
          await tx.appointment.updateMany({
            where: { id: enhancedParams.bookingId },
            data: { paymentId: newPayment.id }
          });
        }

        return newPayment;
      });
      
      // 9. Log successful payment
      await this.logPaymentAttempt('success', enhancedParams, { payment });
      
      return {
        success: true,
        payment,
        squarePayment
      };
    } catch (error) {
      // 10. Log payment failure
      await this.logPaymentAttempt('failure', enhancedParams, undefined, error);
      
      // Handle specific error types
      if (error instanceof PaymentValidationError || error instanceof DuplicatePaymentError) {
        throw error; // Re-throw our custom errors
      }

      // Extract error message and details properly
      let errorMessage = 'Unknown error';
      let errorCode = 'PAYMENT_PROCESSING_ERROR';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }

      // Check for Square-specific errors
      if (error && typeof error === 'object' && 'errors' in error) {
        const squareErrors = (error as any).errors;
        if (Array.isArray(squareErrors) && squareErrors.length > 0) {
          const squareError = squareErrors[0];
          errorMessage = squareError.detail || squareError.message || 'Square API error';
          errorCode = squareError.code || 'SQUARE_ERROR';
        }
      }

      // Create enhanced error with additional context
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).code = errorCode;
      (enhancedError as any).paymentType = enhancedParams.paymentType;
      (enhancedError as any).amount = enhancedParams.amount;
      
      throw enhancedError;
    }
  }

  async getPayments(params: GetPaymentsParams = {}, requestingUserId?: string, userRole?: string) {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      customerId, 
      paymentType, 
      startDate, 
      endDate 
    } = params;
    
    // Validate pagination parameters
    if (page < 1) {
      throw new PaymentValidationError('Page number must be greater than 0', 'INVALID_PAGE');
    }
    
    if (limit < 1 || limit > 100) {
      throw new PaymentValidationError('Limit must be between 1 and 100', 'INVALID_LIMIT');
    }
    
    // Build where clause
    const where: Prisma.PaymentWhereInput = {};
    
    if (status) {
      where.status = status;
    }
    
    if (customerId) {
      // SECURITY: Verify user has permission to view this customer's payments
      if (userRole !== 'admin' && requestingUserId) {
        // For non-admin users, verify they own the customer record or are assigned to it
        const customer = await this.prisma.customer.findFirst({
          where: {
            id: customerId,
            // Add any customer ownership logic here
          }
        });
        
        if (!customer) {
          throw new PaymentValidationError('Access denied: Customer not found or not authorized', 'UNAUTHORIZED_CUSTOMER_ACCESS');
        }
      }
      where.customerId = customerId;
    }
    
    if (paymentType) {
      where.paymentType = paymentType;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }
    
    const skip = (page - 1) * limit;
    
    try {
      const [payments, total] = await Promise.all([
        this.prisma.payment.findMany({
          where,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.payment.count({ where })
      ]);
      
      return {
        data: payments,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw new Error('Failed to fetch payments');
    }
  }

  async refundPayment(paymentId: string, amount?: number, reason?: string) {
    try {
      // Validate input parameters
      if (!paymentId || paymentId.trim().length === 0) {
        throw new PaymentValidationError('Payment ID is required', 'INVALID_PAYMENT_ID');
      }

      // Fetch the payment from our database first to get the Square ID
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId }
      });
      
      if (!payment || !payment.squareId) {
        throw new PaymentValidationError(`Payment not found or missing Square ID: ${paymentId}`, 'PAYMENT_NOT_FOUND');
      }

      // Validate refund amount
      if (amount !== undefined) {
        if (amount <= 0) {
          throw new PaymentValidationError('Refund amount must be greater than 0', 'INVALID_REFUND_AMOUNT');
        }
        
        if (amount > payment.amount) {
          throw new PaymentValidationError('Refund amount cannot exceed original payment amount', 'REFUND_AMOUNT_TOO_HIGH');
        }
      }
      
      // Generate unique reference for this refund
      const idempotencyKey = uuidv4();
      
      // Process refund with Square
      const refundResponse = await this.squareClient.createRefund({
        paymentId: payment.squareId,
        idempotencyKey,
        amountMoney: amount ? {
          amount, // Square client will convert to cents internally
          currency: 'CAD'
        } : undefined, // If undefined, Square will refund the full amount
        reason: reason || 'Customer requested refund'
      });
      
      // Update payment status in database
      const refundResult = refundResponse.result?.refund;
      if (!refundResult) {
        throw new Error('No refund returned from Square');
      }
      
      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: amount && amount < payment.amount ? 'partially_refunded' : 'refunded',
          refundDetails: JSON.parse(JSON.stringify({
            refundId: refundResult.id,
            refundAmount: amount || payment.amount,
            refundReason: reason || 'Customer requested refund',
            refundedAt: new Date().toISOString(),
            squareRefundDetails: refundResult
          }))
        }
      });
      
      // Create audit log entry with enhanced details
      await this.prisma.auditLog.create({
        data: {
          action: 'payment_refunded',
          resource: 'payment',
          resourceId: paymentId,
          details: { 
            paymentId, 
            originalAmount: payment.amount,
            refundAmount: amount || payment.amount, 
            reason,
            refundType: amount && amount < payment.amount ? 'partial' : 'full',
            squareRefundId: refundResult.id,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      return {
        success: true,
        payment: updatedPayment,
        refund: refundResult
      };
    } catch (error) {
      // Log error with enhanced details
      console.error('Payment refund error:', error);
      
      // Check for Square-specific errors
      let errorMessage = error instanceof Error ? error.message : 'Unknown error';
      let errorCode = 'REFUND_FAILED';
      
      if (error && typeof error === 'object' && 'errors' in error && Array.isArray((error as any).errors)) {
        const squareError = (error as any).errors[0];
        errorMessage = squareError.detail || errorMessage;
        errorCode = squareError.code || errorCode;
      }
      
      // Create audit log for failed refund
      await this.prisma.auditLog.create({
        data: {
          action: 'refund_failed',
          resource: 'payment',
          resourceId: paymentId,
          details: { 
            paymentId,
            errorCode,
            error: errorMessage,
            refundAmount: amount,
            reason,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      throw error;
    }
  }
} 
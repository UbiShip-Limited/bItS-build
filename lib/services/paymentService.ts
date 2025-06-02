import { v4 as uuidv4 } from 'uuid';
import SquareClient from '../square/index.js';
import { prisma } from '../prisma/prisma.js';
import { PrismaClient, Prisma } from '@prisma/client';
import type { Square } from 'square';

export enum PaymentType {
  CONSULTATION = 'consultation',
  DRAWING_CONSULTATION = 'drawing_consultation',
  TATTOO_DEPOSIT = 'tattoo_deposit',
  TATTOO_FINAL = 'tattoo_final'
}

// Minimum payment amount validation (in CAD)
const MINIMUM_PAYMENT_AMOUNTS = {
  [PaymentType.CONSULTATION]: 35,
  [PaymentType.DRAWING_CONSULTATION]: 50,
  [PaymentType.TATTOO_DEPOSIT]: 75,
  [PaymentType.TATTOO_FINAL]: 100
};

export interface ProcessPaymentParams {
  sourceId: string;
  amount: number;
  customerId: string;
  paymentType: PaymentType;
  bookingId?: string;
  note?: string;
  customerEmail?: string;
  staffId?: string;
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

export default class PaymentService {
  private squareClient: ReturnType<typeof SquareClient.fromEnv>;
  private prisma: PrismaClient;
  
  constructor(prismaClient?: PrismaClient, squareClient?: ReturnType<typeof SquareClient.fromEnv>) {
    this.squareClient = squareClient || SquareClient.fromEnv();
    this.prisma = prismaClient || prisma;
  }
  
  async processPayment(params: ProcessPaymentParams): Promise<{ 
    success: boolean; 
    payment: Prisma.PaymentGetPayload<Record<string, never>>; 
    squarePayment: Square.Payment | undefined 
  }> {
    const { 
      sourceId, 
      amount, 
      customerId, 
      paymentType,
      bookingId,
      note,
    } = params;
    
    // Validate minimum payment amount
    const minimumAmount = MINIMUM_PAYMENT_AMOUNTS[paymentType] || 0;
    if (amount < minimumAmount) {
      throw new Error(`Minimum payment amount for ${paymentType} is $${minimumAmount} CAD`);
    }
    
    // Find customer to get Square ID
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId }
    });
    
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }
    
    // Generate unique reference for this payment
    const idempotencyKey = uuidv4();
    const referenceId = bookingId || uuidv4();
    
    try {
      // Process Square payment
      const squareResponse = await this.squareClient.createPayment({
        sourceId,
        amount, // Square client will convert to cents internally
        currency: 'CAD',
        customerId: customer.squareId || undefined,
        note,
        idempotencyKey,
        referenceId
      });
      
      // Extract payment details from Square response
      const squarePayment = squareResponse.result.payment;
      
      // Store payment record in database
      const payment = await this.prisma.payment.create({
        data: {
          amount,
          status: 'completed',
          paymentMethod: squarePayment?.sourceType || 'card',
          paymentType,
          squareId: squarePayment?.id,
          customerId,
          bookingId,
          referenceId,
          paymentDetails: squarePayment
        }
      });
      
      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          action: 'payment_processed',
          resource: 'payment',
          resourceId: payment.id,
          details: { paymentType, amount, customerId }
        }
      });
      
      return {
        success: true,
        payment,
        squarePayment
      };
    } catch (error) {
      // Log payment failure
      await this.prisma.auditLog.create({
        data: {
          action: 'payment_failed',
          resource: 'payment',
          details: { 
            paymentType, 
            amount, 
            customerId,
            error: error.message 
          }
        }
      });
      
      // Re-throw the error
      throw error;
    }
  }

  async getPayments(params: GetPaymentsParams = {}) {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      customerId, 
      paymentType, 
      startDate, 
      endDate 
    } = params;
    
    // Build where clause
    const where: Prisma.PaymentWhereInput = {};
    
    if (status) {
      where.status = status;
    }
    
    if (customerId) {
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
                firstName: true,
                lastName: true,
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
      // Fetch the payment from our database first to get the Square ID
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId }
      });
      
      if (!payment || !payment.squareId) {
        throw new Error(`Payment not found or missing Square ID: ${paymentId}`);
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
      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: amount && amount < payment.amount ? 'partially_refunded' : 'refunded',
          refundDetails: refundResponse.result.refund as Prisma.InputJsonValue
        }
      });
      
      // Create audit log entry
      await this.prisma.auditLog.create({
        data: {
          action: 'payment_refunded',
          resource: 'payment',
          resourceId: paymentId,
          details: { 
            paymentId, 
            amount: amount || payment.amount, 
            reason 
          }
        }
      });
      
      return {
        success: true,
        payment: updatedPayment,
        refund: refundResponse.result.refund
      };
    } catch (error) {
      // Log error
      console.error('Payment refund error:', error);
      
      // Check for Square-specific errors
      let errorMessage = error.message || 'Unknown error';
      let errorCode = 'REFUND_FAILED';
      
      if (error.errors && Array.isArray(error.errors)) {
        const squareError = error.errors[0];
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
            error: errorMessage
          }
        }
      });
      
      throw error;
    }
  }
} 
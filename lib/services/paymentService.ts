import { v4 as uuidv4 } from 'uuid';
import SquareClient from '../square/index.js';
import { prisma } from '../prisma/prisma.js';
import { PrismaClient } from '@prisma/client';

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
  private prisma: PrismaClient;
  
  constructor(prismaClient?: PrismaClient, squareClient?: any) {
    this.squareClient = squareClient || SquareClient.fromEnv();
    this.prisma = prismaClient || prisma;
  }
  
  async processPayment(params: ProcessPaymentParams): Promise<{ success: boolean; payment: any; squarePayment: any }> {
    const { 
      sourceId, 
      amount, 
      customerId, 
      paymentType,
      bookingId,
      note,
      customerEmail
    } = params;
    
    // Validate minimum payment amount
    const minimumAmount = MINIMUM_PAYMENT_AMOUNTS[paymentType] || 0;
    if (amount < minimumAmount) {
      throw new Error(`Minimum payment amount for ${paymentType} is $${minimumAmount} CAD`);
    }
    
    // Generate unique reference for this payment
    const idempotencyKey = uuidv4();
    const referenceId = bookingId || uuidv4();
    
    try {
      // Find customer to get Square ID
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId }
      });
      
      if (!customer) {
        throw new Error(`Customer ${customerId} not found`);
      }
      
      // Process Square payment
      const squareResponse = await this.squareClient.createPayment({
        sourceId,
        amount, // Square client will convert to cents internally
        currency: 'CAD',
        customerId: customer.squareId,
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
          refundDetails: refundResponse.result.refund
        } as any
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
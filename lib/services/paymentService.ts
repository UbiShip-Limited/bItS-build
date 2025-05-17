import { v4 as uuidv4 } from 'uuid';
import SquareClient from '../square';
import { prisma } from '../prisma/prisma';

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
          referenceId,
          paymentDetails: paymentResponse.result.payment
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
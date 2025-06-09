import { Square } from "square";
import { BaseSquareClient } from './base-client';
import type { 
  SquarePaymentResponse, 
  SquareRefundResponse, 
  SquareListResponse 
} from './types';

export class PaymentsService extends BaseSquareClient {
  
  async getPayments(
    beginTime?: string, 
    endTime?: string, 
    cursor?: string, 
    limit?: number
  ): Promise<SquarePaymentResponse> {
    const response = await this.client.payments.list({
      beginTime,
      endTime,
      cursor,
      locationId: this.locationId,
      limit
    }) as SquareListResponse<Square.Payment>;
    
    return {
      result: {
        payments: response.data || []
      },
      cursor: response.cursor,
      errors: []
    };
  }

  async getPaymentById(paymentId: string): Promise<SquarePaymentResponse> {
    return this.client.payments.get({
      paymentId
    });
  }

  // Create a payment method
  async createPayment(params: {
    sourceId: string;
    amount: number;
    currency: string;
    customerId?: string;
    note?: string;
    idempotencyKey: string;
    referenceId?: string;
  }): Promise<SquarePaymentResponse> {
    const { sourceId, amount, currency, customerId, note, idempotencyKey, referenceId } = params;
    
    return this.client.payments.create({
      sourceId,
      idempotencyKey,
      amountMoney: {
        amount: BigInt(Math.round(amount * 100)),
        currency: currency as Square.Currency
      },
      customerId,
      note,
      referenceId,
      locationId: this.locationId
    });
  }

  // Create a refund for a payment
  async createRefund(params: {
    paymentId: string;
    idempotencyKey: string;
    amountMoney?: {
      amount: number;
      currency: string;
    };
    reason?: string;
  }): Promise<SquareRefundResponse> {
    const { paymentId, idempotencyKey, amountMoney, reason } = params;
    
    // Build the refund request - safely typed for Square SDK
    const refundRequestParams: unknown = {
      paymentId,
      idempotencyKey,
      reason,
      ...(amountMoney && {
        amountMoney: {
          amount: BigInt(Math.round(amountMoney.amount * 100)),
          currency: amountMoney.currency as Square.Currency
        }
      })
    };
    
    // Direct refund API call
    return this.client.refunds.refundPayment(refundRequestParams as Square.RefundPaymentRequest);
  }
} 
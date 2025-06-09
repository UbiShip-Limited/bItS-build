import { Square } from "square";
import { BaseSquareClient } from './base-client';
import type { SquareOrderResponse } from './types';

export class OrdersService extends BaseSquareClient {

  // Orders methods - proper way to handle order creation and checkout
  async createOrder(params: {
    locationId?: string;
    lineItems: Array<{
      name: string;
      quantity: string;
      basePriceMoney: {
        amount: number;
        currency: string;
      };
      note?: string;
    }>;
    customerId?: string;
    idempotencyKey: string;
    referenceId?: string;
  }): Promise<SquareOrderResponse> {
    const { locationId, lineItems, customerId, idempotencyKey, referenceId } = params;
    
    // Transform line items to match Square's format
    const transformedLineItems = lineItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      basePriceMoney: {
        amount: BigInt(Math.round(item.basePriceMoney.amount * 100)),
        currency: item.basePriceMoney.currency as Square.Currency
      },
      note: item.note
    }));
    
    return this.client.orders.create({
      idempotencyKey,
      order: {
        locationId: locationId || this.locationId,
        referenceId,
        customerId,
        lineItems: transformedLineItems
      }
    });
  }
} 
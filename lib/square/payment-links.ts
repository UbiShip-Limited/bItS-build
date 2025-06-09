import { BaseSquareClient } from './base-client';
import type { 
  PaymentLinkResponse,
  PaymentLinkRequestBody,
  PaymentLinkUpdateRequestBody,
  SquareApiResponse 
} from './types';

export class PaymentLinksService extends BaseSquareClient {

  // Payment Links - Using Square's Checkout API
  async createPaymentLink(params: {
    idempotencyKey: string;
    description?: string;
    quickPay?: {
      name: string;
      priceMoney: {
        amount: number;
        currency: string;
      };
      locationId?: string;
    };
    order?: {
      orderId: string;
    };
    checkoutOptions?: {
      allowTipping?: boolean;
      customFields?: Array<{
        title: string;
      }>;
      redirectUrl?: string;
      merchantSupportEmail?: string;
      askForShippingAddress?: boolean;
      acceptedPaymentMethods?: {
        applePay?: boolean;
        googlePay?: boolean;
        cashAppPay?: boolean;
        afterpayClearpay?: boolean;
      };
    };
    prePopulatedData?: {
      buyerEmail?: string;
      buyerPhoneNumber?: string;
      buyerAddress?: {
        addressLine1?: string;
        addressLine2?: string;
        locality?: string;
        administrativeDistrictLevel1?: string;
        postalCode?: string;
        country?: string;
        firstName?: string;
        lastName?: string;
      };
    };
    paymentNote?: string;
  }): Promise<PaymentLinkResponse> {
    const requestBody: PaymentLinkRequestBody = {
      idempotency_key: params.idempotencyKey
    };

    if (params.description) {
      requestBody.description = params.description;
    }

    if (params.quickPay) {
      requestBody.quick_pay = {
        name: params.quickPay.name,
        price_money: {
          amount: Math.round(params.quickPay.priceMoney.amount * 100),
          currency: params.quickPay.priceMoney.currency
        },
        location_id: params.quickPay.locationId || this.locationId
      };
    }

    if (params.order) {
      requestBody.order = {
        order_id: params.order.orderId
      };
    }

    if (params.checkoutOptions) {
      requestBody.checkout_options = {
        allow_tipping: params.checkoutOptions.allowTipping,
        custom_fields: params.checkoutOptions.customFields,
        redirect_url: params.checkoutOptions.redirectUrl,
        merchant_support_email: params.checkoutOptions.merchantSupportEmail,
        ask_for_shipping_address: params.checkoutOptions.askForShippingAddress,
        accepted_payment_methods: params.checkoutOptions.acceptedPaymentMethods
      };
    }

    if (params.prePopulatedData) {
      requestBody.pre_populated_data = {
        buyer_email: params.prePopulatedData.buyerEmail,
        buyer_phone_number: params.prePopulatedData.buyerPhoneNumber,
        buyer_address: params.prePopulatedData.buyerAddress
      };
    }

    if (params.paymentNote) {
      requestBody.payment_note = params.paymentNote;
    }

    // Use the Square API directly since the SDK might not have this method yet
    const response = await fetch(
      `${this.getApiUrl()}/v2/online-checkout/payment-links`,
      {
        method: 'POST',
        headers: {
          'Square-Version': '2025-05-21',
          'Authorization': `Bearer ${this.getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Square API error: ${JSON.stringify(data)}`);
    }

    return {
      result: data,
      errors: []
    };
  }

  // List payment links
  async listPaymentLinks(params?: {
    cursor?: string;
    limit?: number;
  }): Promise<PaymentLinkResponse> {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(
      `${this.getApiUrl()}/v2/online-checkout/payment-links?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Square-Version': '2025-05-21',
          'Authorization': `Bearer ${this.getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Square API error: ${JSON.stringify(data)}`);
    }

    return {
      result: data,
      errors: []
    };
  }

  // Get payment link
  async getPaymentLink(id: string): Promise<PaymentLinkResponse> {
    const response = await fetch(
      `${this.getApiUrl()}/v2/online-checkout/payment-links/${id}`,
      {
        method: 'GET',
        headers: {
          'Square-Version': '2025-05-21',
          'Authorization': `Bearer ${this.getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Square API error: ${JSON.stringify(data)}`);
    }

    return {
      result: data,
      errors: []
    };
  }

  // Update payment link
  async updatePaymentLink(params: {
    id: string;
    paymentLink: {
      version: number;
      description?: string;
      checkoutOptions?: {
        allowTipping?: boolean;
        customFields?: Array<{
          title: string;
        }>;
        redirectUrl?: string;
        merchantSupportEmail?: string;
        askForShippingAddress?: boolean;
        acceptedPaymentMethods?: {
          applePay?: boolean;
          googlePay?: boolean;
          cashAppPay?: boolean;
          afterpayClearpay?: boolean;
        };
      };
      prePopulatedData?: {
        buyerEmail?: string;
        buyerPhoneNumber?: string;
        buyerAddress?: {
          addressLine1?: string;
          addressLine2?: string;
          locality?: string;
          administrativeDistrictLevel1?: string;
          postalCode?: string;
          country?: string;
          firstName?: string;
          lastName?: string;
        };
      };
    };
  }): Promise<PaymentLinkResponse> {
    const requestBody: PaymentLinkUpdateRequestBody = {
      payment_link: {
        version: params.paymentLink.version
      }
    };

    if (params.paymentLink.description !== undefined) {
      requestBody.payment_link.description = params.paymentLink.description;
    }

    if (params.paymentLink.checkoutOptions) {
      requestBody.payment_link.checkout_options = {
        allow_tipping: params.paymentLink.checkoutOptions.allowTipping,
        custom_fields: params.paymentLink.checkoutOptions.customFields,
        redirect_url: params.paymentLink.checkoutOptions.redirectUrl,
        merchant_support_email: params.paymentLink.checkoutOptions.merchantSupportEmail,
        ask_for_shipping_address: params.paymentLink.checkoutOptions.askForShippingAddress,
        accepted_payment_methods: params.paymentLink.checkoutOptions.acceptedPaymentMethods
      };
    }

    if (params.paymentLink.prePopulatedData) {
      requestBody.payment_link.pre_populated_data = {
        buyer_email: params.paymentLink.prePopulatedData.buyerEmail,
        buyer_phone_number: params.paymentLink.prePopulatedData.buyerPhoneNumber,
        buyer_address: params.paymentLink.prePopulatedData.buyerAddress
      };
    }

    const response = await fetch(
      `${this.getApiUrl()}/v2/online-checkout/payment-links/${params.id}`,
      {
        method: 'PUT',
        headers: {
          'Square-Version': '2025-05-21',
          'Authorization': `Bearer ${this.getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Square API error: ${JSON.stringify(data)}`);
    }

    return {
      result: data,
      errors: []
    };
  }

  // Delete payment link
  async deletePaymentLink(id: string): Promise<SquareApiResponse<Record<string, never>>> {
    const response = await fetch(
      `${this.getApiUrl()}/v2/online-checkout/payment-links/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Square-Version': '2025-05-21',
          'Authorization': `Bearer ${this.getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Square API error: ${JSON.stringify(data)}`);
    }

    return {
      result: {},
      errors: []
    };
  }
} 
import { Square } from "square";
import { BaseSquareClient } from './base-client';
import type { 
  SquareInvoiceResponse, 
  SquareListResponse,
  SquareApiResponse 
} from './types';

export class InvoicesService extends BaseSquareClient {

  // Invoices API - proper implementation using Square SDK
  async createInvoice(params: {
    orderId: string;
    paymentRequests: Array<{
      requestType: 'BALANCE' | 'DEPOSIT' | 'INSTALLMENT';
      dueDate?: string;
      tippingEnabled?: boolean;
      automaticPaymentSource?: 'NONE' | 'CARD_ON_FILE' | 'BANK_ON_FILE';
      cardId?: string;
    }>;
    primaryRecipient: {
      customerId: string;
    };
    invoiceNumber?: string;
    title?: string;
    description?: string;
    deliveryMethod?: 'EMAIL' | 'SMS' | 'SHARE_MANUALLY';
    paymentConditions?: string;
    customFields?: Array<{
      label: string;
      value: string;
      placement: 'ABOVE_LINE_ITEMS' | 'BELOW_LINE_ITEMS';
    }>;
    acceptedPaymentMethods?: {
      card?: boolean;
      squareGiftCard?: boolean;
      bankAccount?: boolean;
      buyNowPayLater?: boolean;
      cashAppPay?: boolean;
    };
  }): Promise<SquareInvoiceResponse> {
    return this.client.invoices.create({
      invoice: {
        orderId: params.orderId,
        paymentRequests: params.paymentRequests.map(pr => ({
          requestType: pr.requestType,
          dueDate: pr.dueDate,
          tippingEnabled: pr.tippingEnabled,
          automaticPaymentSource: pr.automaticPaymentSource,
          cardId: pr.cardId
        })),
        primaryRecipient: params.primaryRecipient,
        invoiceNumber: params.invoiceNumber,
        title: params.title,
        description: params.description,
        deliveryMethod: params.deliveryMethod,
        paymentConditions: params.paymentConditions,
        customFields: params.customFields,
        acceptedPaymentMethods: params.acceptedPaymentMethods
      }
    });
  }

  // Publish invoice
  async publishInvoice(params: {
    invoiceId: string;
    version: number;
  }): Promise<SquareInvoiceResponse> {
    return this.client.invoices.publish({
      invoiceId: params.invoiceId,
      version: params.version
    });
  }

  // Get invoice
  async getInvoice(invoiceId: string): Promise<SquareInvoiceResponse> {
    return this.client.invoices.get({ invoiceId });
  }

  // List invoices
  async listInvoices(params?: {
    locationId?: string;
    cursor?: string;
    limit?: number;
  }): Promise<SquareInvoiceResponse> {
    const response = await this.client.invoices.list({
      locationId: params?.locationId || this.locationId,
      cursor: params?.cursor,
      limit: params?.limit
    }) as SquareListResponse<Square.Invoice>;
    
    return {
      result: {
        invoices: response.data || []
      },
      cursor: response.cursor,
      errors: []
    };
  }

  // Update invoice
  async updateInvoice(params: {
    invoiceId: string;
    version: number;
    paymentRequests?: Array<Square.InvoicePaymentRequest>;
    primaryRecipient?: Square.InvoiceRecipient;
    deliveryMethod?: 'EMAIL' | 'SMS' | 'SHARE_MANUALLY';
    acceptedPaymentMethods?: Square.InvoiceAcceptedPaymentMethods;
    customFields?: Array<Square.InvoiceCustomField>;
  }): Promise<SquareInvoiceResponse> {
    return this.client.invoices.update({
      invoiceId: params.invoiceId,
      invoice: {
        version: params.version,
        paymentRequests: params.paymentRequests,
        primaryRecipient: params.primaryRecipient,
        deliveryMethod: params.deliveryMethod as Square.InvoiceDeliveryMethod,
        acceptedPaymentMethods: params.acceptedPaymentMethods,
        customFields: params.customFields
      }
    });
  }

  // Cancel invoice
  async cancelInvoice(params: {
    invoiceId: string;
    version: number;
  }): Promise<SquareInvoiceResponse> {
    return this.client.invoices.cancel({
      invoiceId: params.invoiceId,
      version: params.version
    });
  }

  // Send invoice
  async sendInvoice(params: {
    invoiceId: string;
    requestMethod?: 'EMAIL' | 'SMS' | 'SHARE_MANUALLY';
  }): Promise<SquareInvoiceResponse> {
    // Square SDK v35+ uses a different approach for sending invoices
    // First, we need to publish the invoice if it's not already published
    const invoice = await this.getInvoice(params.invoiceId);
    
    if (invoice.result?.invoice?.status === 'DRAFT') {
      // Publish the invoice first
      await this.publishInvoice({
        invoiceId: params.invoiceId,
        version: invoice.result.invoice.version || 0
      });
    }
    
    // Return the updated invoice with the public URL
    return this.getInvoice(params.invoiceId);
  }

  // Delete invoice
  async deleteInvoice(invoiceId: string, version: number): Promise<SquareApiResponse<Record<string, never>>> {
    return this.client.invoices.delete({
      invoiceId,
      version
    });
  }
} 
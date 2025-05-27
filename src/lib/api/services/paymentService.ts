import { apiClient } from '../apiClient';

// Types
export enum PaymentType {
  CONSULTATION = 'consultation',
  DRAWING_CONSULTATION = 'drawing_consultation',
  TATTOO_DEPOSIT = 'tattoo_deposit',
  TATTOO_FINAL = 'tattoo_final'
}

export interface PaymentLink {
  id: string;
  url: string;
  createdAt: string;
  status?: string;
  amount?: number;
  title?: string;
}

export interface CreatePaymentLinkParams {
  amount: number;
  title: string;
  description?: string;
  customerId: string;
  appointmentId?: string;
  tattooRequestId?: string;
  paymentType: PaymentType;
  redirectUrl?: string;
  allowTipping?: boolean;
  customFields?: Array<{ title: string }>;
}

export interface CreateInvoiceParams {
  customerId: string;
  appointmentId?: string;
  tattooRequestId?: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
  paymentSchedule?: Array<{
    amount: number;
    dueDate: string;
    type: 'DEPOSIT' | 'BALANCE';
  }>;
  deliveryMethod?: 'EMAIL' | 'SMS' | 'SHARE_MANUALLY';
}

export interface CreateCheckoutParams {
  customerId: string;
  appointmentId?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    note?: string;
  }>;
  redirectUrl?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  publicUrl?: string;
  status: string;
  amount?: number;
}

export interface CheckoutSession {
  checkoutUrl: string;
  checkoutId: string;
}

class PaymentService {
  private basePath = '/payments';

  /**
   * Create a payment link
   */
  async createPaymentLink(params: CreatePaymentLinkParams): Promise<{ success: boolean; data: PaymentLink }> {
    return apiClient.post(`${this.basePath}/links`, params);
  }

  /**
   * List payment links
   */
  async listPaymentLinks(params?: { cursor?: string; limit?: number }): Promise<{
    success: boolean;
    data: PaymentLink[];
    cursor?: string;
  }> {
    return apiClient.get(`${this.basePath}/links`, { params });
  }

  /**
   * Get payment link details
   */
  async getPaymentLink(id: string): Promise<{ success: boolean; data: PaymentLink }> {
    return apiClient.get(`${this.basePath}/links/${id}`);
  }

  /**
   * Delete a payment link
   */
  async deletePaymentLink(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`${this.basePath}/links/${id}`);
  }

  /**
   * Create an invoice
   */
  async createInvoice(params: CreateInvoiceParams): Promise<{ success: boolean; data: Invoice }> {
    return apiClient.post(`${this.basePath}/invoices`, params);
  }

  /**
   * Create a checkout session
   */
  async createCheckoutSession(params: CreateCheckoutParams): Promise<{ success: boolean; data: CheckoutSession }> {
    return apiClient.post(`${this.basePath}/checkout`, params);
  }

  /**
   * Helper to format payment type for display
   */
  formatPaymentType(type: PaymentType): string {
    const typeMap = {
      [PaymentType.CONSULTATION]: 'Consultation',
      [PaymentType.DRAWING_CONSULTATION]: 'Drawing Consultation',
      [PaymentType.TATTOO_DEPOSIT]: 'Tattoo Deposit',
      [PaymentType.TATTOO_FINAL]: 'Final Payment'
    };
    return typeMap[type] || type;
  }

  /**
   * Helper to get minimum amounts for payment types
   */
  getMinimumAmount(type: PaymentType): number {
    const minimums = {
      [PaymentType.CONSULTATION]: 35,
      [PaymentType.DRAWING_CONSULTATION]: 50,
      [PaymentType.TATTOO_DEPOSIT]: 75,
      [PaymentType.TATTOO_FINAL]: 100
    };
    return minimums[type] || 0;
  }
}

export const paymentService = new PaymentService(); 
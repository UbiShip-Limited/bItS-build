import { apiClient } from '../apiClient';
import { PaymentType, getMinimumAmount, formatPaymentType } from '../../types/shared';

// Re-export PaymentType for easier imports
export { PaymentType } from '../../types/shared';

// Types - PaymentType is now imported from centralized config
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

export interface DirectPaymentParams {
  sourceId: string;
  amount: number;
  customerId: string;
  paymentType: PaymentType;
  bookingId?: string;
  note?: string;
}

export interface PaymentListParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  customerId?: string;
  paymentType?: PaymentType;
  startDate?: string;
  endDate?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  publicUrl?: string;
  status: string;
  amount?: number;
}

export interface PaymentResponse {
  success: boolean;
  data: any;
  type: 'payment_link' | 'invoice' | 'direct_payment';
}

export interface PaymentListResponse {
  data: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

class PaymentService {
  private basePath = '/payments';

  /**
   * Get list of payments
   */
  async getPayments(params?: PaymentListParams): Promise<PaymentListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return apiClient.get(`${this.basePath}?${searchParams.toString()}`);
  }

  /**
   * Create a payment link
   */
  async createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentResponse> {
    // Client-side validation
    const minAmount = this.getMinimumAmount(params.paymentType);
    if (params.amount < minAmount) {
      throw new Error(`Minimum amount for ${this.formatPaymentType(params.paymentType)} is $${minAmount}`);
    }

    if (params.amount > 10000) {
      throw new Error('Payment amount exceeds maximum limit ($10,000 CAD)');
    }

    if (!params.title?.trim()) {
      throw new Error('Payment title is required');
    }

    return apiClient.post(this.basePath, {
      type: 'payment_link',
      ...params
    });
  }

  /**
   * Create an invoice
   */
  async createInvoice(params: CreateInvoiceParams): Promise<PaymentResponse> {
    return apiClient.post(this.basePath, {
      type: 'invoice',
      ...params
    });
  }

  /**
   * Process a direct payment
   */
  async processDirectPayment(params: DirectPaymentParams): Promise<PaymentResponse> {
    return apiClient.post(this.basePath, {
      type: 'direct_payment',
      ...params
    });
  }

  /**
   * List payment links (now uses admin routes)
   */
  async listPaymentLinks(params?: { cursor?: string; limit?: number }): Promise<{
    success: boolean;
    data: PaymentLink[];
    cursor?: string;
  }> {
    // This would use the admin routes for listing specific payment links
    // For now, we'll use the general payments endpoint and filter
    const payments = await this.getPayments({ paymentType: 'tattoo_deposit' });
    return {
      success: true,
      data: payments.data,
      cursor: undefined
    };
  }

  /**
   * Get payment link details (now uses admin routes)
   */
  async getPaymentLink(id: string): Promise<{ success: boolean; data: PaymentLink }> {
    // This would need to use the admin individual payment endpoint
    const payment = await apiClient.get(`${this.basePath}/${id}`);
    return {
      success: true,
      data: payment
    };
  }

  /**
   * Delete a payment link - deprecated (use cancel instead)
   */
  async deletePaymentLink(id: string): Promise<{ success: boolean; message: string }> {
    console.warn('deletePaymentLink is deprecated. Consider using cancellation instead.');
    return {
      success: false,
      message: 'Payment link deletion not supported. Use cancellation instead.'
    };
  }

  /**
   * Helper to format payment type for display
   */
  formatPaymentType(type: PaymentType): string {
    return formatPaymentType(type);
  }

  /**
   * Helper to get minimum amounts for payment types
   */
  getMinimumAmount(type: PaymentType): number {
    return getMinimumAmount(type);
  }
}

export const paymentService = new PaymentService(); 
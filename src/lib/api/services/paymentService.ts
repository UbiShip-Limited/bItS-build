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
  private client = apiClient;

  /**
   * Get payments with filtering
   */
  async getPayments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    paymentType?: PaymentType;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    success: boolean;
    data: any[];
    pagination?: any;
  }> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.customerId) queryParams.append('customerId', params.customerId);
    if (params?.paymentType) queryParams.append('paymentType', params.paymentType);
    if (params?.startDate) queryParams.append('startDate', params.startDate.toISOString());
    if (params?.endDate) queryParams.append('endDate', params.endDate.toISOString());
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.client.get(`${this.basePath}${queryString}`);
  }

  /**
   * Get payments for a specific customer using core endpoint (accessible by artists)
   */
  async getCustomerPayments(customerId: string, limit: number = 50): Promise<{
    success: boolean;
    data: any[];
    pagination?: any;
  }> {
    const queryParams = new URLSearchParams();
    queryParams.append('customerId', customerId);
    queryParams.append('limit', limit.toString());
    
    const response = await this.client.get(`/payments?${queryParams.toString()}`);
    
    return {
      success: true,
      data: response.data || [],
      pagination: response.pagination
    };
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

    return this.client.post(this.basePath, {
      type: 'payment_link',
      ...params
    });
  }

  /**
   * Create an invoice
   */
  async createInvoice(params: CreateInvoiceParams): Promise<PaymentResponse> {
    return this.client.post(this.basePath, {
      type: 'invoice',
      ...params
    });
  }

  /**
   * Process a direct payment
   */
  async processDirectPayment(params: DirectPaymentParams): Promise<PaymentResponse> {
    return this.client.post(this.basePath, {
      type: 'direct_payment',
      ...params
    });
  }

  /**
   * List payment links (corrected to use proper endpoint)
   */
  async listPaymentLinks(params?: { cursor?: string; limit?: number }): Promise<{
    success: boolean;
    data: PaymentLink[];
    cursor?: string;
  }> {
    return this.client.get('/payments/links', { params });
  }

  /**
   * Get payment link details (now uses admin routes)
   */
  async getPaymentLink(id: string): Promise<{ success: boolean; data: PaymentLink }> {
    // This would need to use the admin individual payment endpoint
    const payment = await this.client.get(`${this.basePath}/${id}`);
    return {
      success: true,
      data: payment
    };
  }

  /**
   * Delete a payment link
   */
  async deletePaymentLink(id: string): Promise<{ success: boolean; message: string }> {
    return this.client.delete(`/payments/links/${id}`);
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
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
  
  // Enhanced cache for customer payments to prevent over-fetching
  private paymentCache = new Map<string, { 
    data: any; 
    timestamp: number; 
    promise?: Promise<any>;
    failed?: boolean;
  }>();
  private readonly CACHE_DURATION = 10000; // 10 seconds cache
  private readonly FAILED_CACHE_DURATION = 5000; // 5 seconds for failed requests

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
   * Enhanced with better caching and error handling to prevent repeated failed calls
   */
  async getCustomerPayments(customerId: string, limit: number = 50): Promise<{
    success: boolean;
    data: any[];
    pagination?: any;
  }> {
    const cacheKey = `customer-${customerId}-${limit}`;
    const now = Date.now();
    const cached = this.paymentCache.get(cacheKey);
    
    // Return cached data if still valid (for successful requests)
    if (cached && !cached.failed && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`📝 Using cached payments for customer ${customerId}`);
      return cached.data;
    }
    
    // For failed requests, wait longer before retrying
    if (cached && cached.failed && (now - cached.timestamp) < this.FAILED_CACHE_DURATION) {
      console.log(`⚠️ Skipping customer payments for ${customerId} - recent failure, waiting before retry`);
      throw new Error('Payment service temporarily unavailable - please try again later');
    }
    
    // If there's already a pending request, return that promise
    if (cached?.promise) {
      console.log(`⏳ Waiting for existing request for customer ${customerId}`);
      return cached.promise;
    }
    
    const queryParams = new URLSearchParams();
    queryParams.append('customerId', customerId);
    queryParams.append('limit', limit.toString());
    
    // Create the request promise with better error handling
    const requestPromise = this.client.get(`${this.basePath}?${queryParams.toString()}`)
      .then((response: any) => {
        const result = {
          success: true,
          data: response.data || [],
          pagination: response.pagination
        };
        
        // Cache the successful result
        this.paymentCache.set(cacheKey, {
          data: result,
          timestamp: now,
          failed: false
        });
        
        console.log(`✅ Fetched and cached ${result.data.length} payments for customer ${customerId}`);
        return result;
      })
      .catch((error: any) => {
        // Cache the failed state to prevent immediate retries
        this.paymentCache.set(cacheKey, {
          data: null,
          timestamp: now,
          failed: true
        });
        
        console.error(`❌ Failed to fetch payments for customer ${customerId}:`, error.message || error);
        
        // Return a failed response instead of throwing
        const errorMessage = error.response?.status === 404
          ? 'Payment service not available - this feature may not be configured yet'
          : error.response?.status === 401 || error.response?.status === 403
          ? 'You do not have permission to view payment information'
          : 'Unable to load payment history at this time';
        
        return {
          success: false,
          data: [],
          error: errorMessage
        };
      });
    
    // Cache the promise to prevent duplicate requests
    this.paymentCache.set(cacheKey, {
      data: null,
      timestamp: now,
      promise: requestPromise,
      failed: false
    });
    
    return requestPromise;
  }

  /**
   * Clear cache for a specific customer (useful after payment updates)
   */
  clearCustomerCache(customerId: string): void {
    const keysToDelete = Array.from(this.paymentCache.keys()).filter(key => 
      key.startsWith(`customer-${customerId}-`)
    );
    keysToDelete.forEach(key => this.paymentCache.delete(key));
    console.log(`🧹 Cleared payment cache for customer ${customerId}`);
  }

  /**
   * Clear all cache (useful for debugging)
   */
  clearAllCache(): void {
    this.paymentCache.clear();
    console.log('🧹 Cleared all payment cache');
  }

  /**
   * Test if payment routes are available (diagnostic method)
   */
  async testPaymentRoutes(): Promise<{ available: boolean; message: string }> {
    try {
      // Test with a simple call to see if the route exists
      const response = await this.client.get(`${this.basePath}?limit=1`);
      return {
        available: true,
        message: 'Payment routes are working correctly'
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          available: false,
          message: 'Payment routes not found - backend may not be running or routes not registered'
        };
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        // Authentication errors mean the routes exist but user isn't logged in
        // This is actually a "working" state for our purposes
        return {
          available: true,
          message: 'Payment routes exist but require authentication - this is normal'
        };
      } else if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
        return {
          available: false,
          message: 'Cannot connect to backend server - please ensure the backend is running'
        };
      } else {
        return {
          available: false,
          message: `Payment routes error: ${error.message || 'Unknown error'}`
        };
      }
    }
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
    return this.client.get(`${this.basePath}/links`, { params });
  }

  /**
   * Get payment link details (now uses admin routes)
   */
  async getPaymentLink(id: string): Promise<{ success: boolean; data: PaymentLink }> {
    // This would need to use the admin individual payment endpoint
    const payment = await this.client.get(`${this.basePath}/${id}`) as PaymentLink;
    return {
      success: true,
      data: payment
    };
  }

  /**
   * Delete a payment link
   */
  async deletePaymentLink(id: string): Promise<{ success: boolean; message: string }> {
    return this.client.delete(`${this.basePath}/links/${id}`);
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
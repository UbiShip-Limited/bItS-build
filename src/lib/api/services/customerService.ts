import { ApiClient } from '../apiClient';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  squareId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListResponse {
  data: Customer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export class CustomerService {
  // Simple cache for customer data
  private customerCache = new Map<string, { 
    data: Customer; 
    timestamp: number; 
  }>();
  private searchCache = new Map<string, { 
    data: CustomerListResponse; 
    timestamp: number; 
  }>();
  private readonly CACHE_DURATION = 30000; // 30 seconds for individual customers
  private readonly SEARCH_CACHE_DURATION = 10000; // 10 seconds for searches

  constructor(private apiClient: ApiClient) {}

  async getCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<CustomerListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.search) {
      queryParams.append('search', params.search);
    }
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    // Cache search results for short duration
    const cacheKey = `list-${queryString}`;
    const cached = this.searchCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.SEARCH_CACHE_DURATION) {
      console.log(`📝 Using cached customer list for: ${queryString}`);
      return cached.data;
    }
    
    const response = await this.apiClient.get<CustomerListResponse>(`/customers${queryString}`);
    
    // Cache the result
    this.searchCache.set(cacheKey, {
      data: response,
      timestamp: now
    });
    
    return response;
  }

  async getCustomer(id: string): Promise<Customer> {
    const now = Date.now();
    const cached = this.customerCache.get(id);
    
    // Return cached data if still valid
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`📝 Using cached customer data for: ${id}`);
      return cached.data;
    }
    
    const response = await this.apiClient.get<Customer>(`/customers/${id}`);
    
    // Cache the customer data
    this.customerCache.set(id, {
      data: response,
      timestamp: now
    });
    
    return response;
  }

  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    const response = await this.apiClient.post<Customer>('/customers', data);
    
    // Cache the new customer
    this.customerCache.set(response.id, {
      data: response,
      timestamp: Date.now()
    });
    
    // Clear search cache as results are now stale
    this.clearSearchCache();
    
    return response;
  }

  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<Customer> {
    const response = await this.apiClient.put<Customer>(`/customers/${id}`, data);
    
    // Update cache with new data
    this.customerCache.set(id, {
      data: response,
      timestamp: Date.now()
    });
    
    // Clear search cache as results are now stale
    this.clearSearchCache();
    
    return response;
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.apiClient.delete(`/customers/${id}`);
    
    // Remove from cache
    this.customerCache.delete(id);
    
    // Clear search cache as results are now stale
    this.clearSearchCache();
  }

  async searchCustomers(searchTerm: string): Promise<CustomerListResponse> {
    return this.getCustomers({ search: searchTerm, limit: 50 });
  }

  /**
   * Clear customer cache (call after operations that affect multiple customers)
   */
  clearCustomerCache(customerId?: string): void {
    if (customerId) {
      this.customerCache.delete(customerId);
      console.log(`🧹 Cleared cache for customer ${customerId}`);
    } else {
      this.customerCache.clear();
      console.log('🧹 Cleared all customer cache');
    }
  }

  /**
   * Clear search cache (call after create/update/delete operations)
   */
  clearSearchCache(): void {
    this.searchCache.clear();
    console.log('🧹 Cleared customer search cache');
  }
} 
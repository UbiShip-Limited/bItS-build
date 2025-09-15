import { ApiClient } from '../apiClient';

// Types for TattooRequest
export interface TattooRequest {
  id: string;
  customerId?: string;
  firstName?: string;
  contactEmail?: string;
  contactPhone?: string;
  trackingToken?: string;
  description: string;
  placement?: string;
  size?: string;
  colorPreference?: string;
  style?: string;
  status: string;
  depositPaid: boolean;
  depositAmount?: number;
  finalAmount?: number;
  paymentId?: string;
  purpose?: string;
  preferredArtist?: string;
  timeframe?: string;
  contactPreference?: string;
  additionalNotes?: string;
  referenceImages: ReferenceImage[];
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
}

export interface ReferenceImage {
  url: string;
  publicId: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
}

export interface TattooRequestsResponse {
  data: TattooRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CreateTattooRequestPayload {
  customerId?: string;
  firstName?: string;
  contactEmail?: string;
  contactPhone?: string;
  description: string;
  placement?: string;
  size?: string;
  colorPreference?: string;
  style?: string;
  purpose?: string;
  preferredArtist?: string;
  timeframe?: string;
  contactPreference?: string;
  additionalNotes?: string;
  referenceImages?: ReferenceImage[];
}

export interface UpdateTattooRequestPayload {
  status?: string;
  notes?: string;
  customerId?: string;
}

export interface TattooRequestFormData {
  firstName?: string;
  contactEmail: string;
  contactPhone?: string;
  description: string;
  placement: string;
  size: string;
  colorPreference: string;
  style: string;
  purpose?: string;
  preferredArtist?: string;
  timeframe?: string;
  contactPreference?: string;
  additionalNotes?: string;
  referenceImages?: Array<{
    url: string;
    publicId: string;
  }>;
  customerId?: string;
}



/**
 * Frontend API Client for tattoo request operations
 * Handles HTTP communication with the backend API
 */
export class TattooRequestApiClient {
  private client: ApiClient;
  private baseUrl = '/tattoo-requests';

  constructor(apiClient: ApiClient) {
    this.client = apiClient;
  }

  /**
   * Get all tattoo requests with optional filtering
   */
  public async getAll(
    options?: {
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<TattooRequestsResponse> {
    const queryParams = new URLSearchParams();
    
    if (options?.status) {
      queryParams.append('status', options.status);
    }
    
    if (options?.page) {
      queryParams.append('page', options.page.toString());
    }
    
    if (options?.limit) {
      queryParams.append('limit', options.limit.toString());
    }
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.client.get<TattooRequestsResponse>(`${this.baseUrl}${queryString}`);
  }
  
  /**
   * Get a single tattoo request by ID
   */
  public async getById(id: string): Promise<TattooRequest> {
    const url = `${this.baseUrl}/${id}`;
    console.log('🔗 [TattooRequestApiClient] GET request to:', url);
    console.log('🔗 [TattooRequestApiClient] Request ID:', id);
    console.log('🔗 [TattooRequestApiClient] Base URL:', this.client.getBaseURL());
    console.log('🔗 [TattooRequestApiClient] Full URL (before rewrite):', `${this.client.getBaseURL()}${url}`);
    console.log('🔗 [TattooRequestApiClient] Expected backend URL:', url.replace('/api', ''));

    try {
      const result = await this.client.get<TattooRequest>(url);
      console.log('✅ [TattooRequestApiClient] Response received:', result);
      return result;
    } catch (error) {
      console.error('❌ [TattooRequestApiClient] Request failed:', error);
      console.error('❌ [TattooRequestApiClient] Error details:', {
        url: `${this.client.getBaseURL()}${url}`,
        error: error
      });
      throw error;
    }
  }
  
  /**
   * Create a new tattoo request (public endpoint - no auth required)
   */
  public async create(payload: CreateTattooRequestPayload | TattooRequestFormData): Promise<TattooRequest> {
    return this.client.post<TattooRequest>(this.baseUrl, payload, { skipAuth: true });
  }
  
  /**
   * Update an existing tattoo request
   */
  public async update(id: string, payload: UpdateTattooRequestPayload): Promise<TattooRequest> {
    return this.client.put<TattooRequest>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * Update tattoo request status (admin workflow)
   */
  public async updateStatus(id: string, status: string): Promise<TattooRequest> {
    return this.client.put<TattooRequest>(`${this.baseUrl}/${id}/status`, { status });
  }

  /**
   * Get a tattoo request by ID
   */
  async getTattooRequestById(id: string): Promise<TattooRequest> {
    const response = await this.client.get<TattooRequest>(`${this.baseUrl}/${id}`);
    return response;
  }
}

// Export the class with both names for backward compatibility during transition
export { TattooRequestApiClient as TattooRequestService }; 
import { apiClient } from '../apiClient';

// Types for TattooRequest
export interface TattooRequest {
  id: string;
  customerId: string;
  description: string;
  placement?: string;
  size?: string;
  colorPreference?: string;
  style?: string;
  status: 'new' | 'reviewed' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  referenceImages?: ReferenceImage[];
  customer?: Customer;
}

export interface ReferenceImage {
  url: string;
  publicId: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
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
  customerId: string;
  description: string;
  placement?: string;
  size?: string;
  colorPreference?: string;
  style?: string;
  referenceImages?: ReferenceImage[];
}

export interface UpdateTattooRequestPayload {
  status?: 'new' | 'reviewed' | 'approved' | 'rejected';
  notes?: string;
}

/**
 * Service for tattoo request operations
 */
export class TattooRequestService {
  private BASE_PATH = '/tattoo-requests';
  
  /**
   * Get all tattoo requests with optional filtering
   */
  public async getAll(
    options?: {
      status?: 'new' | 'reviewed' | 'approved' | 'rejected';
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
    return apiClient.get<TattooRequestsResponse>(`${this.BASE_PATH}${queryString}`);
  }
  
  /**
   * Get a single tattoo request by ID
   */
  public async getById(id: string): Promise<TattooRequest> {
    return apiClient.get<TattooRequest>(`${this.BASE_PATH}/${id}`);
  }
  
  /**
   * Create a new tattoo request
   */
  public async create(payload: CreateTattooRequestPayload): Promise<TattooRequest> {
    return apiClient.post<TattooRequest>(this.BASE_PATH, payload);
  }
  
  /**
   * Update an existing tattoo request
   */
  public async update(id: string, payload: UpdateTattooRequestPayload): Promise<TattooRequest> {
    return apiClient.put<TattooRequest>(`${this.BASE_PATH}/${id}`, payload);
  }
}

// Export a singleton instance
export const tattooRequestService = new TattooRequestService(); 
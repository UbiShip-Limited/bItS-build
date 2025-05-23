import { ApiClient } from '../apiClient';

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

export interface TattooRequestFormData {
  contactEmail: string;
  contactPhone?: string;
  description: string;
  placement: string;
  size: string;
  colorPreference: string;
  style: string;
  referenceImages?: Array<{
    url: string;
    publicId: string;
  }>;
  customerId?: string;
}

export interface TattooRequestResponse {
  id: string;
  description: string;
  placement: string;
  size: string;
  colorPreference: string;
  style: string;
  status: 'new' | 'reviewed' | 'approved' | 'rejected';
  createdAt: string;
  trackingToken?: string;
  referenceImages: Array<{
    url: string;
    publicId: string;
  }>;
}

/**
 * Service for tattoo request operations
 */
export class TattooRequestService {
  private client: ApiClient;
  private baseUrl = '/api/tattoo-requests';

  constructor(apiClient: ApiClient) {
    this.client = apiClient;
  }

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
    return this.client.get<TattooRequestsResponse>(`${this.baseUrl}${queryString}`);
  }
  
  /**
   * Get a single tattoo request by ID
   */
  public async getById(id: string): Promise<TattooRequest> {
    return this.client.get<TattooRequest>(`${this.baseUrl}/${id}`);
  }
  
  /**
   * Create a new tattoo request
   */
  public async create(payload: CreateTattooRequestPayload): Promise<TattooRequest> {
    return this.client.post<TattooRequest>(this.baseUrl, payload);
  }
  
  /**
   * Update an existing tattoo request
   */
  public async update(id: string, payload: UpdateTattooRequestPayload): Promise<TattooRequest> {
    return this.client.put<TattooRequest>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * Submit a new tattoo request
   */
  async submitTattooRequest(formData: TattooRequestFormData): Promise<TattooRequestResponse> {
    const response = await this.client.post<TattooRequestResponse>(this.baseUrl, formData);
    return response;
  }

  /**
   * Get a tattoo request by ID
   */
  async getTattooRequestById(id: string): Promise<TattooRequestResponse> {
    const response = await this.client.get<TattooRequestResponse>(`${this.baseUrl}/${id}`);
    return response;
  }
}

export default TattooRequestService; 
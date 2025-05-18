import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Define base API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Error type for API responses
export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

/**
 * API Client for interacting with the backend
 */
export class ApiClient {
  private client: AxiosInstance;
  
  constructor() {
    // Create an axios instance with default config
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000, // 15 seconds timeout
    });
    
    // Configure request interceptors
    this.client.interceptors.request.use(
      (config) => this.handleRequest(config),
      (error) => Promise.reject(error)
    );
    
    // Configure response interceptors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }
  
  /**
   * Handle request configuration, including auth tokens
   */
  private handleRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    // Get token from wherever it's stored (localStorage, cookies, etc.)
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    // If token exists, add it to headers
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  }
  
  /**
   * Handle API errors
   */
  private handleError(error: AxiosError): Promise<ApiError> {
    // Default error structure
    const apiError: ApiError = {
      status: error.response?.status || 500,
      message: 'An unexpected error occurred',
      details: null,
    };
    
    // If we have a response, extract error details
    if (error.response?.data) {
      const errorData = error.response.data as any;
      apiError.message = errorData.message || errorData.error || apiError.message;
      apiError.details = errorData.details || null;
    }
    
    // Handle 401 errors (unauthorized) - could trigger logout or token refresh
    if (apiError.status === 401 && typeof window !== 'undefined') {
      // Could dispatch logout action or refresh token here
      console.log('Authentication error - redirecting to login');
      // Example: window.location.href = '/auth/login';
    }
    
    return Promise.reject(apiError);
  }
  
  /**
   * GET request
   */
  public async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(path, config);
    return response.data;
  }
  
  /**
   * POST request
   */
  public async post<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(path, data, config);
    return response.data;
  }
  
  /**
   * PUT request
   */
  public async put<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(path, data, config);
    return response.data;
  }
  
  /**
   * DELETE request
   */
  public async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(path, config);
    return response.data;
  }
}

// Export a singleton instance
export const apiClient = new ApiClient(); 
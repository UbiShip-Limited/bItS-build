import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { createBrowserClient } from '@supabase/ssr';

// Define base API configuration - use Fastify backend by default
// In production, NEXT_PUBLIC_BACKEND_API_URL should be set to your Railway backend URL
const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

// Debug: Log the API URL to make sure it's correct
console.log('🔗 API Client configured for:', API_URL);

// Create Supabase client for getting session tokens
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Cache the session to avoid multiple concurrent calls
let sessionCache: { token: string | null; expires: number } = { token: null, expires: 0 };

async function getAuthToken(): Promise<string | null> {
  const now = Date.now();
  
  // Use cached token if it's still valid (cache for 5 minutes instead of 30 seconds)
  if (sessionCache.token && sessionCache.expires > now) {
    return sessionCache.token;
  }
  
  console.log('🔍 Fetching fresh auth token from Supabase...');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ API Client: Error getting session:', error);
      return null;
    }
    
    if (session?.access_token) {
      // Cache the token for 5 minutes (longer cache to reduce auth overhead)
      sessionCache = {
        token: session.access_token,
        expires: now + 300000 // 5 minutes
      };
      console.log('✅ API Client: Auth token cached successfully for 5 minutes');
      return session.access_token;
    }
    
    console.log('⚠️ API Client: No session found when fetching token');
    return null;
  } catch (error) {
    console.error('❌ API Client: Error fetching auth token:', error);
    return null;
  }
}

// Error type for API responses
export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

/**
 * API Client for interacting with the Fastify backend API (localhost:3001 by default)
 */
export class ApiClient {
  private axiosInstance: AxiosInstance;
  private baseURL: string;
  
  // Request deduplication cache
  private pendingRequests = new Map<string, Promise<any>>();
  
  constructor(baseURL: string = API_URL) {
    // Now calls Fastify backend at localhost:3001 by default (can be overridden with NEXT_PUBLIC_BACKEND_API_URL)
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({
      baseURL: baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout for better error handling (increased for analytics)
      timeout: 60000
    });
    
    // Add request interceptor for auth tokens
    this.axiosInstance.interceptors.request.use(
      async (config: any) => {
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        
        // Skip auth for public endpoints
        if (config.skipAuth) {
          console.log('🔓 Skipping auth for public endpoint');
          delete config.skipAuth; // Remove the custom property before sending
          return config;
        }
        
        try {
          // Get cached auth token
          const token = await getAuthToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔑 Auth token added to request');
          } else {
            console.warn('⚠️ No auth token available for request');
          }
        } catch (error) {
          console.error('❌ Error getting auth token for API request:', error);
        }
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const status = error.response?.status || 'Network Error';
        const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
        const url = error.config?.url || 'unknown';
        
        console.error(`❌ API Error: ${status} ${method} ${url}`, error.message);
        
        // Handle errors (401, 403, etc.)
        if (error.response?.status === 401) {
          console.warn('🚪 Unauthorized request detected, clearing token cache.');
          // Clear auth cache so the next request gets a fresh token
          clearAuthCache();
          
          // Let the calling function/component handle the error and potential redirect.
          // This prevents aggressive sign-outs during token refresh races.
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Generate a cache key for request deduplication
   */
  private getRequestKey(method: string, path: string, config?: AxiosRequestConfig): string {
    const params = config?.params ? JSON.stringify(config.params) : '';
    return `${method.toUpperCase()}-${path}-${params}`;
  }
  
  /**
   * GET request with retry logic and deduplication
   */
  public async get<T>(path: string, config?: AxiosRequestConfig & { skipAuth?: boolean }): Promise<T> {
    const requestKey = this.getRequestKey('GET', path, config);
    
    // Check if the same request is already pending
    if (this.pendingRequests.has(requestKey)) {
      console.log(`⏳ Deduplicating GET request: ${path}`);
      return this.pendingRequests.get(requestKey);
    }
    
    let lastError: unknown;
    const maxRetries = 2;
    
    const requestPromise = (async () => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response: AxiosResponse<T> = await this.axiosInstance.get(path, config);
          return response.data;
        } catch (error: unknown) {
          lastError = error;
          
          // Type guard to check if error is an axios error
          const isAxiosError = error && typeof error === 'object' && 'response' in error;
          const axiosError = isAxiosError ? error as { response?: { status?: number } } : null;
          
          // Don't retry on client errors (4xx) - these won't be fixed by retrying
          if (axiosError?.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
            console.warn(`🚫 Not retrying client error ${axiosError.response.status} for ${path}`);
            throw error;
          }
          
          // Retry on network errors or server errors (5xx)
          if (attempt < maxRetries) {
            const backoffTime = 1000 * attempt; // Linear backoff: 1s, 2s
            console.warn(`🔄 Retrying request (${attempt}/${maxRetries}) for ${path} in ${backoffTime}ms`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          }
        }
      }
      
      throw lastError;
    })();
    
    // Store the promise for deduplication
    this.pendingRequests.set(requestKey, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up the pending request
      this.pendingRequests.delete(requestKey);
    }
  }
  
  /**
   * POST request
   */
  public async post<T>(path: string, data?: unknown, config?: AxiosRequestConfig & { skipAuth?: boolean }): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(path, data, config);
    return response.data;
  }
  
  /**
   * PUT request
   */
  public async put<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.put(path, data, config);
    return response.data;
  }
  
  /**
   * DELETE request
   */
  public async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.delete(path, config);
    return response.data;
  }

  /**
   * POST request for file uploads
   */
  public async uploadFile<T>(path: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(path, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  }
  
  /**
   * Get the base URL for this API client
   */
  public getBaseUrl(): string {
    return this.baseURL;
  }
  
  /**
   * Clear all pending requests (useful for cleanup)
   */
  public clearPendingRequests(): void {
    this.pendingRequests.clear();
    console.log('🧹 Cleared all pending requests');
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

/**
 * Helper function to get authentication headers for direct fetch calls
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const token = await getAuthToken();
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }
  } catch (error) {
    console.error('Error getting auth headers:', error);
  }
  
  return {
    'Content-Type': 'application/json'
  };
}

/**
 * Clear the auth token cache (call this on logout)
 */
export function clearAuthCache(): void {
  sessionCache = { token: null, expires: 0 };
} 
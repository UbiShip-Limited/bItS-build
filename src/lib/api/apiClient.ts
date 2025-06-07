import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { createBrowserClient } from '@supabase/ssr';

// Define base API configuration - now points directly to Fastify backend
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
  
  // Use cached token if it's still valid (cache for 30 seconds)
  if (sessionCache.token && sessionCache.expires > now) {
    console.log('🔄 Using cached auth token');
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
      // Cache the token for 30 seconds
      sessionCache = {
        token: session.access_token,
        expires: now + 30000
      };
      console.log('✅ API Client: Auth token cached successfully');
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
  details?: any;
}

/**
 * API Client for interacting with the Fastify backend directly
 */
export class ApiClient {
  private axiosInstance: AxiosInstance;
  private baseURL: string;
  
  constructor(baseURL: string = API_URL) {
    // Now calls Fastify backend directly instead of Next.js API routes
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({
      baseURL: baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout for better error handling
      timeout: 30000
    });
    
    // Add request interceptor for auth tokens
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
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
   * GET request with retry logic
   */
  public async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    let lastError: any;
    const maxRetries = 2;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response: AxiosResponse<T> = await this.axiosInstance.get(path, config);
        return response.data;
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on auth errors (401, 403)
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw error;
        }
        
        // Don't retry on client errors (4xx except auth)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw error;
        }
        
        // Retry on network errors or server errors (5xx)
        if (attempt < maxRetries) {
          console.warn(`🔄 Retrying request (${attempt}/${maxRetries}): ${path}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * POST request
   */
  public async post<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(path, data, config);
    return response.data;
  }
  
  /**
   * PUT request
   */
  public async put<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
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
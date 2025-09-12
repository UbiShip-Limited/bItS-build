import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { createBrowserClient } from '@supabase/ssr';

// Define base API configuration - use Fastify backend by default
// In production, NEXT_PUBLIC_BACKEND_API_URL should be set to your Railway backend URL
const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

// Debug: Log the API URL to make sure it's correct
console.log('🔗 API Client configured for:', API_URL);
console.log('🌍 Environment:', process.env.NODE_ENV);
console.log('🖥️  Platform:', typeof window !== 'undefined' ? 'Browser' : 'Server');

// Production debugging for Railway deployment
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Production API Client initialized');
  console.log('   - Backend URL:', API_URL);
  console.log('   - Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing');
  console.log('   - Frontend Domain:', process.env.NEXT_PUBLIC_SITE_URL || 'not specified');
}

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
    // Determine timeout based on environment and Railway deployment
    const isRailway = baseURL.includes('railway.app');
    const baseTimeout = 60000; // 60 seconds base timeout
    const railwayTimeout = 90000; // 90 seconds for Railway (cold starts)
    const timeout = isRailway ? railwayTimeout : baseTimeout;
    
    console.log(`⏱️  API Client timeout configured: ${timeout}ms ${isRailway ? '(Railway)' : '(Local)'}`);
    
    this.axiosInstance = axios.create({
      baseURL: baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      // Increased timeout for Railway cold starts and production issues
      timeout: timeout,
      // Add retry configuration for Railway
      ...(isRailway && {
        // Additional Railway-specific configuration
        maxRedirects: 3,
      })
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
        
        // Enhanced error logging for production debugging
        console.error(`❌ API Error: ${status} ${method} ${url}`, error.message);
        
        // Log additional details for production debugging
        if (process.env.NODE_ENV === 'production') {
          console.error('🔍 Production Error Details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            baseURL: this.baseURL,
            url: url,
            method: method,
            headers: error.config?.headers,
            responseData: error.response?.data,
            isNetworkError: !error.response,
            isTimeout: error.code === 'ECONNABORTED',
            railwaySpecific: {
              isRailwayDomain: this.baseURL.includes('railway.app'),
              possibleColdStart: !error.response && error.code === 'ECONNABORTED',
            }
          });
        }
        
        // Handle Railway-specific issues
        if (!error.response && this.baseURL.includes('railway.app')) {
          console.warn('🚂 Railway backend may be experiencing issues:');
          console.warn('   - Cold start (backend sleeping)');
          console.warn('   - Network connectivity issues');
          console.warn('   - Backend deployment problems');
        }
        
        // Handle errors (401, 403, etc.)
        if (error.response?.status === 401) {
          console.warn('🚪 Unauthorized request detected, clearing token cache.');
          // Clear auth cache so the next request gets a fresh token
          clearAuthCache();
          
          // Let the calling function/component handle the error and potential redirect.
          // This prevents aggressive sign-outs during token refresh races.
        }
        
        // Handle 500 errors specifically for dashboard routes
        if (error.response?.status === 500 && (url.includes('/tattoo-requests/') || url.includes('/appointments/'))) {
          console.error('🏥 Dashboard route 500 error detected:', {
            route: url,
            possibleCauses: [
              'Authentication middleware failure',
              'Database connection timeout', 
              'Missing environment variables',
              'Railway deployment issues'
            ]
          });
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
   * Get the base URL for debugging
   */
  public getBaseURL(): string {
    return this.baseURL;
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
    // Increase retries for Railway due to cold start issues
    const isRailway = this.baseURL.includes('railway.app');
    const maxRetries = isRailway ? 3 : 2;
    
    const requestPromise = (async () => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response: AxiosResponse<T> = await this.axiosInstance.get(path, config);
          
          // Log successful requests for Railway debugging
          if (process.env.NODE_ENV === 'production' && isRailway) {
            console.log(`✅ Railway request successful: ${path} (attempt ${attempt})`);
          }
          
          return response.data;
        } catch (error: unknown) {
          lastError = error;
          
          // Type guard to check if error is an axios error
          const isAxiosError = error && typeof error === 'object' && 'response' in error;
          const axiosError = isAxiosError ? error as { response?: { status?: number }, code?: string } : null;
          
          // Don't retry on client errors (4xx) - these won't be fixed by retrying
          if (axiosError?.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
            console.warn(`🚫 Not retrying client error ${axiosError.response.status} for ${path}`);
            throw error;
          }
          
          // Special handling for Railway cold start and network issues
          const isNetworkError = !axiosError?.response;
          const isTimeout = axiosError?.code === 'ECONNABORTED' || axiosError?.code === 'ETIMEDOUT';
          const isRailwayIssue = isRailway && (isNetworkError || isTimeout || axiosError?.response?.status === 500);
          
          // Retry on network errors or server errors (5xx), with special Railway handling
          if (attempt < maxRetries) {
            let backoffTime = 1000 * attempt; // Base backoff: 1s, 2s, 3s
            
            // Increase backoff time for Railway issues (cold starts need more time)
            if (isRailwayIssue) {
              backoffTime = Math.min(2000 * Math.pow(1.5, attempt - 1), 8000); // 2s, 3s, 4.5s, max 8s
              console.warn(`🚂 Railway issue detected, using extended backoff: ${backoffTime}ms`);
            }
            
            console.warn(`🔄 Retrying request (${attempt}/${maxRetries}) for ${path} in ${backoffTime}ms`);
            console.warn(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          } else {
            // Log final failure details for Railway
            if (isRailway) {
              console.error(`🚂 Railway request failed after ${maxRetries} attempts: ${path}`, {
                finalError: error instanceof Error ? error.message : error,
                isNetworkError,
                isTimeout,
                statusCode: axiosError?.response?.status
              });
            }
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
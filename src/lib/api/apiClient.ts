import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { createBrowserClient } from '@supabase/ssr';

// Define base API configuration
// Always use Next.js rewrites to avoid CORS issues
// The /api/* routes are rewritten to the backend URL in next.config.ts
const API_URL = '/api';

// Only log in browser to avoid SSR noise
if (typeof window !== 'undefined') {
  console.log('🔗 API Client configured for:', API_URL);
  console.log('🌍 Environment:', process.env.NODE_ENV);
  console.log('🖥️  Platform:', 'Browser');

  // Production debugging for Railway deployment
  if (process.env.NODE_ENV === 'production') {
    console.log('🚀 Production API Client initialized');
    console.log('   - API URL:', API_URL);
    console.log('   - Backend URL (via rewrite):', process.env.NEXT_PUBLIC_BACKEND_API_URL || 'not configured');
    console.log('   - Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing');
    console.log('   - Frontend Domain:', process.env.NEXT_PUBLIC_SITE_URL || 'not specified');
  }
}

// Lazy initialize Supabase client only in browser
let supabase: ReturnType<typeof createBrowserClient> | null = null;

function getSupabaseClient() {
  if (typeof window === 'undefined') {
    return null; // Don't initialize on server
  }

  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables');
      return null;
    }

    try {
      supabase = createBrowserClient(supabaseUrl, supabaseKey);
    } catch (error) {
      console.error('❌ Failed to create Supabase client:', error);
      return null;
    }
  }

  return supabase;
}

// Cache the session to avoid multiple concurrent calls
let sessionCache: { token: string | null; expires: number } = { token: null, expires: 0 };

async function getAuthToken(): Promise<string | null> {
  // Don't try to get auth token on server
  if (typeof window === 'undefined') {
    return null;
  }

  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    return null;
  }

  const now = Date.now();

  // Use cached token if it's still valid (cache for 5 minutes instead of 30 seconds)
  if (sessionCache.token && sessionCache.expires > now) {
    return sessionCache.token;
  }

  console.log('🔍 Fetching fresh auth token from Supabase...');
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
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
    // Use relative URLs to go through Next.js rewrites
    this.baseURL = baseURL;
    // Determine timeout based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const baseTimeout = 60000; // 60 seconds base timeout
    const productionTimeout = 90000; // 90 seconds for production (cold starts)
    const timeout = isProduction ? productionTimeout : baseTimeout;

    // Only log in browser
    if (typeof window !== 'undefined') {
      console.log(`⏱️  API Client timeout configured: ${timeout}ms ${isProduction ? '(Production)' : '(Development)'}`);
    }
    
    this.axiosInstance = axios.create({
      baseURL: baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      // Increased timeout for production cold starts
      timeout: timeout,
      // Add retry configuration for production
      ...(isProduction && {
        // Additional production-specific configuration
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
    // Increase retries for production due to cold start issues
    const isProduction = process.env.NODE_ENV === 'production';
    const maxRetries = isProduction ? 3 : 2;
    
    const requestPromise = (async () => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response: AxiosResponse<T> = await this.axiosInstance.get(path, config);
          
          // Log successful requests for production debugging
          if (isProduction) {
            console.log(`✅ Production request successful: ${path} (attempt ${attempt})`);
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
          
          // Special handling for production cold start and network issues
          const isNetworkError = !axiosError?.response;
          const isTimeout = axiosError?.code === 'ECONNABORTED' || axiosError?.code === 'ETIMEDOUT';
          const isProductionIssue = isProduction && (isNetworkError || isTimeout || axiosError?.response?.status === 500);

          // Retry on network errors or server errors (5xx), with special production handling
          if (attempt < maxRetries) {
            let backoffTime = 1000 * attempt; // Base backoff: 1s, 2s, 3s

            // Increase backoff time for production issues (cold starts need more time)
            if (isProductionIssue) {
              backoffTime = Math.min(2000 * Math.pow(1.5, attempt - 1), 8000); // 2s, 3s, 4.5s, max 8s
              console.warn(`🏭 Production issue detected, using extended backoff: ${backoffTime}ms`);
            }
            
            console.warn(`🔄 Retrying request (${attempt}/${maxRetries}) for ${path} in ${backoffTime}ms`);
            console.warn(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          } else {
            // Log final failure details for production
            if (isProduction) {
              console.error(`🏭 Production request failed after ${maxRetries} attempts: ${path}`, {
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

// Create a singleton instance with error handling
let apiClientInstance: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (!apiClientInstance) {
    try {
      apiClientInstance = new ApiClient();
    } catch (error) {
      console.error('Failed to initialize API client:', error);
      // Create a basic instance without Supabase if initialization fails
      apiClientInstance = new ApiClient();
    }
  }
  return apiClientInstance;
}

// Export a getter that creates the client lazily
// Only create if in browser to avoid SSR issues
let _apiClient: ApiClient | null = null;

export function getApiClientSafe(): ApiClient {
  if (typeof window === 'undefined') {
    // Return a dummy client for SSR that won't be used
    return {} as ApiClient;
  }

  if (!_apiClient) {
    _apiClient = getApiClient();
  }
  return _apiClient;
}

// Create a proxy that handles SSR gracefully
const createSafeApiClient = (): ApiClient => {
  if (typeof window === 'undefined') {
    // Return a proxy that provides stub methods during SSR
    return new Proxy({} as ApiClient, {
      get: (target, prop) => {
        // Return functions that do nothing during SSR
        if (typeof prop === 'string' && ['get', 'post', 'put', 'delete', 'uploadFile', 'getBaseUrl', 'getBaseURL'].includes(prop)) {
          return () => Promise.resolve({});
        }
        return undefined;
      }
    });
  }
  return getApiClient();
};

export const apiClient = createSafeApiClient();

// Also export as default for backward compatibility
export default apiClient;

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
// API request and response types

// Common API response structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    cursor?: string;
    hasMore?: boolean;
    total?: number;
  };
}

// Request body types for routes
export interface CloudinarySignatureBody {
  folder?: string;
  tags?: string[];
  context?: Record<string, string>;
}

export interface CloudinaryValidateBody {
  publicId: string;
}

// Webhook payload types
export interface WebhookPayload {
  type: string;
  eventId: string;
  createdAt: string;
  data: Record<string, unknown>;
}

export interface SquareWebhookPayload extends WebhookPayload {
  merchantId?: string;
  locationId?: string;
  entityId?: string;
}

// Service response types
export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}

// Payment service types
export interface PaymentDetails {
  amount: number;
  currency: string;
  status: string;
  method?: string;
  metadata?: Record<string, unknown>;
}

// Customer filter types
export interface CustomerSearchParams {
  email?: string;
  phone?: string;
  name?: string;
  limit?: number;
  cursor?: string;
}

// Booking filter types
export interface BookingSearchParams {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  status?: string;
  limit?: number;
  cursor?: string;
} 
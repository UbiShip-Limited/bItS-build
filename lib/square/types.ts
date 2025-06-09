import type { 
  SquareApiResponse,
  SquarePaymentResponse,
  SquareBookingResponse,
  SquareCustomerResponse,
  SquareCatalogResponse,
  SquareOrderResponse,
  SquareInvoiceResponse,
  SquareRefundResponse,
  PaymentLinkResponse
} from '../types/square';

// Re-export types from the main types file
export type {
  SquareApiResponse,
  SquarePaymentResponse,
  SquareBookingResponse,
  SquareCustomerResponse,
  SquareCatalogResponse,
  SquareOrderResponse,
  SquareInvoiceResponse,
  SquareRefundResponse,
  PaymentLinkResponse
};

// Type definitions for Square API structures
export interface SquareListResponse<T> {
  data?: T[];
  cursor?: string;
  errors?: Array<{ code?: string; detail?: string; category?: string }>;
}

export interface SquareAppointmentSegment {
  durationMinutes: number;
  teamMemberId: string;
  serviceVariationId: string;
}

export interface PaymentLinkRequestBody {
  idempotency_key: string;
  description?: string;
  quick_pay?: {
    name: string;
    price_money: {
      amount: number;
      currency: string;
    };
    location_id: string;
  };
  order?: {
    order_id: string;
  };
  checkout_options?: {
    allow_tipping?: boolean;
    custom_fields?: Array<{ title: string }>;
    redirect_url?: string;
    merchant_support_email?: string;
    ask_for_shipping_address?: boolean;
    accepted_payment_methods?: Record<string, boolean>;
  };
  pre_populated_data?: {
    buyer_email?: string;
    buyer_phone_number?: string;
    buyer_address?: Record<string, string>;
  };
  payment_note?: string;
}

export interface PaymentLinkUpdateRequestBody {
  payment_link: {
    version: number;
    description?: string;
    checkout_options?: {
      allow_tipping?: boolean;
      custom_fields?: Array<{ title: string }>;
      redirect_url?: string;
      merchant_support_email?: string;
      ask_for_shipping_address?: boolean;
      accepted_payment_methods?: Record<string, boolean>;
    };
    pre_populated_data?: {
      buyer_email?: string;
      buyer_phone_number?: string;
      buyer_address?: Record<string, string>;
    };
  };
}

export interface SquareConfig {
  accessToken: string;
  environment: string;
  applicationId: string;
  locationId: string;
} 
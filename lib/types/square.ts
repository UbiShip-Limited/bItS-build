// Square SDK type definitions and utilities
import { Square } from 'square';

// Re-export Square types for convenience
export type {
  Square,
} from 'square';

// Square API Response wrapper types
export interface SquareApiResponse<T> {
  result?: T;
  errors?: Square.Error_[];
  cursor?: string;
}

// Payment types
export type SquarePaymentResponse = SquareApiResponse<{
  payment?: Square.Payment;
  payments?: Square.Payment[];
}>;

// Booking types
export type SquareBookingResponse = SquareApiResponse<{
  booking?: Square.Booking;
  bookings?: Square.Booking[];
}>;

// Customer types
export type SquareCustomerResponse = SquareApiResponse<{
  customer?: Square.Customer;
  customers?: Square.Customer[];
}>;

// Catalog types
export type SquareCatalogResponse = SquareApiResponse<{
  objects?: Square.CatalogObject[];
  relatedObjects?: Square.CatalogObject[];
}>;

// Order types
export type SquareOrderResponse = SquareApiResponse<{
  order?: Square.Order;
  orders?: Square.Order[];
}>;

// Invoice types
export type SquareInvoiceResponse = SquareApiResponse<{
  invoice?: Square.Invoice;
  invoices?: Square.Invoice[];
}>;

// Refund types
export type SquareRefundResponse = SquareApiResponse<{
  refund?: Square.Refund;
  refunds?: Square.Refund[];
}>;

// Appointment segment type for bookings
export interface AppointmentSegment {
  durationMinutes: number;
  teamMemberId?: string;
  serviceVariationId?: string;
  anyTeamMember?: boolean;
  intermissionMinutes?: number;
  resourceIds?: string[];
}

// Refund request type
export interface RefundRequest {
  paymentId: string;
  idempotencyKey: string;
  amountMoney?: Square.Money;
  reason?: string;
}

// Invoice update parameters
export interface InvoiceUpdateParams {
  version: number;
  paymentRequests?: Square.InvoicePaymentRequest[];
  primaryRecipient?: Square.InvoiceRecipient;
  deliveryMethod?: Square.InvoiceDeliveryMethod;
  acceptedPaymentMethods?: Square.InvoiceAcceptedPaymentMethods;
  customFields?: Square.InvoiceCustomField[];
}

// Payment Link response
export interface PaymentLinkResponse extends SquareApiResponse<{
  payment_link?: {
    id: string;
    version: number;
    order_id: string;
    url: string;
    long_url?: string;
    created_at: string;
    updated_at?: string;
    description?: string;
    payment_note?: string;
    checkout_options?: {
      allow_tipping?: boolean;
      custom_fields?: Array<{ title: string }>;
      redirect_url?: string;
      merchant_support_email?: string;
      ask_for_shipping_address?: boolean;
      accepted_payment_methods?: {
        apple_pay?: boolean;
        google_pay?: boolean;
        cash_app_pay?: boolean;
        afterpay_clearpay?: boolean;
      };
    };
    pre_populated_data?: {
      buyer_email?: string;
      buyer_phone_number?: string;
      buyer_address?: any;
    };
  };
  payment_links?: Array<{
    id: string;
    version: number;
    order_id: string;
    url: string;
    long_url?: string;
    created_at: string;
    updated_at?: string;
  }>;
  related_resources?: {
    orders?: any[];
  };
}> {} 
// Square SDK type definitions and utilities
import { Square } from 'square';

// Re-export Square types for convenience
export type {
  Square,
} from 'square';

// Square API Response wrapper types
export interface SquareApiResponse<T> {
  result?: T;
  errors?: Square.Error[];
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
export interface PaymentLinkResponse {
  success: boolean;
  paymentUrl: string;
  order: Square.Order;
} 
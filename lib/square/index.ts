// Export the new modular SquareClient
export { SquareClient } from './client';
export { default } from './client';

// Export all types for external use
export * from './types';

// Export individual service classes for advanced use cases
export { BaseSquareClient } from './base-client';
export { PaymentsService } from './payments';
export { BookingsService } from './bookings';
export { CustomersService } from './customers';
export { CatalogService } from './catalog';
export { OrdersService } from './orders';
export { InvoicesService } from './invoices';
export { PaymentLinksService } from './payment-links';
  
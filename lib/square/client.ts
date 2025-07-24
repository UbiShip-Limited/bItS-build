import { BaseSquareClient } from './base-client';
import { PaymentsService } from './payments';
import { BookingsService } from './bookings';
import { CustomersService } from './customers';
import { CatalogService } from './catalog';
import { OrdersService } from './orders';
import { InvoicesService } from './invoices';
import { PaymentLinksService } from './payment-links';
import type { SquareConfig } from './types';

export class SquareClient extends BaseSquareClient {
  private payments: PaymentsService;
  private bookings: BookingsService;
  private customers: CustomersService;
  private catalog: CatalogService;
  private orders: OrdersService;
  private invoices: InvoicesService;
  private paymentLinks: PaymentLinksService;

  constructor(config: SquareConfig) {
    super(config);
    
    // Initialize all service modules with the same config
    this.payments = new PaymentsService(config);
    this.bookings = new BookingsService(config);
    this.customers = new CustomersService(config);
    this.catalog = new CatalogService(config);
    this.orders = new OrdersService(config);
    this.invoices = new InvoicesService(config);
    this.paymentLinks = new PaymentLinksService(config);
  }

  // Payment methods - delegate to payments service
  async getPayments(beginTime?: string, endTime?: string, cursor?: string, limit?: number) {
    return this.payments.getPayments(beginTime, endTime, cursor, limit);
  }

  async getPaymentById(paymentId: string) {
    return this.payments.getPaymentById(paymentId);
  }

  async createPayment(params: Parameters<PaymentsService['createPayment']>[0]) {
    return this.payments.createPayment(params);
  }

  async createRefund(params: Parameters<PaymentsService['createRefund']>[0]) {
    return this.payments.createRefund(params);
  }

  // Booking methods - delegate to bookings service
  async getBookings(cursor?: string, limit?: number, startAtMin?: string, startAtMax?: string) {
    return this.bookings.getBookings(cursor, limit, startAtMin, startAtMax);
  }

  async getBookingById(bookingId: string) {
    return this.bookings.getBookingById(bookingId);
  }

  async createBooking(params: Parameters<BookingsService['createBooking']>[0]) {
    return this.bookings.createBooking(params);
  }

  async updateBooking(params: Parameters<BookingsService['updateBooking']>[0]) {
    return this.bookings.updateBooking(params);
  }

  async cancelBooking(params: Parameters<BookingsService['cancelBooking']>[0]) {
    return this.bookings.cancelBooking(params);
  }

  // Customer methods - delegate to customers service
  async getCustomers(cursor?: string, limit?: number, sortField?: string, sortOrder?: string) {
    return this.customers.getCustomers(cursor, limit, sortField, sortOrder);
  }

  async getCustomerById(customerId: string) {
    return this.customers.getCustomerById(customerId);
  }

  async createCustomer(params: Parameters<CustomersService['createCustomer']>[0]) {
    return this.customers.createCustomer(params);
  }

  // Catalog methods - delegate to catalog service
  async getCatalog(types?: string[]) {
    return this.catalog.getCatalog(types);
  }

  async getTattooServices() {
    return this.catalog.getTattooServices();
  }

  // Order methods - delegate to orders service
  async createOrder(params: Parameters<OrdersService['createOrder']>[0]) {
    return this.orders.createOrder(params);
  }

  // Invoice methods - delegate to invoices service
  async createInvoice(params: Parameters<InvoicesService['createInvoice']>[0]) {
    return this.invoices.createInvoice(params);
  }

  async publishInvoice(params: Parameters<InvoicesService['publishInvoice']>[0]) {
    return this.invoices.publishInvoice(params);
  }

  async getInvoice(invoiceId: string) {
    return this.invoices.getInvoice(invoiceId);
  }

  async listInvoices(params?: Parameters<InvoicesService['listInvoices']>[0]) {
    return this.invoices.listInvoices(params);
  }

  async updateInvoice(params: Parameters<InvoicesService['updateInvoice']>[0]) {
    return this.invoices.updateInvoice(params);
  }

  async cancelInvoice(params: Parameters<InvoicesService['cancelInvoice']>[0]) {
    return this.invoices.cancelInvoice(params);
  }

  async sendInvoice(params: Parameters<InvoicesService['sendInvoice']>[0]) {
    return this.invoices.sendInvoice(params);
  }

  async deleteInvoice(invoiceId: string, version: number) {
    return this.invoices.deleteInvoice(invoiceId, version);
  }

  // Payment Link methods - delegate to payment links service
  async createPaymentLink(params: Parameters<PaymentLinksService['createPaymentLink']>[0]) {
    return this.paymentLinks.createPaymentLink(params);
  }

  async listPaymentLinks(params?: Parameters<PaymentLinksService['listPaymentLinks']>[0]) {
    return this.paymentLinks.listPaymentLinks(params);
  }

  async getPaymentLink(id: string) {
    return this.paymentLinks.getPaymentLink(id);
  }

  async updatePaymentLink(params: Parameters<PaymentLinksService['updatePaymentLink']>[0]) {
    return this.paymentLinks.updatePaymentLink(params);
  }

  async deletePaymentLink(id: string) {
    return this.paymentLinks.deletePaymentLink(id);
  }

  // Keep the static factory method
  static fromEnv(): SquareClient {
    const { 
      SQUARE_ACCESS_TOKEN,
      SQUARE_ENVIRONMENT = 'sandbox',
      SQUARE_APPLICATION_ID,
      SQUARE_LOCATION_ID
    } = process.env;

    if (!SQUARE_ACCESS_TOKEN) {
      throw new Error('SQUARE_ACCESS_TOKEN is required');
    }

    if (!SQUARE_APPLICATION_ID) {
      throw new Error('SQUARE_APPLICATION_ID is required');
    }

    if (!SQUARE_LOCATION_ID) {
      throw new Error('SQUARE_LOCATION_ID is required');
    }

    return new SquareClient({
      accessToken: SQUARE_ACCESS_TOKEN,
      environment: SQUARE_ENVIRONMENT,
      applicationId: SQUARE_APPLICATION_ID,
      locationId: SQUARE_LOCATION_ID
    });
  }
}

export default SquareClient; 
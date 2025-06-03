import { SquareClient as SquareSDKClient, SquareEnvironment, Square } from "square";
import type { 
  SquareApiResponse,
  SquarePaymentResponse,
  SquareBookingResponse,
  SquareCustomerResponse,
  SquareCatalogResponse,
  SquareOrderResponse,
  SquareInvoiceResponse,
  SquareRefundResponse,
  AppointmentSegment,
  RefundRequest,
  PaymentLinkResponse
} from '../types/square';

interface SquareConfig {
  accessToken: string;
  environment: string;
  applicationId: string;
  locationId: string;
}

class SquareClient {
  private client: SquareSDKClient;
  private locationId: string;

  constructor(config: SquareConfig) {
    this.client = new SquareSDKClient({
      token: config.accessToken,
      environment: config.environment === 'production' 
        ? SquareEnvironment.Production 
        : SquareEnvironment.Sandbox
    });
    
    this.locationId = config.locationId;
  }

  // Payment methods
  async getPayments(
    beginTime?: string, 
    endTime?: string, 
    cursor?: string, 
    limit?: number
  ): Promise<SquarePaymentResponse> {
    const response = await this.client.payments.list({
      beginTime,
      endTime,
      cursor,
      locationId: this.locationId,
      limit
    }) as any;
    
    return {
      result: {
        payments: response.data || []
      },
      cursor: response.cursor,
      errors: []
    };
  }

  async getPaymentById(paymentId: string): Promise<SquarePaymentResponse> {
    return this.client.payments.get({
      paymentId
    });
  }

  // Create a payment method
  async createPayment(params: {
    sourceId: string;
    amount: number;
    currency: string;
    customerId?: string;
    note?: string;
    idempotencyKey: string;
    referenceId?: string;
  }): Promise<SquarePaymentResponse> {
    const { sourceId, amount, currency, customerId, note, idempotencyKey, referenceId } = params;
    
    return this.client.payments.create({
      sourceId,
      idempotencyKey,
      amountMoney: {
        amount: BigInt(Math.round(amount * 100)),
        currency: currency as Square.Currency
      },
      customerId,
      note,
      referenceId,
      locationId: this.locationId
    });
  }

  // Create a refund for a payment
  async createRefund(params: {
    paymentId: string;
    idempotencyKey: string;
    amountMoney?: {
      amount: number;
      currency: string;
    };
    reason?: string;
  }): Promise<SquareRefundResponse> {
    const { paymentId, idempotencyKey, amountMoney, reason } = params;
    
    // Build the refund request - ensure proper typing
    const refundRequest: any = {
      paymentId,
      idempotencyKey,
      reason
    };
    
    // Only add amountMoney if it's provided
    if (amountMoney) {
      refundRequest.amountMoney = {
        amount: BigInt(Math.round(amountMoney.amount * 100)),
        currency: amountMoney.currency as Square.Currency
      };
    }
    
    // Direct refund API call
    return this.client.refunds.refundPayment(refundRequest);
  }

  // Bookings methods
  async getBookings(
    cursor?: string,
    limit?: number,
    startAtMin?: string,
    startAtMax?: string
  ): Promise<SquareBookingResponse> {
    const response = await this.client.bookings.list({
      cursor,
      limit,
      locationId: this.locationId,
      startAtMin,
      startAtMax
    }) as any;
    
    return {
      result: {
        bookings: response.data || []
      },
      cursor: response.cursor,
      errors: []
    };
  }

  async getBookingById(bookingId: string): Promise<SquareBookingResponse> {
    return this.client.bookings.get({
      bookingId
    });
  }

  // Create booking
  async createBooking(params: {
    startAt: string;
    locationId?: string;
    customerId: string;
    serviceId?: string;
    duration: number;
    idempotencyKey: string;
    staffId?: string;
    note?: string;
    bookingType?: string;
  }): Promise<SquareBookingResponse> {
    const locationId = params.locationId || this.locationId;
    
    // Add tattoo shop specific booking type to note if provided
    const bookingNote = params.bookingType 
      ? `${params.bookingType}${params.note ? ` - ${params.note}` : ''}`
      : params.note;
    
    // Build appointment segment - use Square's type directly
    const appointmentSegment: any = {
      durationMinutes: params.duration,
      teamMemberId: params.staffId || 'any',
      serviceVariationId: params.serviceId || 'any'
    };
    
    return this.client.bookings.create({
      idempotencyKey: params.idempotencyKey,
      booking: {
        startAt: params.startAt,
        locationId: locationId,
        customerId: params.customerId,
        appointmentSegments: [appointmentSegment],
        sellerNote: bookingNote
      }
    });
  }

  // Update booking - Square doesn't provide direct update API, so we need to 
  // cancel and recreate the booking
  async updateBooking(params: {
    bookingId: string;
    startAt?: string;
    customerId?: string;
    serviceId?: string;
    duration?: number;
    idempotencyKey: string;
    staffId?: string;
    note?: string;
    bookingType?: string;
  }): Promise<SquareBookingResponse> {
    // First, get existing booking details to preserve unchanged values
    const existingBookingResponse = await this.getBookingById(params.bookingId);
    const existingBooking = existingBookingResponse.result?.booking;
    
    if (!existingBooking) {
      throw new Error(`Booking with ID ${params.bookingId} not found`);
    }
    
    // Create a cancellation request
    const cancelResponse = await this.client.bookings.cancel({
      bookingId: params.bookingId,
      bookingVersion: existingBooking.version
    });
    
    // Check if cancel operation failed
    if (cancelResponse.errors && cancelResponse.errors.length > 0) {
      throw new Error(`Failed to cancel existing booking: ${cancelResponse.errors[0]?.detail || 'Unknown error'}`);
    }
    
    // Build appointment segment with proper typing
    const appointmentSegment = existingBooking.appointmentSegments?.[0] || {
      durationMinutes: 60,
      teamMemberId: 'any',
      serviceVariationId: 'any'
    };
    
    // Add tattoo shop specific booking type to note if provided
    const bookingNote = params.bookingType 
      ? `${params.bookingType}${params.note ? ` - ${params.note}` : ''}`
      : (params.note || existingBooking.sellerNote);
    
    // Build appointment segment with Square's expected structure
    const newAppointmentSegment: any = {
      durationMinutes: params.duration || appointmentSegment.durationMinutes || 60,
      teamMemberId: params.staffId || appointmentSegment.teamMemberId || 'any',
      serviceVariationId: params.serviceId || appointmentSegment.serviceVariationId || 'any'
    };
    
    // Create a new booking with updated information
    return this.client.bookings.create({
      idempotencyKey: params.idempotencyKey,
      booking: {
        startAt: params.startAt || existingBooking.startAt,
        locationId: existingBooking.locationId,
        customerId: params.customerId || existingBooking.customerId,
        appointmentSegments: [newAppointmentSegment],
        sellerNote: bookingNote
      }
    });
  }

  // Cancel booking in Square
  async cancelBooking(params: {
    bookingId: string;
    bookingVersion: number;
    idempotencyKey?: string;
  }): Promise<SquareBookingResponse> {
    return this.client.bookings.cancel({
      bookingId: params.bookingId,
      bookingVersion: params.bookingVersion,
      idempotencyKey: params.idempotencyKey
    });
  }

  // Get tattoo shop services from catalog
  async getTattooServices(): Promise<SquareCatalogResponse> {
    // Get catalog items filtered to service type
    const response = await this.client.catalog.list({
      types: "ITEM"
    }) as any;
    
    return {
      result: {
        objects: response.data || []
      },
      cursor: response.cursor,
      errors: []
    };
  }

  // Customer methods
  async getCustomers(
    cursor?: string,
    limit?: number,
    sortField?: string,
    sortOrder?: string
  ): Promise<SquareCustomerResponse> {
    const response = await this.client.customers.list({
      cursor,
      limit,
      sortField: sortField as Square.CustomerSortField,
      sortOrder: sortOrder as Square.SortOrder
    }) as any;
    
    return {
      result: {
        customers: response.data || []
      },
      cursor: response.cursor,
      errors: []
    };
  }

  // Create a customer method
  async createCustomer(params: {
    givenName?: string;
    familyName?: string;
    emailAddress?: string;
    phoneNumber?: string;
    idempotencyKey: string;
  }): Promise<SquareCustomerResponse> {
    return this.client.customers.create({
      givenName: params.givenName,
      familyName: params.familyName,
      emailAddress: params.emailAddress,
      phoneNumber: params.phoneNumber,
      idempotencyKey: params.idempotencyKey
    });
  }

  // Catalog methods - useful for services, items, etc.
  async getCatalog(types?: string[]): Promise<{ objects: Square.CatalogObject[] }> {
    const response = await this.client.catalog.list({
      types: types?.join(',')
    });
    return { objects: response.data || [] };
  }

  // Orders methods - proper way to handle order creation and checkout
  async createOrder(params: {
    locationId?: string;
    lineItems: Array<{
      name: string;
      quantity: string;
      basePriceMoney: {
        amount: number;
        currency: string;
      };
      note?: string;
    }>;
    customerId?: string;
    idempotencyKey: string;
    referenceId?: string;
  }): Promise<SquareOrderResponse> {
    const { locationId, lineItems, customerId, idempotencyKey, referenceId } = params;
    
    // Transform line items to match Square's format
    const transformedLineItems = lineItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      basePriceMoney: {
        amount: BigInt(Math.round(item.basePriceMoney.amount * 100)),
        currency: item.basePriceMoney.currency as Square.Currency
      },
      note: item.note
    }));
    
    return this.client.orders.create({
      idempotencyKey,
      order: {
        locationId: locationId || this.locationId,
        referenceId,
        customerId,
        lineItems: transformedLineItems
      }
    });
  }

  // Invoices API - proper implementation using Square SDK
  async createInvoice(params: {
    orderId: string;
    paymentRequests: Array<{
      requestType: 'BALANCE' | 'DEPOSIT' | 'INSTALLMENT';
      dueDate?: string;
      tippingEnabled?: boolean;
      automaticPaymentSource?: 'NONE' | 'CARD_ON_FILE' | 'BANK_ON_FILE';
      cardId?: string;
    }>;
    primaryRecipient: {
      customerId: string;
    };
    invoiceNumber?: string;
    title?: string;
    description?: string;
    deliveryMethod?: 'EMAIL' | 'SMS' | 'SHARE_MANUALLY';
    paymentConditions?: string;
    customFields?: Array<{
      label: string;
      value: string;
      placement: 'ABOVE_LINE_ITEMS' | 'BELOW_LINE_ITEMS';
    }>;
    acceptedPaymentMethods?: {
      card?: boolean;
      squareGiftCard?: boolean;
      bankAccount?: boolean;
      buyNowPayLater?: boolean;
      cashAppPay?: boolean;
    };
  }): Promise<SquareInvoiceResponse> {
    return this.client.invoices.create({
      invoice: {
        orderId: params.orderId,
        paymentRequests: params.paymentRequests.map(pr => ({
          requestType: pr.requestType,
          dueDate: pr.dueDate,
          tippingEnabled: pr.tippingEnabled,
          automaticPaymentSource: pr.automaticPaymentSource,
          cardId: pr.cardId
        })),
        primaryRecipient: params.primaryRecipient,
        invoiceNumber: params.invoiceNumber,
        title: params.title,
        description: params.description,
        deliveryMethod: params.deliveryMethod,
        paymentConditions: params.paymentConditions,
        customFields: params.customFields,
        acceptedPaymentMethods: params.acceptedPaymentMethods
      }
    });
  }

  // Publish invoice
  async publishInvoice(params: {
    invoiceId: string;
    version: number;
  }): Promise<SquareInvoiceResponse> {
    return this.client.invoices.publish({
      invoiceId: params.invoiceId,
      version: params.version
    });
  }

  // Get invoice
  async getInvoice(invoiceId: string): Promise<SquareInvoiceResponse> {
    return this.client.invoices.get({ invoiceId });
  }

  // List invoices
  async listInvoices(params?: {
    locationId?: string;
    cursor?: string;
    limit?: number;
  }): Promise<SquareInvoiceResponse> {
    const response = await this.client.invoices.list({
      locationId: params?.locationId || this.locationId,
      cursor: params?.cursor,
      limit: params?.limit
    }) as any;
    
    return {
      result: {
        invoices: response.data || []
      },
      cursor: response.cursor,
      errors: []
    };
  }

  // Update invoice
  async updateInvoice(params: {
    invoiceId: string;
    version: number;
    paymentRequests?: Array<Square.InvoicePaymentRequest>;
    primaryRecipient?: Square.InvoiceRecipient;
    deliveryMethod?: 'EMAIL' | 'SMS' | 'SHARE_MANUALLY';
    acceptedPaymentMethods?: Square.InvoiceAcceptedPaymentMethods;
    customFields?: Array<Square.InvoiceCustomField>;
  }): Promise<SquareInvoiceResponse> {
    return this.client.invoices.update({
      invoiceId: params.invoiceId,
      invoice: {
        version: params.version,
        paymentRequests: params.paymentRequests,
        primaryRecipient: params.primaryRecipient,
        deliveryMethod: params.deliveryMethod as Square.InvoiceDeliveryMethod,
        acceptedPaymentMethods: params.acceptedPaymentMethods,
        customFields: params.customFields
      }
    });
  }

  // Cancel invoice
  async cancelInvoice(params: {
    invoiceId: string;
    version: number;
  }): Promise<SquareInvoiceResponse> {
    return this.client.invoices.cancel({
      invoiceId: params.invoiceId,
      version: params.version
    });
  }

  // Payment Links - Using Square's Checkout API
  async createPaymentLink(params: {
    idempotencyKey: string;
    description?: string;
    quickPay?: {
      name: string;
      priceMoney: {
        amount: number;
        currency: string;
      };
      locationId?: string;
    };
    order?: {
      orderId: string;
    };
    checkoutOptions?: {
      allowTipping?: boolean;
      customFields?: Array<{
        title: string;
      }>;
      redirectUrl?: string;
      merchantSupportEmail?: string;
      askForShippingAddress?: boolean;
      acceptedPaymentMethods?: {
        applePay?: boolean;
        googlePay?: boolean;
        cashAppPay?: boolean;
        afterpayClearpay?: boolean;
      };
    };
    prePopulatedData?: {
      buyerEmail?: string;
      buyerPhoneNumber?: string;
      buyerAddress?: {
        addressLine1?: string;
        addressLine2?: string;
        locality?: string;
        administrativeDistrictLevel1?: string;
        postalCode?: string;
        country?: string;
        firstName?: string;
        lastName?: string;
      };
    };
    paymentNote?: string;
  }): Promise<PaymentLinkResponse> {
    const requestBody: any = {
      idempotency_key: params.idempotencyKey
    };

    if (params.description) {
      requestBody.description = params.description;
    }

    if (params.quickPay) {
      requestBody.quick_pay = {
        name: params.quickPay.name,
        price_money: {
          amount: Math.round(params.quickPay.priceMoney.amount * 100),
          currency: params.quickPay.priceMoney.currency
        },
        location_id: params.quickPay.locationId || this.locationId
      };
    }

    if (params.order) {
      requestBody.order = {
        order_id: params.order.orderId
      };
    }

    if (params.checkoutOptions) {
      requestBody.checkout_options = {
        allow_tipping: params.checkoutOptions.allowTipping,
        custom_fields: params.checkoutOptions.customFields,
        redirect_url: params.checkoutOptions.redirectUrl,
        merchant_support_email: params.checkoutOptions.merchantSupportEmail,
        ask_for_shipping_address: params.checkoutOptions.askForShippingAddress,
        accepted_payment_methods: params.checkoutOptions.acceptedPaymentMethods
      };
    }

    if (params.prePopulatedData) {
      requestBody.pre_populated_data = {
        buyer_email: params.prePopulatedData.buyerEmail,
        buyer_phone_number: params.prePopulatedData.buyerPhoneNumber,
        buyer_address: params.prePopulatedData.buyerAddress
      };
    }

    if (params.paymentNote) {
      requestBody.payment_note = params.paymentNote;
    }

    // Use the Square API directly since the SDK might not have this method yet
    const response = await fetch(
      `${this.getApiUrl()}/v2/online-checkout/payment-links`,
      {
        method: 'POST',
        headers: {
          'Square-Version': '2025-05-21',
          'Authorization': `Bearer ${this.getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Square API error: ${JSON.stringify(data)}`);
    }

    return {
      result: data,
      errors: []
    };
  }

  // List payment links
  async listPaymentLinks(params?: {
    cursor?: string;
    limit?: number;
  }): Promise<PaymentLinkResponse> {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(
      `${this.getApiUrl()}/v2/online-checkout/payment-links?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Square-Version': '2025-05-21',
          'Authorization': `Bearer ${this.getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Square API error: ${JSON.stringify(data)}`);
    }

    return {
      result: data,
      errors: []
    };
  }

  // Get payment link
  async getPaymentLink(id: string): Promise<PaymentLinkResponse> {
    const response = await fetch(
      `${this.getApiUrl()}/v2/online-checkout/payment-links/${id}`,
      {
        method: 'GET',
        headers: {
          'Square-Version': '2025-05-21',
          'Authorization': `Bearer ${this.getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Square API error: ${JSON.stringify(data)}`);
    }

    return {
      result: data,
      errors: []
    };
  }

  // Update payment link
  async updatePaymentLink(params: {
    id: string;
    paymentLink: {
      version: number;
      description?: string;
      checkoutOptions?: {
        allowTipping?: boolean;
        customFields?: Array<{
          title: string;
        }>;
        redirectUrl?: string;
        merchantSupportEmail?: string;
        askForShippingAddress?: boolean;
        acceptedPaymentMethods?: {
          applePay?: boolean;
          googlePay?: boolean;
          cashAppPay?: boolean;
          afterpayClearpay?: boolean;
        };
      };
      prePopulatedData?: {
        buyerEmail?: string;
        buyerPhoneNumber?: string;
        buyerAddress?: {
          addressLine1?: string;
          addressLine2?: string;
          locality?: string;
          administrativeDistrictLevel1?: string;
          postalCode?: string;
          country?: string;
          firstName?: string;
          lastName?: string;
        };
      };
    };
  }): Promise<PaymentLinkResponse> {
    const requestBody: any = {
      payment_link: {
        version: params.paymentLink.version
      }
    };

    if (params.paymentLink.description !== undefined) {
      requestBody.payment_link.description = params.paymentLink.description;
    }

    if (params.paymentLink.checkoutOptions) {
      requestBody.payment_link.checkout_options = {
        allow_tipping: params.paymentLink.checkoutOptions.allowTipping,
        custom_fields: params.paymentLink.checkoutOptions.customFields,
        redirect_url: params.paymentLink.checkoutOptions.redirectUrl,
        merchant_support_email: params.paymentLink.checkoutOptions.merchantSupportEmail,
        ask_for_shipping_address: params.paymentLink.checkoutOptions.askForShippingAddress,
        accepted_payment_methods: params.paymentLink.checkoutOptions.acceptedPaymentMethods
      };
    }

    if (params.paymentLink.prePopulatedData) {
      requestBody.payment_link.pre_populated_data = {
        buyer_email: params.paymentLink.prePopulatedData.buyerEmail,
        buyer_phone_number: params.paymentLink.prePopulatedData.buyerPhoneNumber,
        buyer_address: params.paymentLink.prePopulatedData.buyerAddress
      };
    }

    const response = await fetch(
      `${this.getApiUrl()}/v2/online-checkout/payment-links/${params.id}`,
      {
        method: 'PUT',
        headers: {
          'Square-Version': '2025-05-21',
          'Authorization': `Bearer ${this.getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Square API error: ${JSON.stringify(data)}`);
    }

    return {
      result: data,
      errors: []
    };
  }

  // Delete payment link
  async deletePaymentLink(id: string): Promise<SquareApiResponse<Record<string, never>>> {
    const response = await fetch(
      `${this.getApiUrl()}/v2/online-checkout/payment-links/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Square-Version': '2025-05-21',
          'Authorization': `Bearer ${this.getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Square API error: ${JSON.stringify(data)}`);
    }

    return {
      result: {},
      errors: []
    };
  }

  // Send invoice
  async sendInvoice(params: {
    invoiceId: string;
    requestMethod?: 'EMAIL' | 'SMS' | 'SHARE_MANUALLY';
  }): Promise<SquareInvoiceResponse> {
    // Square SDK v35+ uses a different approach for sending invoices
    // First, we need to publish the invoice if it's not already published
    const invoice = await this.getInvoice(params.invoiceId);
    
    if (invoice.result?.invoice?.status === 'DRAFT') {
      // Publish the invoice first
      await this.publishInvoice({
        invoiceId: params.invoiceId,
        version: invoice.result.invoice.version || 0
      });
    }
    
    // Return the updated invoice with the public URL
    return this.getInvoice(params.invoiceId);
  }

  // Delete invoice
  async deleteInvoice(invoiceId: string, version: number): Promise<SquareApiResponse<Record<string, never>>> {
    return this.client.invoices.delete({
      invoiceId,
      version
    });
  }

  // Helper methods for API access
  private getApiUrl(): string {
    const env = (this.client as any).config.environment;
    return env === SquareEnvironment.Production 
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';
  }

  private getAccessToken(): string {
    // Access the token from the client configuration
    return (this.client as any).config.accessToken;
  }

  // Helper to initialize from environment variables
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
  
import { SquareClient as SquareSDKClient, SquareEnvironment, Square } from "square";

// Use a proper type for SquareResponse
type SquareResponse = any; // Can be refined based on Square's types

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
  ): Promise<SquareResponse> {
    return this.client.payments.list({
      beginTime,
      endTime,
      cursor,
      locationId: this.locationId,
      limit
    });
  }

  async getPaymentById(paymentId: string): Promise<SquareResponse> {
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
  }): Promise<SquareResponse> {
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
  }): Promise<SquareResponse> {
    const { paymentId, idempotencyKey, amountMoney, reason } = params;
    
    // Build the refund request
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
  ): Promise<SquareResponse> {
    return this.client.bookings.list({
      cursor,
      limit,
      locationId: this.locationId,
      startAtMin,
      startAtMax
    });
  }

  async getBookingById(bookingId: string): Promise<SquareResponse> {
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
  }): Promise<SquareResponse> {
    const locationId = params.locationId || this.locationId;
    
    // Add tattoo shop specific booking type to note if provided
    const bookingNote = params.bookingType 
      ? `${params.bookingType}${params.note ? ` - ${params.note}` : ''}`
      : params.note;
    
    // Build appointment segment with only defined values
    const appointmentSegment: any = {
      durationMinutes: params.duration
    };
    
    if (params.staffId) {
      appointmentSegment.teamMemberId = params.staffId;
    }
    
    if (params.serviceId) {
      appointmentSegment.serviceVariationId = params.serviceId;
    }
    
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
  }): Promise<SquareResponse> {
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
    
    // Prepare data for the new booking, using existing data for any missing fields
    const appointmentSegment = existingBooking.appointmentSegments?.[0] || {};
    
    // Add tattoo shop specific booking type to note if provided
    const bookingNote = params.bookingType 
      ? `${params.bookingType}${params.note ? ` - ${params.note}` : ''}`
      : (params.note || existingBooking.sellerNote);
    
    // Build appointment segment with only defined values
    const newAppointmentSegment: any = {
      durationMinutes: params.duration || appointmentSegment.durationMinutes
    };
    
    const teamMemberId = params.staffId || appointmentSegment.teamMemberId;
    if (teamMemberId) {
      newAppointmentSegment.teamMemberId = teamMemberId;
    }
    
    const serviceVariationId = params.serviceId || appointmentSegment.serviceVariationId;
    if (serviceVariationId) {
      newAppointmentSegment.serviceVariationId = serviceVariationId;
    }
    
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
  }): Promise<SquareResponse> {
    return this.client.bookings.cancel({
      bookingId: params.bookingId,
      bookingVersion: params.bookingVersion,
      idempotencyKey: params.idempotencyKey
    });
  }

  // Get tattoo shop services from catalog
  async getTattooServices(): Promise<SquareResponse> {
    // Get catalog items filtered to service type
    return this.client.catalog.list({
      types: "ITEM"
    });
  }

  // Customer methods
  async getCustomers(
    cursor?: string,
    limit?: number,
    sortField?: string,
    sortOrder?: string
  ): Promise<SquareResponse> {
    return this.client.customers.list({
      cursor,
      limit,
      sortField: sortField as Square.CustomerSortField,
      sortOrder: sortOrder as Square.SortOrder
    });
  }

  // Create a customer method
  async createCustomer(params: {
    givenName?: string;
    familyName?: string;
    emailAddress?: string;
    phoneNumber?: string;
    idempotencyKey: string;
  }): Promise<SquareResponse> {
    return this.client.customers.create({
      givenName: params.givenName,
      familyName: params.familyName,
      emailAddress: params.emailAddress,
      phoneNumber: params.phoneNumber,
      idempotencyKey: params.idempotencyKey
    });
  }

  // Catalog methods - useful for services, items, etc.
  async getCatalog(types?: string[]): Promise<{ objects: SquareResponse[] }> {
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
  }): Promise<SquareResponse> {
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
  }): Promise<SquareResponse> {
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
  }): Promise<SquareResponse> {
    return this.client.invoices.publish({
      invoiceId: params.invoiceId,
      version: params.version
    });
  }

  // Get invoice
  async getInvoice(invoiceId: string): Promise<SquareResponse> {
    return this.client.invoices.get({ invoiceId });
  }

  // List invoices
  async listInvoices(params?: {
    locationId?: string;
    cursor?: string;
    limit?: number;
  }): Promise<SquareResponse> {
    return this.client.invoices.list({
      locationId: params?.locationId || this.locationId,
      cursor: params?.cursor,
      limit: params?.limit
    });
  }

  // Update invoice
  async updateInvoice(params: {
    invoiceId: string;
    version: number;
    paymentRequests?: Array<any>;
    primaryRecipient?: any;
    deliveryMethod?: 'EMAIL' | 'SMS' | 'SHARE_MANUALLY';
    acceptedPaymentMethods?: any;
    customFields?: Array<any>;
  }): Promise<SquareResponse> {
    return this.client.invoices.update({
      invoiceId: params.invoiceId,
      invoice: {
        version: params.version,
        paymentRequests: params.paymentRequests,
        primaryRecipient: params.primaryRecipient,
        deliveryMethod: params.deliveryMethod as any,
        acceptedPaymentMethods: params.acceptedPaymentMethods,
        customFields: params.customFields
      }
    });
  }

  // Cancel invoice
  async cancelInvoice(params: {
    invoiceId: string;
    version: number;
  }): Promise<SquareResponse> {
    return this.client.invoices.cancel({
      invoiceId: params.invoiceId,
      version: params.version
    });
  }

  // Payment Links - using Orders API + external URLs (Square doesn't have direct payment link API)
  async createPaymentLink(params: {
    orderId: string;
    checkoutOptions?: {
      allowTipping?: boolean;
      redirectUrl?: string;
      merchantSupportEmail?: string;
    };
  }): Promise<{ success: boolean; paymentUrl: string; order: any }> {
    // For payment links, we would typically:
    // 1. Create/update an order
    // 2. Generate a checkout URL using Square's online checkout
    // 3. Return the URL for the customer
    
    // This is a simplified implementation - in practice you'd integrate with
    // Square's online checkout or use a third-party solution
    throw new Error('Payment Links require Square Online Checkout integration - implement based on your specific needs');
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
  
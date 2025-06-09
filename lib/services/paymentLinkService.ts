import { v4 as uuidv4 } from 'uuid';
import SquareClient from '../square/index';
import { prisma } from '../prisma/prisma';
import { PrismaClient } from '@prisma/client';
import { PaymentType } from './paymentService';
import type { Square } from 'square';
import type {
  SquareApiResponse,
} from '../types/square';

export interface PaymentLinkParams {
  amount: number;
  title: string;
  description?: string;
  customerId: string;
  appointmentId?: string;
  tattooRequestId?: string;
  paymentType: PaymentType;
  redirectUrl?: string;
  allowTipping?: boolean;
  customFields?: Array<{ title: string }>;
}

export interface InvoiceParams {
  customerId: string;
  appointmentId?: string;
  tattooRequestId?: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
  paymentSchedule?: Array<{
    amount: number;
    dueDate: string;
    type: 'DEPOSIT' | 'BALANCE';
  }>;
  deliveryMethod?: 'EMAIL' | 'SMS' | 'SHARE_MANUALLY';
}

export default class PaymentLinkService {
  private squareClient: ReturnType<typeof SquareClient.fromEnv>;
  private prisma: PrismaClient;
  
  constructor(prismaClient?: PrismaClient, squareClient?: ReturnType<typeof SquareClient.fromEnv>) {
    this.squareClient = squareClient || SquareClient.fromEnv();
    this.prisma = prismaClient || prisma;
  }
  
  /**
   * Create a Square Checkout Link for secure online payments
   * This uses Square's Checkout API to create a payment link
   */
  async createPaymentLink(params: PaymentLinkParams): Promise<{
    success: boolean;
    paymentLink: Square.PaymentLink;
    url: string;
  }> {
    const { 
      amount, 
      title, 
      description, 
      customerId, 
      appointmentId,
      tattooRequestId,
      paymentType,
      redirectUrl,
      allowTipping = true,
    } = params;
    
    try {
      // Get customer details
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId }
      });
      
      if (!customer) {
        throw new Error(`Customer ${customerId} not found`);
      }
      
      // Generate idempotency key
      const idempotencyKey = uuidv4();
      
      // Create payment link using Square's Checkout API
      const response = await this.squareClient.createPaymentLink({
        idempotencyKey,
        description: description || `Payment for ${paymentType}`,
        quickPay: {
          name: title,
          priceMoney: {
            amount: amount, // Will be converted to cents in the Square client
            currency: 'CAD'
          }
        },
        checkoutOptions: {
          allowTipping,
          redirectUrl: redirectUrl || `${process.env.APP_URL}/payment/success`,
          merchantSupportEmail: process.env.MERCHANT_SUPPORT_EMAIL
        },
        prePopulatedData: {
          buyerEmail: customer.email || undefined,
          buyerPhoneNumber: customer.phone || undefined
        },
        paymentNote: `${paymentType} - ${appointmentId || tattooRequestId || 'Direct payment'}`
      });
      
      const paymentLink = response.result?.payment_link;
      if (!paymentLink) {
        throw new Error('Failed to create payment link');
      }
      
      // Store the payment link details in our database
      await (this.prisma as any).paymentLink.create({
        data: {
          id: paymentLink.id,
          squareOrderId: paymentLink.order_id,
          customerId,
          appointmentId,
          amount,
          status: 'active',
          url: paymentLink.url,
          metadata: {
            paymentType,
            tattooRequestId,
            squarePaymentLink: paymentLink
          }
        }
      });
      
      // Store audit log
      await this.prisma.auditLog.create({
        data: {
          action: 'payment_link_created',
          resource: 'payment_link',
          resourceId: paymentLink.id,
          details: {
            paymentType,
            amount,
            customerId,
            appointmentId,
            tattooRequestId,
            url: paymentLink.url,
            squareOrderId: paymentLink.order_id
          }
        }
      });
      
      return {
        success: true,
        paymentLink,
        url: paymentLink.url
      };
    } catch (error) {
      console.error('Error creating payment link:', error);
      
      await this.prisma.auditLog.create({
        data: {
          action: 'payment_link_failed',
          resource: 'payment_link',
          details: {
            paymentType,
            amount,
            customerId,
            error: error.message
          }
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Create a Square Invoice for payment scheduling (deposits + final payments)
   */
  async createInvoice(params: InvoiceParams): Promise<{
    success: boolean;
    invoice: Square.Invoice;
    publicUrl?: string;
  }> {
    const {
      customerId,
      appointmentId,
      tattooRequestId,
      items,
      paymentSchedule,
      deliveryMethod = 'EMAIL'
    } = params;
    
    try {
      // Get customer details
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId }
      });
      
      if (!customer || !customer.squareId) {
        throw new Error(`Customer ${customerId} not found or missing Square ID`);
      }
      
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;
      const idempotencyKey = uuidv4();
      
      // First, create an order for the invoice
      const orderResponse = await this.squareClient.createOrder({
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems: items.map((item, index) => ({
          name: item.description,
          quantity: '1',
          basePriceMoney: {
            amount: item.amount,
            currency: 'CAD'
          },
          note: `Line item ${index + 1}`
        })),
        customerId: customer.squareId,
        idempotencyKey,
        referenceId: appointmentId || tattooRequestId || uuidv4()
      });
      
      const order = orderResponse.result?.order;
      if (!order || !order.id) {
        throw new Error('Failed to create order for invoice');
      }
      
      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
      
      // Build payment requests based on schedule or single payment
      let paymentRequests: Array<{
        requestType: 'BALANCE' | 'DEPOSIT' | 'INSTALLMENT';
        dueDate?: string;
        tippingEnabled?: boolean;
        fixedAmountRequestedMoney?: {
          amount: bigint;
          currency: Square.Currency;
        };
      }>;
      
      if (paymentSchedule && paymentSchedule.length > 0) {
        paymentRequests = paymentSchedule.map(schedule => ({
          requestType: schedule.type as 'BALANCE' | 'DEPOSIT',
          dueDate: schedule.dueDate,
          fixedAmountRequestedMoney: {
            amount: BigInt(Math.round(schedule.amount * 100)),
            currency: 'CAD' as Square.Currency
          },
          tippingEnabled: schedule.type === 'BALANCE'
        }));
      } else {
        // Single payment for full amount
        paymentRequests = [{
          requestType: 'BALANCE' as const,
          tippingEnabled: true
        }];
      }
      
      // Create invoice with Square
      const invoiceResponse = await this.squareClient.createInvoice({
        orderId: order.id,
        invoiceNumber,
        title: 'Bowen Island Tattoo Shop',
        description: items.map(item => item.description).join('\n'),
        deliveryMethod,
        paymentRequests,
        acceptedPaymentMethods: {
          card: true,
          squareGiftCard: true,
          bankAccount: true,
          buyNowPayLater: true
        },
        primaryRecipient: {
          customerId: customer.squareId
        }
      });
      
      const invoice = invoiceResponse.result?.invoice;
      if (!invoice) {
        throw new Error('Failed to create invoice');
      }
      
      // Send the invoice if not manual delivery
      let publicUrl = invoice.publicUrl;
      if (deliveryMethod !== 'SHARE_MANUALLY' && invoice.id) {
        const sendResponse = await this.squareClient.sendInvoice({
          invoiceId: invoice.id,
          requestMethod: deliveryMethod
        });
        
        if (sendResponse.result?.invoice?.publicUrl) {
          publicUrl = sendResponse.result.invoice.publicUrl;
        }
      }
      
      // Store invoice reference in database
      await this.prisma.invoice.create({
        data: {
          appointmentId,
          amount: totalAmount,
          status: 'pending',
          description: items.map(item => item.description).join(', '),
        }
      });
      
      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          action: 'invoice_created',
          resource: 'invoice',
          resourceId: invoice.id || '',
          details: {
            customerId,
            appointmentId,
            tattooRequestId,
            totalAmount,
            paymentSchedule,
            squareInvoiceId: invoice.id,
            squareOrderId: order.id,
            publicUrl
          }
        }
      });
      
      return {
        success: true,
        invoice,
        publicUrl
      };
    } catch (error) {
      console.error('Error creating invoice:', error);
      
      await this.prisma.auditLog.create({
        data: {
          action: 'invoice_failed',
          resource: 'invoice',
          details: {
            customerId,
            error: error.message
          }
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Create a checkout session for more complex payment scenarios
   * This creates a Square order and returns a checkout URL
   */
  async createCheckoutSession(params: {
    customerId: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      note?: string;
    }>;
    redirectUrl?: string;
    appointmentId?: string;
  }): Promise<{
    success: boolean;
    checkoutUrl: string;
    checkoutId: string;
  }> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: params.customerId }
      });
      
      if (!customer || !customer.squareId) {
        throw new Error(`Customer ${params.customerId} not found or missing Square ID`);
      }
      
      const idempotencyKey = uuidv4();
      const referenceId = params.appointmentId || uuidv4();
      
      // Create order with Square
      const orderResponse = await this.squareClient.createOrder({
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems: params.items.map(item => ({
          name: item.name,
          quantity: item.quantity.toString(),
          basePriceMoney: {
            amount: item.price,
            currency: 'CAD'
          },
          note: item.note
        })),
        customerId: customer.squareId,
        idempotencyKey,
        referenceId
      });
      
      const order = orderResponse.result?.order;
      if (!order) {
        throw new Error('Failed to create order');
      }
      
      // Create checkout session
      const checkoutId = uuidv4();
      const checkoutUrl = `${process.env.APP_URL}/checkout/${checkoutId}`;
      
      // Store checkout session details
      await (this.prisma as any).checkoutSession.create({
        data: {
          id: checkoutId,
          squareOrderId: order.id,
          customerId: params.customerId,
          appointmentId: params.appointmentId,
          status: 'pending',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          metadata: {
            redirectUrl: params.redirectUrl,
            items: params.items
          }
        }
      });
      
      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          action: 'checkout_created',
          resource: 'checkout',
          resourceId: checkoutId,
          details: {
            customerId: params.customerId,
            appointmentId: params.appointmentId,
            checkoutUrl,
            squareOrderId: order.id,
            items: params.items
          }
        }
      });
      
      return {
        success: true,
        checkoutUrl,
        checkoutId
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }
  
  /**
   * List all payment links
   */
  async listPaymentLinks(params?: {
    cursor?: string;
    limit?: number;
  }): Promise<{ result: { paymentLinks: any[]; cursor?: string } }> {
    try {
      const paymentLinks = await (this.prisma as any).paymentLink.findMany({
        take: params?.limit || 20,
        cursor: params?.cursor ? { id: params.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true
        }
      });
      
      return {
        result: {
          paymentLinks: paymentLinks.map(link => ({
            id: link.id,
            url: link.url,
            createdAt: link.createdAt,
            updatedAt: link.updatedAt,
            version: 1,
            orderId: link.squareOrderId,
            checkoutOptions: {
              redirectUrl: link.metadata?.redirectUrl
            }
          })),
          cursor: paymentLinks.length > 0 ? paymentLinks[paymentLinks.length - 1].id : undefined
        }
      };
    } catch (error) {
      console.error('Error listing payment links:', error);
      throw error;
    }
  }
  
  /**
   * Get payment link details
   */
  async getPaymentLink(id: string): Promise<{ result: { paymentLink: any } }> {
    try {
      const paymentLink = await (this.prisma as any).paymentLink.findUnique({
        where: { id },
        include: {
          customer: true
        }
      });
      
      if (!paymentLink) {
        throw new Error(`Payment link ${id} not found`);
      }
      
      return {
        result: {
          paymentLink: {
            id: paymentLink.id,
            url: paymentLink.url,
            createdAt: paymentLink.createdAt,
            updatedAt: paymentLink.updatedAt,
            version: 1,
            orderId: paymentLink.squareOrderId,
            checkoutOptions: {
              redirectUrl: paymentLink.metadata?.redirectUrl
            }
          }
        }
      };
    } catch (error) {
      console.error('Error getting payment link:', error);
      throw error;
    }
  }
  
  /**
   * Delete a payment link
   */
  async deletePaymentLink(id: string): Promise<SquareApiResponse<Record<string, never>>> {
    try {
      const paymentLink = await (this.prisma as any).paymentLink.update({
        where: { id },
        data: { 
          status: 'cancelled',
          deletedAt: new Date()
        }
      });
      
      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          action: 'payment_link_deleted',
          resource: 'payment_link',
          resourceId: id,
          details: { deletedAt: new Date() }
        }
      });
      
      return {
        result: {},
        errors: []
      };
    } catch (error) {
      console.error('Error deleting payment link:', error);
      throw error;
    }
  }
} 
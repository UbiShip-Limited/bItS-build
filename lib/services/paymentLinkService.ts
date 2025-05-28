import { v4 as uuidv4 } from 'uuid';
import SquareClient from '../square/index.js';
import { prisma } from '../prisma/prisma.js';
import { PrismaClient } from '@prisma/client';
import { PaymentType } from './paymentService.js';

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
  
  constructor(prismaClient?: PrismaClient, squareClient?: any) {
    this.squareClient = squareClient || SquareClient.fromEnv();
    this.prisma = prismaClient || prisma;
  }
  
  /**
   * Create a Square Payment Link for secure online payments
   */
  async createPaymentLink(params: PaymentLinkParams): Promise<{
    success: boolean;
    paymentLink: any;
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
      customFields = []
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
      
      // Create payment link with Square
      const response = await this.squareClient.createPaymentLink({
        idempotencyKey,
        quickPay: {
          name: title,
          priceMoney: {
            amount,
            currency: 'CAD'
          }
        },
        checkoutOptions: {
          allowTipping,
          customFields,
          redirectUrl,
          merchantSupportEmail: process.env.MERCHANT_SUPPORT_EMAIL
        },
        prePopulatedData: {
          buyerEmail: customer.email || undefined,
          buyerPhoneNumber: customer.phone || undefined
        },
        paymentNote: description || `Payment for ${paymentType}`
      });
      
      const paymentLink = response.result.paymentLink;
      
      // Store payment link reference in database
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
            url: paymentLink.url
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
    invoice: any;
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
      
      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
      
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;
      const idempotencyKey = uuidv4();
      
      // Build payment requests based on schedule or single payment
      let paymentRequests;
      if (paymentSchedule && paymentSchedule.length > 0) {
        paymentRequests = paymentSchedule.map(schedule => ({
          requestMethod: deliveryMethod,
          requestType: schedule.type,
          dueDate: schedule.dueDate,
          fixedAmountRequestedMoney: {
            amount: schedule.amount,
            currency: 'CAD'
          },
          tippingEnabled: schedule.type === 'BALANCE'
        }));
      } else {
        // Single payment for full amount
        paymentRequests = [{
          requestMethod: deliveryMethod,
          requestType: 'BALANCE' as const,
          tippingEnabled: true
        }];
      }
      
      // Create invoice with Square
      const response = await this.squareClient.createInvoice({
        invoice: {
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
        },
        idempotencyKey
      });
      
      const invoice = response.result.invoice;
      
      // Send the invoice
      if (deliveryMethod !== 'SHARE_MANUALLY') {
        await this.squareClient.sendInvoice({
          invoiceId: invoice.id,
          requestMethod: deliveryMethod
        });
      }
      
      // Store invoice reference in database
      await this.prisma.invoice.create({
        data: {
          appointmentId,
          amount: totalAmount,
          status: 'pending',
          description: items.map(item => item.description).join(', ')
        }
      });
      
      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          action: 'invoice_created',
          resource: 'invoice',
          resourceId: invoice.id,
          details: {
            customerId,
            appointmentId,
            tattooRequestId,
            totalAmount,
            paymentSchedule,
            squareInvoiceId: invoice.id,
            publicUrl: invoice.publicUrl
          }
        }
      });
      
      return {
        success: true,
        invoice,
        publicUrl: invoice.publicUrl
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
      
      const response = await this.squareClient.createCheckout({
        idempotencyKey,
        order: {
          referenceId,
          customerId: customer.squareId,
          lineItems: params.items.map(item => ({
            name: item.name,
            quantity: item.quantity.toString(),
            basePriceMoney: {
              amount: item.price,
              currency: 'CAD'
            },
            note: item.note
          }))
        },
        askForShippingAddress: false,
        merchantSupportEmail: process.env.MERCHANT_SUPPORT_EMAIL,
        prePopulateBuyerEmail: customer.email || undefined,
        redirectUrl: params.redirectUrl
      });
      
      const checkout = response.result.checkout;
      
      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          action: 'checkout_created',
          resource: 'checkout',
          resourceId: checkout.id,
          details: {
            customerId: params.customerId,
            appointmentId: params.appointmentId,
            checkoutUrl: checkout.checkoutPageUrl,
            items: params.items
          }
        }
      });
      
      return {
        success: true,
        checkoutUrl: checkout.checkoutPageUrl,
        checkoutId: checkout.id
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
  }): Promise<any> {
    return this.squareClient.listPaymentLinks(params);
  }
  
  /**
   * Get payment link details
   */
  async getPaymentLink(id: string): Promise<any> {
    return this.squareClient.getPaymentLink(id);
  }
  
  /**
   * Delete a payment link
   */
  async deletePaymentLink(id: string): Promise<any> {
    const response = await this.squareClient.deletePaymentLink(id);
    
    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'payment_link_deleted',
        resource: 'payment_link',
        resourceId: id,
        details: { deletedAt: new Date() }
      }
    });
    
    return response;
  }
} 
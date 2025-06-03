import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-square-hmacsha256-signature');
    const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

    if (!webhookSignatureKey) {
      console.error('Square webhook signature key not configured');
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      );
    }

    if (!signature) {
      console.warn('Missing Square webhook signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Calculate expected signature
    const hmac = crypto.createHmac('sha256', webhookSignatureKey);
    hmac.update(body);
    const expectedSignature = hmac.digest('base64');

    if (signature !== expectedSignature) {
      console.warn('Invalid Square webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);

    // Handle different event types
    switch (event.type) {
      case 'payment.created':
      case 'payment.updated':
        await handlePaymentEvent(event.data);
        break;

      case 'invoice.payment_made':
        await handleInvoicePayment(event.data);
        break;

      case 'checkout.created':
      case 'checkout.updated':
        await handleCheckoutEvent(event.data);
        break;

      default:
        console.info(`Unhandled Square webhook event type: ${event.type}`);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing Square webhook:', error);
    // Still return 200 to prevent retries for processing errors
    return NextResponse.json({ 
      received: true, 
      error: 'Processing error' 
    });
  }
}

async function handlePaymentEvent(data: any) {
  const payment = data.object.payment;
  
  try {
    // Check if payment has a reference ID (links to our system)
    if (payment.referenceId) {
      // Update payment status in our database
      const existingPayment = await prisma.payment.findFirst({
        where: { 
          OR: [
            { referenceId: payment.referenceId },
            { squareId: payment.id }
          ]
        }
      });

      if (existingPayment) {
        // Update existing payment
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: payment.status?.toLowerCase() || 'unknown',
            paymentDetails: payment,
            updatedAt: new Date()
          }
        });
      } else if (payment.status === 'COMPLETED') {
        // Create new payment record for completed payments
        await prisma.payment.create({
          data: {
            amount: payment.amountMoney ? Number(payment.amountMoney.amount) / 100 : 0,
            status: payment.status?.toLowerCase() || 'completed',
            paymentMethod: payment.sourceType || 'unknown',
            squareId: payment.id || '',
            referenceId: payment.referenceId,
            paymentDetails: payment
          }
        });
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'payment_webhook_received',
          resource: 'payment',
          resourceId: payment.id || '',
          details: {
            status: payment.status,
            amount: payment.amountMoney ? Number(payment.amountMoney.amount) / 100 : 0,
            referenceId: payment.referenceId
          }
        }
      });
    }
  } catch (error) {
    console.error('Error handling payment event:', error);
    throw error;
  }
}

async function handleInvoicePayment(data: any) {
  const invoice = data.object.invoice;
  
  try {
    // Update invoice status in our database
    const existingInvoice = await prisma.invoice.findFirst({
      where: { 
        description: {
          contains: invoice.invoiceNumber || ''
        }
      }
    });

    if (existingInvoice) {
      await prisma.invoice.update({
        where: { id: existingInvoice.id },
        data: {
          status: 'paid',
          updatedAt: new Date()
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'invoice_paid',
          resource: 'invoice',
          resourceId: existingInvoice.id,
          details: {
            squareInvoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            paidAt: new Date()
          }
        }
      });
    }
  } catch (error) {
    console.error('Error handling invoice payment:', error);
    throw error;
  }
}

async function handleCheckoutEvent(data: any) {
  const checkout = data.object.checkout;
  
  try {
    // Log checkout events for tracking
    await prisma.auditLog.create({
      data: {
        action: 'checkout_webhook_received',
        resource: 'checkout',
        resourceId: checkout.id,
        details: {
          status: checkout.status,
          orderReferenceId: checkout.order?.reference_id
        }
      }
    });
  } catch (error) {
    console.error('Error handling checkout event:', error);
    throw error;
  }
}

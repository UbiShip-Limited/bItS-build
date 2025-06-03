import { NextRequest, NextResponse } from 'next/server';
// TODO: Set up proper Next.js authentication (NextAuth or similar)
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
import PaymentService from '../../../../lib/services/paymentService';
import PaymentLinkService from '../../../../lib/services/paymentLinkService';
import { PaymentType } from '../../../../lib/services/paymentService';

// Initialize services
const paymentService = new PaymentService();
const paymentLinkService = new PaymentLinkService();

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication when NextAuth is configured
    // const session = await getServerSession(authOptions);
    // if (!session || !session.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as 'pending' | 'completed' | 'failed' | 'refunded' | null;

    // TODO: Add role-based access control
    // Only admin and artists can view all payments
    // if (!['admin', 'artist'].includes(session.user.role)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const result = await paymentService.getPayments({
      page,
      limit,
      status: status || undefined,
      customerId: searchParams.get('customerId') || undefined
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication when NextAuth is configured
    // const session = await getServerSession(authOptions);
    // if (!session || !session.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // TODO: Add role-based access control
    // Only admin and artists can create payments
    // if (!['admin', 'artist'].includes(session.user.role)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const body = await request.json();
    const { type, ...paymentData } = body;

    switch (type) {
      case 'payment_link':
        const paymentLinkResult = await paymentLinkService.createPaymentLink({
          amount: paymentData.amount,
          title: paymentData.title,
          description: paymentData.description,
          customerId: paymentData.customerId,
          appointmentId: paymentData.appointmentId,
          tattooRequestId: paymentData.tattooRequestId,
          paymentType: paymentData.paymentType as PaymentType,
          redirectUrl: paymentData.redirectUrl,
          allowTipping: paymentData.allowTipping || true,
          customFields: paymentData.customFields
        });

        return NextResponse.json({
          success: true,
          data: paymentLinkResult,
          type: 'payment_link'
        });

      case 'invoice':
        const invoiceResult = await paymentLinkService.createInvoice({
          customerId: paymentData.customerId,
          appointmentId: paymentData.appointmentId,
          tattooRequestId: paymentData.tattooRequestId,
          items: paymentData.items,
          paymentSchedule: paymentData.paymentSchedule,
          deliveryMethod: paymentData.deliveryMethod || 'EMAIL'
        });

        return NextResponse.json({
          success: true,
          data: invoiceResult,
          type: 'invoice'
        });

      case 'direct_payment':
        const paymentResult = await paymentService.processPayment({
          sourceId: paymentData.sourceId,
          amount: paymentData.amount,
          customerId: paymentData.customerId,
          paymentType: paymentData.paymentType as PaymentType,
          bookingId: paymentData.bookingId,
          note: paymentData.note
        });

        return NextResponse.json({
          success: true,
          data: paymentResult,
          type: 'direct_payment'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid payment type specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

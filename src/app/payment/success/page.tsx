'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowLeft, Receipt, MessageCircle, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState<{
    amount?: string;
    orderId?: string;
    referenceId?: string;
  }>({});

  useEffect(() => {
    // Extract payment details from URL params (sent by Square)
    const amount = searchParams.get('amount');
    const orderId = searchParams.get('order_id');
    const referenceId = searchParams.get('reference_id');
    
    setPaymentDetails({
      amount: amount ? `$${(parseInt(amount) / 100).toFixed(2)}` : undefined,
      orderId: orderId || undefined,
      referenceId: referenceId || undefined
    });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Success Animation */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 border-2 border-green-500/30 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-gray-400">Thank you for your payment</p>
        </div>

        {/* Payment Details Card */}
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-6 mb-6 hover:border-[#C9A449]/20 transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5 text-[#C9A449]" />
            <h2 className="text-lg font-semibold text-white">Payment Details</h2>
          </div>
          
          <div className="space-y-3">
            {paymentDetails.amount && (
              <div className="flex justify-between">
                <span className="text-gray-400">Amount Paid</span>
                <span className="text-white font-semibold text-xl">{paymentDetails.amount} CAD</span>
              </div>
            )}
            
            {paymentDetails.orderId && (
              <div className="flex justify-between">
                <span className="text-gray-400">Transaction ID</span>
                <span className="text-white/70 font-mono text-sm">{paymentDetails.orderId.slice(0, 12)}...</span>
              </div>
            )}
            
            <div className="pt-3 border-t border-[#1a1a1a]">
              <p className="text-sm text-gray-400">
                A receipt has been sent to your email address. Please keep it for your records.
              </p>
            </div>
          </div>
        </div>

        {/* What's Next Section */}
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-6 mb-6 hover:border-[#C9A449]/20 transition-all duration-300">
          <h3 className="text-lg font-semibold text-white mb-3">What's Next?</h3>
          <ul className="space-y-2 text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-[#C9A449] mt-1">•</span>
              <span>You'll receive a confirmation email with your receipt</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#C9A449] mt-1">•</span>
              <span>Our team will contact you regarding your appointment</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#C9A449] mt-1">•</span>
              <span>Feel free to reach out if you have any questions</span>
            </li>
          </ul>
        </div>

        {/* Contact Information */}
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-6 mb-6 hover:border-[#C9A449]/20 transition-all duration-300">
          <h3 className="text-lg font-semibold text-white mb-3">Need Help?</h3>
          <div className="space-y-3">
            <a 
              href="tel:+1234567890" 
              className="flex items-center gap-3 text-gray-400 hover:text-[#C9A449] transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>(123) 456-7890</span>
            </a>
            <a 
              href="mailto:info@bowenislandtattooshop.com" 
              className="flex items-center gap-3 text-gray-400 hover:text-[#C9A449] transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>info@bowenislandtattooshop.com</span>
            </a>
            <a 
              href="https://wa.me/1234567890" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-gray-400 hover:text-[#C9A449] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Us</span>
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Link 
            href="/"
            className="w-full px-6 py-3 bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] rounded-lg font-medium text-center transition-all duration-300 shadow-lg shadow-[#C9A449]/20"
          >
            Return to Homepage
          </Link>
          <Link 
            href="/tattoo-request"
            className="w-full px-6 py-3 bg-transparent border border-[#C9A449]/30 hover:bg-[#C9A449]/10 text-[#C9A449] rounded-lg font-medium text-center transition-all duration-300"
          >
            Submit a Tattoo Request
          </Link>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-gray-500 mt-8">
          Bowen Island Tattoo Shop • Secure payment processed by Square
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
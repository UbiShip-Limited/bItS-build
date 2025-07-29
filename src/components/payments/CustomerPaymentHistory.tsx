'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard } from 'lucide-react';
import { paymentService } from '@/src/lib/api/services/paymentService';
import { 
  PaymentHistoryInline, 
  PaymentHistorySummary, 
  PaymentHistoryFull,
  calculateSummary,
  PaymentHistoryProps,
  PaymentHistoryItem
} from './payment-history';

// Track global payment service availability to prevent repeated failed calls
let paymentServiceAvailable: boolean | null = null;
let lastPaymentServiceCheck = 0;
const PAYMENT_SERVICE_CHECK_INTERVAL = 60000; // Check every minute

export default function CustomerPaymentHistory({
  customerId,
  customerName,
  variant = 'full',
  className = '',
  showTitle = true
}: PaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentServiceUnavailable, setPaymentServiceUnavailable] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // Check if payment service is available before making calls
  const checkPaymentServiceAvailability = useCallback(async () => {
    const now = Date.now();
    
    // Use cached result if recent
    if (paymentServiceAvailable !== null && (now - lastPaymentServiceCheck) < PAYMENT_SERVICE_CHECK_INTERVAL) {
      return paymentServiceAvailable;
    }
    
    try {
      const testResult = await paymentService.testPaymentRoutes();
      paymentServiceAvailable = testResult.available;
      lastPaymentServiceCheck = now;
      
      if (!testResult.available) {
        console.warn('🚫 Payment service unavailable:', testResult.message);
        setPaymentServiceUnavailable(true);
        setError(null); // Clear any previous errors
      } else {
        setPaymentServiceUnavailable(false);
      }
      
      return testResult.available;
    } catch (error) {
      console.error('🚫 Payment service check failed:', error);
      paymentServiceAvailable = false;
      lastPaymentServiceCheck = now;
      setPaymentServiceUnavailable(true);
      return false;
    }
  }, []);

  const loadPaymentHistory = useCallback(async () => {
    if (!customerId) return;
    
    // Prevent multiple rapid calls
    if (hasAttemptedLoad) {
      console.log('🔄 Payment history load already attempted, skipping...');
      return;
    }

    // Check if payment service is available first
    const isAvailable = await checkPaymentServiceAvailability();
    if (!isAvailable) {
      setLoading(false);
      setPaymentServiceUnavailable(true);
      setHasAttemptedLoad(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setPaymentServiceUnavailable(false);
      setHasAttemptedLoad(true);
      
      // Use the payment service with customer-specific endpoint
      const response = await paymentService.getCustomerPayments(customerId, 50);
      
      if (response && response.success) {
        // Handle both empty arrays (new customers) and populated arrays
        if (response.data && Array.isArray(response.data)) {
          if (response.data.length === 0) {
            console.log(`📝 No payment history found for customer ${customerName || customerId} - likely a new customer`);
            setPayments([]);
            setError(null); // This is not an error - just no history yet
          } else {
            const paymentHistory = response.data.map(payment => ({
              id: payment.id,
              amount: payment.amount,
              status: payment.status,
              paymentType: payment.paymentType || 'other',
              createdAt: payment.createdAt,
              appointmentId: payment.appointmentId,
              tattooRequestId: payment.tattooRequestId,
              method: payment.paymentMethod
            }));
            
            setPayments(paymentHistory);
            console.log(`✅ Loaded ${paymentHistory.length} payments for customer ${customerName || customerId}`);
          }
        } else {
          // Handle unexpected data format
          console.warn('💳 Unexpected payment data format:', response.data);
          setPayments([]);
        }
      } else {
        // Handle case where response is null or success is false
        console.warn('💳 Payment response invalid:', response);
        setPayments([]);
        if (!response) {
          setError('No response from payment service');
        } else if (!response.success) {
          // When success is false, treat as service unavailable
          setPaymentServiceUnavailable(true);
          setError(null);
        }
      }
    } catch (err: any) {
      console.error('💳 Payment history load failed:', err.message || err);
      
      // Handle specific error types
      if (err.message?.includes('not available') || err.message?.includes('temporarily unavailable')) {
        setPaymentServiceUnavailable(true);
        setError(null);
      } else {
        setError('Unable to load payment history');
      }
    } finally {
      setLoading(false);
    }
  }, [customerId, hasAttemptedLoad, checkPaymentServiceAvailability]);

  useEffect(() => {
    loadPaymentHistory();
  }, [loadPaymentHistory]);

  // Calculate summary from payments
  const summary = calculateSummary(payments);

  // Don't render anything if payment service is unavailable and variant is inline
  if (paymentServiceUnavailable && variant === 'inline') {
    return null;
  }

  // Show a minimal message for unavailable service
  if (paymentServiceUnavailable) {
    if (variant === 'summary' || variant === 'full') {
      return (
        <div className={`bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 ${className}`}>
          {showTitle && (
            <h3 className="text-sm font-medium text-white mb-3">
              Payment History {customerName && `- ${customerName}`}
            </h3>
          )}
          <div className="text-center py-4">
            <CreditCard className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Payment features not available</p>
          </div>
        </div>
      );
    }
    return null;
  }

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 text-center text-red-400 ${className}`}>
        <CreditCard className="w-5 h-5 mx-auto mb-2" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Render appropriate variant
  switch (variant) {
    case 'inline':
      return (
        <PaymentHistoryInline
          customerId={customerId}
          customerName={customerName}
          className={className}
          showTitle={showTitle}
          summary={summary}
          paymentsCount={payments.length}
        />
      );
    
    case 'summary':
      return (
        <PaymentHistorySummary
          customerId={customerId}
          customerName={customerName}
          className={className}
          showTitle={showTitle}
          summary={summary}
          paymentsCount={payments.length}
        />
      );
    
    case 'full':
    default:
      return (
        <PaymentHistoryFull
          customerId={customerId}
          customerName={customerName}
          className={className}
          showTitle={showTitle}
          payments={payments}
          summary={summary}
        />
      );
  }
} 
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Clock, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { paymentService, type PaymentLink } from '@/src/lib/api/services/paymentService';
import { formatPaymentType } from '@/lib/config/pricing';

interface CustomerPaymentHistoryProps {
  customerId: string;
  customerName?: string;
  variant?: 'full' | 'summary' | 'inline';
  className?: string;
  showTitle?: boolean;
}

interface PaymentHistoryItem {
  id: string;
  amount: number;
  status: string;
  paymentType: string;
  createdAt: string;
  appointmentId?: string;
  tattooRequestId?: string;
  method?: string;
}

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
}: CustomerPaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [summary, setSummary] = useState({
    totalPaid: 0,
    totalPayments: 0,
    successRate: 0,
    averageAmount: 0,
    lastPayment: null as string | null
  });
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
      
      if (response.success) {
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
        
        // Calculate summary
        const completedPayments = paymentHistory.filter(p => p.status === 'completed');
        const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
        const successRate = paymentHistory.length > 0 ? (completedPayments.length / paymentHistory.length) * 100 : 0;
        const averageAmount = completedPayments.length > 0 ? totalPaid / completedPayments.length : 0;
        const lastPayment = completedPayments.length > 0 ? completedPayments[0].createdAt : null;
        
        setSummary({
          totalPaid,
          totalPayments: paymentHistory.length,
          successRate,
          averageAmount,
          lastPayment
        });
      }
    } catch (err: any) {
      console.error('💳 Payment history load failed:', err.message);
      
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
  }, [customerId, hasAttemptedLoad]);

  useEffect(() => {
    loadPaymentHistory();
  }, [loadPaymentHistory]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <CreditCard className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

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
        <AlertCircle className="w-5 h-5 mx-auto mb-2" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Inline variant - minimal display
  if (variant === 'inline') {
    if (payments.length === 0) return null;
    
    return (
      <div className={`inline-flex items-center gap-2 text-xs text-gray-400 ${className}`}>
        <DollarSign className="w-3 h-3" />
        <span>${summary.totalPaid.toFixed(0)} total</span>
        <span>•</span>
        <span>{payments.length} payments</span>
        {summary.lastPayment && (
          <>
            <span>•</span>
            <span>Last: {formatTime(summary.lastPayment)}</span>
          </>
        )}
      </div>
    );
  }

  // Summary variant - overview stats
  if (variant === 'summary') {
    return (
      <div className={`bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 ${className}`}>
        {showTitle && (
          <h3 className="text-sm font-medium text-white mb-3">
            Payment Summary {customerName && `- ${customerName}`}
          </h3>
        )}
        
        {payments.length === 0 ? (
          <div className="text-center py-4">
            <CreditCard className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No payment history</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-[#C9A449]">
                ${summary.totalPaid.toFixed(0)}
              </div>
              <div className="text-xs text-gray-400">Total Paid</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {summary.totalPayments}
              </div>
              <div className="text-xs text-gray-400">Payments</div>
            </div>
            <div>
              <div className="text-lg font-medium text-green-400">
                {summary.successRate.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-400">Success Rate</div>
            </div>
            <div>
              <div className="text-lg font-medium text-white">
                ${summary.averageAmount.toFixed(0)}
              </div>
              <div className="text-xs text-gray-400">Average</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full variant - detailed list
  return (
    <div className={`bg-[#111111] border border-[#1a1a1a] rounded-lg ${className}`}>
      {showTitle && (
        <div className="px-4 py-3 border-b border-[#1a1a1a]">
          <h3 className="text-sm font-medium text-white">
            Payment History {customerName && `- ${customerName}`}
          </h3>
        </div>
      )}
      
      {payments.length === 0 ? (
        <div className="p-6 text-center">
          <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">No payments yet</p>
          <p className="text-xs text-gray-500 mt-1">Payment history will appear here</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="p-4 bg-[#080808] grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-[#C9A449]">${summary.totalPaid.toFixed(0)}</div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{summary.totalPayments}</div>
              <div className="text-xs text-gray-400">Count</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-400">{summary.successRate.toFixed(0)}%</div>
              <div className="text-xs text-gray-400">Success</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">${summary.averageAmount.toFixed(0)}</div>
              <div className="text-xs text-gray-400">Average</div>
            </div>
          </div>
          
          {/* Payment list */}
          <div className="divide-y divide-[#1a1a1a] max-h-64 overflow-y-auto">
            {payments.slice(0, 10).map((payment) => (
              <div key={payment.id} className="p-4 hover:bg-[#1a1a1a]/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(payment.status)}
                    <div>
                      <div className="text-sm font-medium text-white">
                        {formatPaymentType(payment.paymentType as any)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(payment.createdAt)}
                        {payment.method && ` • ${payment.method}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#C9A449]">
                      ${payment.amount.toFixed(2)}
                    </div>
                    <div className={`text-xs font-medium capitalize ${
                      payment.status === 'completed' ? 'text-green-400' :
                      payment.status === 'pending' ? 'text-yellow-400' :
                      payment.status === 'failed' ? 'text-red-400' :
                      'text-gray-400'
                    }`}>
                      {payment.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {payments.length > 10 && (
            <div className="p-3 text-center border-t border-[#1a1a1a]">
              <p className="text-xs text-gray-400">
                Showing 10 of {payments.length} payments
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
} 
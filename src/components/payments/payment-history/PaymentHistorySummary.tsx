'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';
import { BasePaymentHistoryProps, PaymentSummary } from './types';

interface PaymentHistorySummaryProps extends BasePaymentHistoryProps {
  summary: PaymentSummary;
  paymentsCount: number;
}

export function PaymentHistorySummary({
  summary,
  paymentsCount,
  customerName,
  showTitle = true,
  className = ''
}: PaymentHistorySummaryProps) {
  return (
    <div className={`bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 ${className}`}>
      {showTitle && (
        <h3 className="text-sm font-medium text-white mb-3">
          Payment Summary {customerName && `- ${customerName}`}
        </h3>
      )}
      
      {paymentsCount === 0 ? (
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
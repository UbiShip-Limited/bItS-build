'use client';

import React from 'react';
import { DollarSign } from 'lucide-react';
import { BasePaymentHistoryProps, PaymentSummary } from './types';
import { formatTime } from './utils';

interface PaymentHistoryInlineProps extends BasePaymentHistoryProps {
  summary: PaymentSummary;
  paymentsCount: number;
}

export function PaymentHistoryInline({
  summary,
  paymentsCount,
  className = ''
}: PaymentHistoryInlineProps) {
  if (paymentsCount === 0) return null;
  
  return (
    <div className={`inline-flex items-center gap-2 text-xs text-gray-400 ${className}`}>
      <DollarSign className="w-3 h-3" />
      <span>${summary.totalPaid.toFixed(0)} total</span>
      <span>•</span>
      <span>{paymentsCount} payments</span>
      {summary.lastPayment && (
        <>
          <span>•</span>
          <span>Last: {formatTime(summary.lastPayment)}</span>
        </>
      )}
    </div>
  );
} 
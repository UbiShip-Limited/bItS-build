'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';
import { BasePaymentHistoryProps, PaymentHistoryItem, PaymentSummary } from './types';
import { getStatusIcon, getStatusColor, formatDate } from './utils';
import { formatPaymentType } from '@/lib/config/pricing';

interface PaymentHistoryFullProps extends BasePaymentHistoryProps {
  payments: PaymentHistoryItem[];
  summary: PaymentSummary;
}

export function PaymentHistoryFull({
  payments,
  summary,
  customerName,
  showTitle = true,
  className = ''
}: PaymentHistoryFullProps) {
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
            {payments.slice(0, 10).map((payment) => {
              const StatusIcon = getStatusIcon(payment.status);
              const statusColor = getStatusColor(payment.status);
              
              return (
                <div key={payment.id} className="p-4 hover:bg-[#1a1a1a]/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`w-4 h-4 ${statusColor}`} />
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
                      <div className={`text-xs font-medium capitalize ${statusColor}`}>
                        {payment.status}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
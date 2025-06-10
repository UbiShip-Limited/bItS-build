import { CreditCard, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { PaymentHistoryItem, PaymentSummary } from './types';

export function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return CheckCircle;
    case 'pending':
      return Clock;
    case 'failed':
      return AlertCircle;
    default:
      return CreditCard;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'text-green-400';
    case 'pending':
      return 'text-yellow-400';
    case 'failed':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

export function calculateSummary(payments: PaymentHistoryItem[]): PaymentSummary {
  const completedPayments = payments.filter(p => p.status === 'completed');
  const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  const successRate = payments.length > 0 ? (completedPayments.length / payments.length) * 100 : 0;
  const averageAmount = completedPayments.length > 0 ? totalPaid / completedPayments.length : 0;
  const lastPayment = completedPayments.length > 0 ? completedPayments[0].createdAt : null;
  
  return {
    totalPaid,
    totalPayments: payments.length,
    successRate,
    averageAmount,
    lastPayment
  };
} 
export interface PaymentHistoryItem {
  id: string;
  amount: number;
  status: string;
  paymentType: string;
  createdAt: string;
  appointmentId?: string;
  tattooRequestId?: string;
  method?: string;
}

export interface PaymentSummary {
  totalPaid: number;
  totalPayments: number;
  successRate: number;
  averageAmount: number;
  lastPayment: string | null;
}

export interface BasePaymentHistoryProps {
  customerId: string;
  customerName?: string;
  className?: string;
  showTitle?: boolean;
}

export interface PaymentHistoryProps extends BasePaymentHistoryProps {
  variant?: 'full' | 'summary' | 'inline';
} 
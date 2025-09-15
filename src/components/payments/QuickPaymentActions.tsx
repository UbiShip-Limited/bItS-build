'use client';

import React, { useState } from 'react';
import { DollarSign, CreditCard, FileText, Clock } from 'lucide-react';
import { PaymentType } from '@/src/lib/config/pricing';
import { formatPaymentType, getMinimumAmount } from '@/src/lib/config/pricing';
import CreatePaymentLinkModal from './CreatePaymentLinkModal';

interface QuickPaymentActionsProps {
  // Context data
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  
  // Optional linking
  appointmentId?: string;
  tattooRequestId?: string;
  
  // Current status to determine available actions
  appointmentStatus?: string;
  requestStatus?: string;
  
  // Existing payment info
  depositPaid?: boolean;
  finalPaid?: boolean;
  currentPrice?: number;
  
  // Styling
  variant?: 'buttons' | 'dropdown' | 'compact';
  className?: string;
  
  // Callbacks
  onPaymentCreated?: (paymentLink: any) => void;
}

interface PaymentAction {
  type: PaymentType;
  label: string;
  amount: number;
  icon: React.ReactNode;
  description: string;
  available: boolean;
  variant: 'primary' | 'secondary' | 'accent';
}

export default function QuickPaymentActions({
  customerId,
  customerName,
  customerEmail,
  appointmentId,
  tattooRequestId,
  appointmentStatus,
  requestStatus,
  depositPaid = false,
  finalPaid = false,
  currentPrice,
  variant = 'buttons',
  className = '',
  onPaymentCreated
}: QuickPaymentActionsProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<PaymentAction | null>(null);

  // Calculate smart payment actions based on context
  const getAvailableActions = (): PaymentAction[] => {
    const actions: PaymentAction[] = [];
    
    // Consultation payment
    if (!appointmentId || (appointmentStatus && ['pending', 'scheduled'].includes(appointmentStatus))) {
      actions.push({
        type: PaymentType.CONSULTATION,
        label: 'Consultation',
        amount: currentPrice || getMinimumAmount(PaymentType.CONSULTATION),
        icon: <Clock className="w-4 h-4" />,
        description: 'Book consultation session',
        available: true,
        variant: 'secondary'
      });
    }

    // Drawing consultation
    if (requestStatus === 'approved' || requestStatus === 'reviewed') {
      actions.push({
        type: PaymentType.DRAWING_CONSULTATION,
        label: 'Drawing Session',
        amount: currentPrice || getMinimumAmount(PaymentType.DRAWING_CONSULTATION),
        icon: <FileText className="w-4 h-4" />,
        description: 'Custom design consultation',
        available: true,
        variant: 'accent'
      });
    }

    // Tattoo deposit
    if ((requestStatus === 'approved' || appointmentStatus === 'confirmed') && !depositPaid) {
      const depositAmount = currentPrice ? currentPrice * 0.3 : getMinimumAmount(PaymentType.TATTOO_DEPOSIT);
      actions.push({
        type: PaymentType.TATTOO_DEPOSIT,
        label: 'Deposit',
        amount: depositAmount,
        icon: <DollarSign className="w-4 h-4" />,
        description: 'Secure appointment slot',
        available: true,
        variant: 'primary'
      });
    }

    // Final payment
    if ((appointmentStatus === 'completed' || requestStatus === 'in_progress') && depositPaid && !finalPaid) {
      const finalAmount = currentPrice ? currentPrice * 0.7 : getMinimumAmount(PaymentType.TATTOO_FINAL);
      actions.push({
        type: PaymentType.TATTOO_FINAL,
        label: 'Final Payment',
        amount: finalAmount,
        icon: <CreditCard className="w-4 h-4" />,
        description: 'Complete session payment',
        available: true,
        variant: 'primary'
      });
    }

    return actions.filter(action => action.available);
  };

  const availableActions = getAvailableActions();

  const handleActionClick = (action: PaymentAction) => {
    setSelectedAction(action);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentLink: any) => {
    setShowPaymentModal(false);
    setSelectedAction(null);
    onPaymentCreated?.(paymentLink);
  };

  if (availableActions.length === 0) {
    return null;
  }

  // Compact variant - single primary action
  if (variant === 'compact') {
    const primaryAction = availableActions.find(a => a.variant === 'primary') || availableActions[0];
    return (
      <>
        <button
          onClick={() => handleActionClick(primaryAction)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            primaryAction.variant === 'primary' 
              ? 'bg-[#C9A449] hover:bg-[#B8934A] text-[#080808]'
              : primaryAction.variant === 'accent'
              ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30'
              : 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 border border-gray-500/30'
          } ${className}`}
        >
          {primaryAction.icon}
          ${primaryAction.amount.toFixed(0)}
        </button>

        {selectedAction && (
          <CreatePaymentLinkModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            customerId={customerId}
            customerName={customerName || undefined}
            appointmentId={appointmentId}
            tattooRequestId={tattooRequestId}
            defaultAmount={selectedAction.amount}
            defaultType={selectedAction.type}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </>
    );
  }

  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <>
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className={`btn btn-sm btn-ghost text-[#C9A449] hover:bg-[#C9A449]/10 ${className}`}>
            <DollarSign className="w-4 h-4" />
            Payment
          </label>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-[#111111] border border-[#1a1a1a] rounded-box w-64">
            {availableActions.map((action, index) => (
              <li key={index}>
                <button
                  onClick={() => handleActionClick(action)}
                  className="flex items-center justify-between w-full p-3 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded ${
                      action.variant === 'primary' ? 'bg-[#C9A449]/20 text-[#C9A449]' :
                      action.variant === 'accent' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {action.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-white">{action.label}</div>
                      <div className="text-xs text-gray-400">{action.description}</div>
                    </div>
                  </div>
                  <div className="font-bold text-[#C9A449]">
                    ${action.amount.toFixed(0)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {selectedAction && (
          <CreatePaymentLinkModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            customerId={customerId}
            customerName={customerName || undefined}
            appointmentId={appointmentId}
            tattooRequestId={tattooRequestId}
            defaultAmount={selectedAction.amount}
            defaultType={selectedAction.type}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </>
    );
  }

  // Default buttons variant
  return (
    <>
      <div className={`flex gap-2 ${className}`}>
        {availableActions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleActionClick(action)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              action.variant === 'primary' 
                ? 'bg-[#C9A449] hover:bg-[#B8934A] text-[#080808]'
                : action.variant === 'accent'
                ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30'
                : 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 border border-gray-500/30'
            }`}
            title={action.description}
          >
            {action.icon}
            {action.label} (${action.amount.toFixed(0)})
          </button>
        ))}
      </div>

      {selectedAction && (
        <CreatePaymentLinkModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          customerId={customerId}
          customerName={customerName}
          appointmentId={appointmentId}
          tattooRequestId={tattooRequestId}
          defaultAmount={selectedAction.amount}
          defaultType={selectedAction.type}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
} 
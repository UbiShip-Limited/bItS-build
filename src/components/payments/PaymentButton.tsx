'use client';

import React, { useState } from 'react';
import { DollarSign, Link, FileText, Send, Loader } from 'lucide-react';
import CreatePaymentLinkModal from './CreatePaymentLinkModal';
import CreateInvoiceModal from './CreateInvoiceModal';
import { PaymentType } from '@/src/lib/api/services/paymentService';

interface PaymentButtonProps {
  customerId: string;
  customerName?: string;
  appointmentId?: string;
  tattooRequestId?: string;
  defaultAmount?: number;
  defaultType?: PaymentType;
  buttonText?: string;
  buttonVariant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  showIcon?: boolean;
  onSuccess?: (paymentLink: any) => void;
  disabled?: boolean;
}

export default function PaymentButton({
  customerId,
  customerName,
  appointmentId,
  tattooRequestId,
  defaultAmount = 0,
  defaultType = PaymentType.CONSULTATION,
  buttonText = 'Request Payment',
  buttonVariant = 'primary',
  showIcon = true,
  onSuccess,
  disabled = false
}: PaymentButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const getButtonClasses = () => {
    const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50';
    
    switch (buttonVariant) {
      case 'primary':
        return `${base} bg-blue-600 text-white hover:bg-blue-700`;
      case 'secondary':
        return `${base} bg-gray-600 text-white hover:bg-gray-700`;
      case 'ghost':
        return `${base} text-gray-600 hover:bg-gray-100`;
      case 'outline':
        return `${base} border border-gray-300 text-gray-700 hover:bg-gray-50`;
      default:
        return base;
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={getButtonClasses()}
        disabled={disabled}
      >
        {showIcon && <DollarSign className="w-4 h-4" />}
        {buttonText}
      </button>

      <CreatePaymentLinkModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        customerId={customerId}
        customerName={customerName}
        appointmentId={appointmentId}
        tattooRequestId={tattooRequestId}
        defaultAmount={defaultAmount}
        defaultType={defaultType}
        onSuccess={(paymentLink) => {
          setShowModal(false);
          if (onSuccess) {
            onSuccess(paymentLink);
          }
        }}
      />
    </>
  );
}

// Dropdown variant for more options
interface PaymentDropdownProps extends PaymentButtonProps {
  showInvoiceOption?: boolean;
}

export function PaymentDropdown({
  customerId,
  customerName,
  appointmentId,
  tattooRequestId,
  defaultAmount = 0,
  defaultType = PaymentType.CONSULTATION,
  buttonText = 'Payment Options',
  onSuccess,
  disabled = false,
  showInvoiceOption = true
}: PaymentDropdownProps) {
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateInvoice = async () => {
    setLoading(true);
    // TODO: Implement invoice creation
    setLoading(false);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        disabled={disabled || loading}
      >
        {loading ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <DollarSign className="w-4 h-4" />
        )}
        {buttonText}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 border">
          <div className="py-1">
            <button
              onClick={() => {
                setShowModal(true);
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Create Payment Link
            </button>
            {showInvoiceOption && (
              <button
                onClick={handleCreateInvoice}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Create Invoice
              </button>
            )}
          </div>
        </div>
      )}

      <CreatePaymentLinkModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        customerId={customerId}
        customerName={customerName}
        appointmentId={appointmentId}
        tattooRequestId={tattooRequestId}
        defaultAmount={defaultAmount}
        defaultType={defaultType}
        onSuccess={(paymentLink) => {
          setShowModal(false);
          if (onSuccess) {
            onSuccess(paymentLink);
          }
        }}
      />
    </div>
  );
} 
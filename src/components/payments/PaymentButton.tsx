'use client';

import React, { useState } from 'react';
import { DollarSign, Link, FileText } from 'lucide-react';
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
  buttonVariant?: 'primary' | 'secondary' | 'ghost';
  showIcon?: boolean;
  onSuccess?: () => void;
}

export default function PaymentButton({
  customerId,
  customerName,
  appointmentId,
  tattooRequestId,
  defaultAmount,
  defaultType,
  buttonText = 'Request Payment',
  buttonVariant = 'primary',
  showIcon = true,
  onSuccess
}: PaymentButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'link' | 'invoice'>('link');

  const handleClick = () => {
    setModalType('link');
    setShowModal(true);
  };

  const getButtonClasses = () => {
    const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors';
    
    switch (buttonVariant) {
      case 'primary':
        return `${base} bg-blue-600 text-white hover:bg-blue-700`;
      case 'secondary':
        return `${base} bg-gray-100 text-gray-700 hover:bg-gray-200`;
      case 'ghost':
        return `${base} text-gray-600 hover:bg-gray-100`;
      default:
        return base;
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={getButtonClasses()}
      >
        {showIcon && <DollarSign className="w-4 h-4" />}
        {buttonText}
      </button>

      {modalType === 'link' && (
        <CreatePaymentLinkModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          customerId={customerId}
          customerName={customerName}
          appointmentId={appointmentId}
          tattooRequestId={tattooRequestId}
          defaultAmount={defaultAmount}
          defaultType={defaultType}
          onSuccess={(link) => {
            setShowModal(false);
            if (onSuccess) onSuccess();
          }}
        />
      )}

      {modalType === 'invoice' && (
        <CreateInvoiceModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          customerId={customerId}
          customerName={customerName}
          appointmentId={appointmentId}
          tattooRequestId={tattooRequestId}
          onSuccess={(invoice) => {
            setShowModal(false);
            if (onSuccess) onSuccess();
          }}
        />
      )}
    </>
  );
}

// Dropdown variant for more options
interface PaymentDropdownProps extends PaymentButtonProps {
  showInvoiceOption?: boolean;
}

export function PaymentDropdown({
  showInvoiceOption = true,
  ...props
}: PaymentDropdownProps) {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'link' | 'invoice'>('link');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleOptionClick = (type: 'link' | 'invoice') => {
    setModalType(type);
    setShowModal(true);
    setShowDropdown(false);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          <DollarSign className="w-4 h-4" />
          Payment Options
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10">
            <div className="py-1">
              <button
                onClick={() => handleOptionClick('link')}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Link className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-medium">Payment Link</div>
                  <div className="text-xs text-gray-500">Quick payment collection</div>
                </div>
              </button>
              
              {showInvoiceOption && (
                <button
                  onClick={() => handleOptionClick('invoice')}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FileText className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-medium">Invoice</div>
                    <div className="text-xs text-gray-500">Detailed billing with schedule</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {modalType === 'link' && (
        <CreatePaymentLinkModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          customerId={props.customerId}
          customerName={props.customerName}
          appointmentId={props.appointmentId}
          tattooRequestId={props.tattooRequestId}
          defaultAmount={props.defaultAmount}
          defaultType={props.defaultType}
          onSuccess={(link) => {
            setShowModal(false);
            if (props.onSuccess) props.onSuccess();
          }}
        />
      )}

      {modalType === 'invoice' && (
        <CreateInvoiceModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          customerId={props.customerId}
          customerName={props.customerName}
          appointmentId={props.appointmentId}
          tattooRequestId={props.tattooRequestId}
          onSuccess={(invoice) => {
            setShowModal(false);
            if (props.onSuccess) props.onSuccess();
          }}
        />
      )}
    </>
  );
} 
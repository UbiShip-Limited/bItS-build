'use client';

import React, { useState } from 'react';
import { X, Copy, Send, DollarSign } from 'lucide-react';
import { paymentService, PaymentType, CreatePaymentLinkParams } from '@/src/lib/api/services/paymentService';

interface CreatePaymentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName?: string;
  appointmentId?: string;
  tattooRequestId?: string;
  defaultAmount?: number;
  defaultType?: PaymentType;
  onSuccess?: (paymentLink: any) => void;
}

export default function CreatePaymentLinkModal({
  isOpen,
  onClose,
  customerId,
  customerName,
  appointmentId,
  tattooRequestId,
  defaultAmount = 0,
  defaultType = PaymentType.CONSULTATION,
  onSuccess
}: CreatePaymentLinkModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<CreatePaymentLinkParams>>({
    amount: defaultAmount,
    title: '',
    description: '',
    paymentType: defaultType,
    allowTipping: true,
    customFields: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate minimum amount
      const minAmount = paymentService.getMinimumAmount(formData.paymentType as PaymentType);
      if ((formData.amount || 0) < minAmount) {
        throw new Error(`Minimum amount for ${paymentService.formatPaymentType(formData.paymentType as PaymentType)} is $${minAmount}`);
      }

      const params: CreatePaymentLinkParams = {
        ...formData as CreatePaymentLinkParams,
        customerId,
        appointmentId,
        tattooRequestId
      };

      const response = await paymentService.createPaymentLink(params);
      
      if (response.success) {
        setSuccess(true);
        setPaymentLinkUrl(response.data.url);
        if (onSuccess) {
          onSuccess(response.data);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create payment link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (paymentLinkUrl) {
      navigator.clipboard.writeText(paymentLinkUrl);
      // You could add a toast notification here
    }
  };

  const sendViaEmail = () => {
    if (paymentLinkUrl) {
      window.location.href = `mailto:?subject=Payment Request&body=Please complete your payment using this link: ${paymentLinkUrl}`;
    }
  };

  const handleClose = () => {
    setFormData({
      amount: defaultAmount,
      title: '',
      description: '',
      paymentType: defaultType,
      allowTipping: true,
      customFields: []
    });
    setError(null);
    setSuccess(false);
    setPaymentLinkUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Create Payment Link</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="p-6">
            {customerName && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">Customer: <span className="font-medium">{customerName}</span></p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Type
                </label>
                <select
                  value={formData.paymentType}
                  onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as PaymentType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={PaymentType.CONSULTATION}>Consultation</option>
                  <option value={PaymentType.DRAWING_CONSULTATION}>Drawing Consultation</option>
                  <option value={PaymentType.TATTOO_DEPOSIT}>Tattoo Deposit</option>
                  <option value={PaymentType.TATTOO_FINAL}>Final Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (CAD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                {formData.paymentType && (
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum: ${paymentService.getMinimumAmount(formData.paymentType as PaymentType)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Tattoo Consultation - John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Additional details about the payment..."
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allowTipping}
                    onChange={(e) => setFormData({ ...formData, allowTipping: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Allow tipping</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Link'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Payment Link Created!</h3>
              <p className="text-sm text-gray-600">The payment link has been generated successfully.</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <p className="text-xs text-gray-500 mb-2">Payment Link:</p>
              <p className="text-sm break-all font-mono">{paymentLinkUrl}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </button>
              <button
                onClick={sendViaEmail}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
                Send Email
              </button>
            </div>

            <button
              onClick={handleClose}
              className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, DollarSign } from 'lucide-react';
import { paymentService, CreateInvoiceParams } from '@/src/lib/api/services/paymentService';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName?: string;
  appointmentId?: string;
  tattooRequestId?: string;
  defaultItems?: Array<{ description: string; amount: number }>;
  onSuccess?: (invoice: any) => void;
}

interface InvoiceItem {
  description: string;
  amount: number;
}

interface PaymentScheduleItem {
  amount: number;
  dueDate: string;
  type: 'DEPOSIT' | 'BALANCE';
}

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  customerId,
  customerName,
  appointmentId,
  tattooRequestId,
  defaultItems = [],
  onSuccess
}: CreateInvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  
  const [items, setItems] = useState<InvoiceItem[]>(
    defaultItems.length > 0 ? defaultItems : [{ description: '', amount: 0 }]
  );
  
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([]);
  const [useSchedule, setUseSchedule] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'EMAIL' | 'SMS' | 'SHARE_MANUALLY'>('EMAIL');

  const addItem = () => {
    setItems([...items, { description: '', amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addPaymentScheduleItem = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setPaymentSchedule([
      ...paymentSchedule,
      { amount: 0, dueDate: tomorrow.toISOString().split('T')[0], type: 'DEPOSIT' }
    ]);
  };

  const removePaymentScheduleItem = (index: number) => {
    setPaymentSchedule(paymentSchedule.filter((_, i) => i !== index));
  };

  const updatePaymentScheduleItem = (index: number, field: keyof PaymentScheduleItem, value: any) => {
    const newSchedule = [...paymentSchedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setPaymentSchedule(newSchedule);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const validateScheduleTotal = () => {
    if (!useSchedule || paymentSchedule.length === 0) return true;
    const scheduleTotal = paymentSchedule.reduce((sum, item) => sum + (item.amount || 0), 0);
    const itemsTotal = calculateTotal();
    return Math.abs(scheduleTotal - itemsTotal) < 0.01; // Allow for small rounding differences
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate items
      const validItems = items.filter(item => item.description && item.amount > 0);
      if (validItems.length === 0) {
        throw new Error('Please add at least one item with description and amount');
      }

      // Validate payment schedule if used
      if (useSchedule && paymentSchedule.length > 0 && !validateScheduleTotal()) {
        throw new Error('Payment schedule total must equal items total');
      }

      const params: CreateInvoiceParams = {
        customerId,
        appointmentId,
        tattooRequestId,
        items: validItems,
        paymentSchedule: useSchedule ? paymentSchedule : undefined,
        deliveryMethod
      };

      const response = await paymentService.createInvoice(params);
      
      if (response.success) {
        setSuccess(true);
        setInvoiceData(response.data);
        if (onSuccess) {
          onSuccess(response.data);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setItems([{ description: '', amount: 0 }]);
    setPaymentSchedule([]);
    setUseSchedule(false);
    setDeliveryMethod('EMAIL');
    setError(null);
    setSuccess(false);
    setInvoiceData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Create Invoice</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {customerName && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">Customer: <span className="font-medium">{customerName}</span></p>
              </div>
            )}

            {/* Invoice Items */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium">Invoice Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>
              
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Description"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.amount}
                      onChange={(e) => updateItem(index, 'amount', parseFloat(e.target.value) || 0)}
                      placeholder="Amount"
                      className="w-32 pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              
              <div className="mt-3 text-right">
                <p className="text-lg font-semibold">Total: ${calculateTotal().toFixed(2)}</p>
              </div>
            </div>

            {/* Payment Schedule */}
            <div className="mb-6">
              <label className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={useSchedule}
                  onChange={(e) => setUseSchedule(e.target.checked)}
                  className="mr-2"
                />
                <span className="font-medium">Set up payment schedule</span>
              </label>
              
              {useSchedule && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm text-gray-600">Split payment into multiple installments</p>
                    <button
                      type="button"
                      onClick={addPaymentScheduleItem}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Payment
                    </button>
                  </div>
                  
                  {paymentSchedule.map((schedule, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <select
                        value={schedule.type}
                        onChange={(e) => updatePaymentScheduleItem(index, 'type', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="DEPOSIT">Deposit</option>
                        <option value="BALANCE">Balance</option>
                      </select>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={schedule.amount}
                          onChange={(e) => updatePaymentScheduleItem(index, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="Amount"
                          className="w-32 pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={schedule.dueDate}
                          onChange={(e) => updatePaymentScheduleItem(index, 'dueDate', e.target.value)}
                          className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePaymentScheduleItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  
                  {!validateScheduleTotal() && (
                    <p className="text-sm text-red-600 mt-2">
                      Schedule total must equal invoice total (${calculateTotal().toFixed(2)})
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Delivery Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Method
              </label>
              <select
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="SHARE_MANUALLY">Share Manually</option>
              </select>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
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
                disabled={loading || (useSchedule && !validateScheduleTotal())}
              >
                {loading ? 'Creating...' : 'Create Invoice'}
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
              <h3 className="text-lg font-semibold mb-2">Invoice Created!</h3>
              <p className="text-sm text-gray-600">
                {deliveryMethod === 'EMAIL' ? 'Invoice has been emailed to the customer.' :
                 deliveryMethod === 'SMS' ? 'Invoice has been sent via SMS to the customer.' :
                 'Invoice created. Share the link with the customer.'}
              </p>
            </div>

            {invoiceData && (
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <p className="text-xs text-gray-500 mb-1">Invoice Number:</p>
                <p className="font-medium">{invoiceData.invoiceNumber}</p>
                {invoiceData.publicUrl && (
                  <>
                    <p className="text-xs text-gray-500 mb-1 mt-3">Public URL:</p>
                    <p className="text-sm break-all font-mono">{invoiceData.publicUrl}</p>
                  </>
                )}
              </div>
            )}

            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
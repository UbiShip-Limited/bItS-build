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
  onSuccess
}: CreateInvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', amount: 0 }
  ]);
  
  const [usePaymentSchedule, setUsePaymentSchedule] = useState(false);
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([
    { amount: 0, dueDate: '', type: 'DEPOSIT' },
    { amount: 0, dueDate: '', type: 'BALANCE' }
  ]);
  
  const [deliveryMethod, setDeliveryMethod] = useState<'EMAIL' | 'SMS' | 'SHARE_MANUALLY'>('EMAIL');

  const addItem = () => {
    setItems([...items, { description: '', amount: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const updateSchedule = (index: number, field: keyof PaymentScheduleItem, value: any) => {
    const newSchedule = [...paymentSchedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setPaymentSchedule(newSchedule);
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const getScheduleTotal = () => {
    return paymentSchedule.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate items
      const validItems = items.filter(item => item.description && item.amount > 0);
      if (validItems.length === 0) {
        throw new Error('Please add at least one item');
      }

      // Validate payment schedule if used
      if (usePaymentSchedule) {
        const scheduleTotal = getScheduleTotal();
        const itemsTotal = getTotalAmount();
        if (Math.abs(scheduleTotal - itemsTotal) > 0.01) {
          throw new Error('Payment schedule total must match items total');
        }
      }

      const params: CreateInvoiceParams = {
        customerId,
        appointmentId,
        tattooRequestId,
        items: validItems,
        deliveryMethod,
        paymentSchedule: usePaymentSchedule ? paymentSchedule.filter(s => s.amount > 0) : undefined
      };

      const response = await paymentService.createInvoice(params);
      
      if (response.success) {
        setSuccess(true);
        setInvoiceUrl(response.data.publicUrl || null);
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
    setPaymentSchedule([
      { amount: 0, dueDate: '', type: 'DEPOSIT' },
      { amount: 0, dueDate: '', type: 'BALANCE' }
    ]);
    setUsePaymentSchedule(false);
    setDeliveryMethod('EMAIL');
    setError(null);
    setSuccess(false);
    setInvoiceUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Create Invoice</h2>
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

            <div className="space-y-6">
              {/* Invoice Items */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium">Invoice Items</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
                
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Description"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <div className="relative w-32">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.amount}
                          onChange={(e) => updateItem(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 text-right">
                  <p className="text-sm text-gray-600">
                    Total: <span className="font-semibold">${getTotalAmount().toFixed(2)}</span>
                  </p>
                </div>
              </div>

              {/* Payment Schedule */}
              <div>
                <label className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={usePaymentSchedule}
                    onChange={(e) => setUsePaymentSchedule(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Use Payment Schedule</span>
                </label>
                
                {usePaymentSchedule && (
                  <div className="space-y-3 pl-6">
                    {paymentSchedule.map((schedule, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <select
                          value={schedule.type}
                          onChange={(e) => updateSchedule(index, 'type', e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="DEPOSIT">Deposit</option>
                          <option value="BALANCE">Balance</option>
                        </select>
                        <div className="relative w-32">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={schedule.amount}
                            onChange={(e) => updateSchedule(index, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="relative flex-1">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="date"
                            value={schedule.dueDate}
                            onChange={(e) => updateSchedule(index, 'dueDate', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required={usePaymentSchedule}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Schedule Total: <span className="font-semibold">${getScheduleTotal().toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                {deliveryMethod === 'SHARE_MANUALLY' 
                  ? 'The invoice has been created. You can share it manually.'
                  : `The invoice has been sent via ${deliveryMethod.toLowerCase()}.`}
              </p>
            </div>

            {invoiceUrl && (
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <p className="text-xs text-gray-500 mb-2">Invoice URL:</p>
                <a 
                  href={invoiceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {invoiceUrl}
                </a>
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
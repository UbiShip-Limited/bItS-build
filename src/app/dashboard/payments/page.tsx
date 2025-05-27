'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Link, FileText, CreditCard, ExternalLink, Copy, Trash2, RefreshCw } from 'lucide-react';
import CreatePaymentLinkModal from '@/src/components/payments/CreatePaymentLinkModal';
import CreateInvoiceModal from '@/src/components/payments/CreateInvoiceModal';
import { paymentService, PaymentLink } from '@/src/lib/api/services/paymentService';

export default function PaymentsPage() {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPaymentLinks();
  }, []);

  const fetchPaymentLinks = async () => {
    try {
      setError(null);
      const response = await paymentService.listPaymentLinks({ limit: 50 });
      if (response.success) {
        setPaymentLinks(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payment links');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPaymentLinks();
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    // You could add a toast notification here
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment link?')) {
      return;
    }

    try {
      await paymentService.deletePaymentLink(id);
      setPaymentLinks(paymentLinks.filter(link => link.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete payment link');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
        <p className="text-gray-600 mt-1">Create and manage payment links and invoices</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => setShowPaymentLinkModal(true)}
          className="flex items-center justify-center gap-3 p-6 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <Link className="w-6 h-6 text-blue-600" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Create Payment Link</h3>
            <p className="text-sm text-gray-600">Quick payment collection</p>
          </div>
        </button>

        <button
          onClick={() => setShowInvoiceModal(true)}
          className="flex items-center justify-center gap-3 p-6 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
        >
          <FileText className="w-6 h-6 text-green-600" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Create Invoice</h3>
            <p className="text-sm text-gray-600">Detailed billing with schedules</p>
          </div>
        </button>

        <button
          className="flex items-center justify-center gap-3 p-6 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors opacity-50 cursor-not-allowed"
          disabled
        >
          <CreditCard className="w-6 h-6 text-purple-600" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Checkout Session</h3>
            <p className="text-sm text-gray-600">Coming soon</p>
          </div>
        </button>
      </div>

      {/* Payment Links Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Recent Payment Links</h2>
          <button
            onClick={handleRefresh}
            className={`p-2 text-gray-600 hover:bg-gray-100 rounded-md ${refreshing ? 'animate-spin' : ''}`}
            disabled={refreshing}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Loading payment links...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchPaymentLinks}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : paymentLinks.length === 0 ? (
          <div className="p-12 text-center">
            <Link className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No payment links created yet</p>
            <button
              onClick={() => setShowPaymentLinkModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create First Link
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{link.title || 'Untitled'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${link.amount?.toFixed(2) || '0.00'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        link.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {link.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(link.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                          title="Open link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => copyToClipboard(link.url)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Copy link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreatePaymentLinkModal
        isOpen={showPaymentLinkModal}
        onClose={() => setShowPaymentLinkModal(false)}
        customerId={selectedCustomerId || 'temp-customer-id'} // You'll need to implement customer selection
        onSuccess={(link) => {
          setPaymentLinks([link, ...paymentLinks]);
          setShowPaymentLinkModal(false);
        }}
      />

      <CreateInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        customerId={selectedCustomerId || 'temp-customer-id'} // You'll need to implement customer selection
        onSuccess={() => {
          setShowInvoiceModal(false);
        }}
      />
    </div>
  );
} 
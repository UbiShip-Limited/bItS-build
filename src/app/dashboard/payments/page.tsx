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
    <div>
      <div className="mb-8 pb-6 border-b-2 border-gray-200">
        <h1 className="text-3xl font-bold text-black mb-2">Payment Management</h1>
        <p className="text-gray-600 text-lg">Create and manage payment links and invoices</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => setShowPaymentLinkModal(true)}
          className="flex items-center justify-center gap-4 p-6 bg-white border-2 border-gray-300 rounded-lg hover:border-black hover:bg-gray-50 transition-all duration-200 transform hover:-translate-y-1 shadow-md"
        >
          <Link className="w-8 h-8 text-black" />
          <div className="text-left">
            <h3 className="font-semibold text-black text-lg">Create Payment Link</h3>
            <p className="text-sm text-gray-600 mt-1">Quick payment collection</p>
          </div>
        </button>

        <button
          onClick={() => setShowInvoiceModal(true)}
          className="flex items-center justify-center gap-4 p-6 bg-white border-2 border-gray-300 rounded-lg hover:border-black hover:bg-gray-50 transition-all duration-200 transform hover:-translate-y-1 shadow-md"
        >
          <FileText className="w-8 h-8 text-black" />
          <div className="text-left">
            <h3 className="font-semibold text-black text-lg">Create Invoice</h3>
            <p className="text-sm text-gray-600 mt-1">Detailed billing with schedules</p>
          </div>
        </button>

        <button
          className="flex items-center justify-center gap-4 p-6 bg-white border-2 border-gray-300 rounded-lg opacity-50 cursor-not-allowed shadow-md"
          disabled
        >
          <CreditCard className="w-8 h-8 text-gray-400" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-400 text-lg">Checkout Session</h3>
            <p className="text-sm text-gray-400 mt-1">Coming soon</p>
          </div>
        </button>
      </div>

      {/* Payment Links Table */}
      <div className="bg-white border-2 border-gray-200 rounded-lg shadow-md hover:border-black transition-colors duration-200">
        <div className="px-6 py-4 border-b-2 border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-black">Recent Payment Links</h2>
          <button
            onClick={handleRefresh}
            className={`p-2 text-black hover:bg-gray-100 rounded-lg border border-gray-300 hover:border-black transition-colors duration-200 ${refreshing ? 'animate-spin' : ''}`}
            disabled={refreshing}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <p className="mt-2 text-gray-600">Loading payment links...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="bg-white border-2 border-red-300 text-red-600 px-6 py-4 rounded-lg inline-block">
              <p className="font-medium">{error}</p>
              <button
                onClick={fetchPaymentLinks}
                className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        ) : paymentLinks.length === 0 ? (
          <div className="p-12 text-center">
            <Link className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium mb-4">No payment links created yet</p>
            <button
              onClick={() => setShowPaymentLinkModal(true)}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
            >
              Create First Link
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y-2 divide-black">
              <thead className="bg-black">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
                      <div className="text-sm font-semibold text-black">{link.title || 'Untitled'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
                      <div className="text-sm font-medium text-black">${link.amount?.toFixed(2) || '0.00'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                        link.status === 'active' 
                          ? 'bg-black text-white border-black' 
                          : 'bg-gray-100 text-black border-gray-300'
                      }`}>
                        {link.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-medium border-r border-gray-100">
                      {formatDate(link.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black hover:text-gray-600 p-1"
                          title="Open link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => copyToClipboard(link.url)}
                          className="text-black hover:text-gray-600 p-1"
                          title="Copy link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="text-red-600 hover:text-red-800 p-1"
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
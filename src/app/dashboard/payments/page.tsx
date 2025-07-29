'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, FileText, CreditCard, ExternalLink, Copy, Trash2, RefreshCw, User, DollarSign, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import CreatePaymentLinkModal from '@/src/components/payments/CreatePaymentLinkModal';
import CreateInvoiceModal from '@/src/components/payments/CreateInvoiceModal';
import CustomerPaymentHistory from '@/src/components/payments/CustomerPaymentHistory';
import { paymentService, PaymentLink } from '@/src/lib/api/services/paymentService';

export default function PaymentsPage() {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'links' | 'history'>('links');
  
  // Use ref to track fetching state without causing dependency issues
  const fetchingDataRef = useRef(false);
  const hasInitialLoadRef = useRef(false);

  const fetchPaymentLinks = useCallback(async () => {
    if (fetchingDataRef.current) {
      console.log('⏳ Already fetching payment links, skipping...');
      return;
    }

    fetchingDataRef.current = true;
    try {
      setError(null);
      const response = await paymentService.listPaymentLinks({ limit: 50 });
      if (response.success) {
        setPaymentLinks(response.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment links');
    } finally {
      setLoading(false);
      setRefreshing(false);
      fetchingDataRef.current = false;
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const response = await paymentService.getPayments({ limit: 20 });
      if (response.success) {
        setPayments(response.data);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch payments:', err);
    }
  }, []);

  const fetchPaymentStats = useCallback(async () => {
    try {
      const response = await fetch('/api/payments/stats', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentStats(data.data);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch payment stats:', err);
    }
  }, []);

  useEffect(() => {
    if (!hasInitialLoadRef.current) {
      hasInitialLoadRef.current = true;
      fetchPaymentLinks();
      fetchPayments();
      fetchPaymentStats();
    }
  }, [fetchPaymentLinks, fetchPayments, fetchPaymentStats]);

  const handleRefresh = () => {
    if (fetchingDataRef.current) {
      console.log('⏳ Refresh already in progress, skipping...');
      return;
    }
    setRefreshing(true);
    fetchPaymentLinks();
    fetchPayments();
    fetchPaymentStats();
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    // You could add a toast notification here
  };

  const handleDeleteLink = async (id: string) => {
    if (fetchingDataRef.current) {
      alert('Please wait for the current operation to complete.');
      return;
    }

    if (!confirm('Are you sure you want to delete this payment link?')) {
      return;
    }

    try {
      await paymentService.deletePaymentLink(id);
      setPaymentLinks(paymentLinks.filter(link => link.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete payment link');
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed':
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'refunded':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div>
      <div className="mb-8 pb-6 border-b border-[#1a1a1a]">
        <h1 className="text-3xl font-heading font-bold text-white mb-2 tracking-wide">Payment Management</h1>
        <p className="text-gray-400 text-lg">Create and manage payment links, invoices, and view payment history</p>
      </div>

      {/* Payment Statistics */}
      {paymentStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-6 hover:border-[#C9A449]/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Payments</p>
                <p className="text-2xl font-bold text-white mt-1">{paymentStats.overview.totalPayments}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#C9A449] opacity-50" />
            </div>
          </div>

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-6 hover:border-[#C9A449]/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Customers</p>
                <p className="text-2xl font-bold text-white mt-1">{paymentStats.overview.totalCustomersWithPayments}</p>
              </div>
              <User className="w-8 h-8 text-[#C9A449] opacity-50" />
            </div>
          </div>

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-6 hover:border-[#C9A449]/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  {paymentStats.statusBreakdown.find((s: any) => s.status === 'completed')?.count || 0}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </div>

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-6 hover:border-[#C9A449]/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">
                  {paymentStats.statusBreakdown.find((s: any) => s.status === 'pending')?.count || 0}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => setShowPaymentLinkModal(true)}
          className="flex items-center justify-center gap-4 p-6 bg-[#111111] border border-[#1a1a1a] rounded-2xl hover:border-[#C9A449]/20 hover:bg-[#111111] transition-all duration-300 transform hover:-translate-y-1 shadow-2xl hover:shadow-[#C9A449]/10"
        >
          <Link className="w-8 h-8 text-[#C9A449]" />
          <div className="text-left">
            <h3 className="font-semibold text-white text-lg">Create Payment Link</h3>
            <p className="text-sm text-gray-400 mt-1">Quick payment collection</p>
          </div>
        </button>

        <button
          onClick={() => setShowInvoiceModal(true)}
          className="flex items-center justify-center gap-4 p-6 bg-[#111111] border border-[#1a1a1a] rounded-2xl hover:border-[#C9A449]/20 hover:bg-[#111111] transition-all duration-300 transform hover:-translate-y-1 shadow-2xl hover:shadow-[#C9A449]/10"
        >
          <FileText className="w-8 h-8 text-[#C9A449]" />
          <div className="text-left">
            <h3 className="font-semibold text-white text-lg">Create Invoice</h3>
            <p className="text-sm text-gray-400 mt-1">Detailed billing with schedules</p>
          </div>
        </button>

        <button
          className="flex items-center justify-center gap-4 p-6 bg-[#111111] border border-[#1a1a1a] rounded-2xl opacity-50 cursor-not-allowed shadow-2xl"
          disabled
        >
          <CreditCard className="w-8 h-8 text-gray-600" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-600 text-lg">Checkout Session</h3>
            <p className="text-sm text-gray-600 mt-1">Coming soon</p>
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('links')}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
            activeTab === 'links'
              ? 'bg-[#C9A449] text-[#080808] shadow-lg shadow-[#C9A449]/20'
              : 'bg-[#111111] text-gray-400 border border-[#1a1a1a] hover:border-[#C9A449]/20'
          }`}
        >
          Payment Links
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
            activeTab === 'history'
              ? 'bg-[#C9A449] text-[#080808] shadow-lg shadow-[#C9A449]/20'
              : 'bg-[#111111] text-gray-400 border border-[#1a1a1a] hover:border-[#C9A449]/20'
          }`}
        >
          Payment History
        </button>
      </div>

      {/* Payment Links Table */}
      {activeTab === 'links' && (
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl shadow-2xl hover:border-[#C9A449]/20 transition-all duration-300 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1a1a1a] flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Recent Payment Links</h2>
            <button
              onClick={handleRefresh}
              className={`p-2 text-[#C9A449] hover:bg-[#C9A449]/10 rounded-lg border border-[#C9A449]/30 hover:border-[#C9A449]/50 transition-all duration-300 ${refreshing ? 'animate-spin' : ''}`}
              disabled={refreshing}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <span className="loading loading-spinner loading-lg text-[#C9A449]"></span>
              <p className="mt-2 text-gray-400">Loading payment links...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-lg inline-block">
                <p className="font-medium">{error}</p>
                <button
                  onClick={fetchPaymentLinks}
                  className="mt-4 px-6 py-2 bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] rounded-lg font-medium shadow-lg shadow-[#C9A449]/20"
                  disabled={refreshing}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : paymentLinks.length === 0 ? (
            <div className="p-12 text-center">
              <Link className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg font-medium mb-4">No payment links created yet</p>
              <button
                onClick={() => setShowPaymentLinkModal(true)}
                className="px-6 py-2 bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] rounded-lg font-medium shadow-lg shadow-[#C9A449]/20"
              >
                Create First Link
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#080808]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Payment Link
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {paymentLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-[#1a1a1a]/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-white">{link.title || 'Untitled'}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          ID: {link.id.slice(-6)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>Customer ID in link</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Click &ldquo;View&rdquo; to see details
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#C9A449]">{formatCurrency(link.amount || 0)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(link.status || 'active')}`}>
                          {link.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-medium">
                        {formatDate(link.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-3">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#C9A449] hover:text-[#E5B563] p-1 transition-colors"
                            title="Open link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => copyToClipboard(link.url)}
                            className="text-gray-400 hover:text-white p-1 transition-colors"
                            title="Copy link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            className="text-red-400 hover:text-red-300 p-1 transition-colors"
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
      )}

      {/* Payment History Table */}
      {activeTab === 'history' && (
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl shadow-2xl hover:border-[#C9A449]/20 transition-all duration-300 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1a1a1a] flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">All Payments</h2>
            <button
              onClick={handleRefresh}
              className={`p-2 text-[#C9A449] hover:bg-[#C9A449]/10 rounded-lg border border-[#C9A449]/30 hover:border-[#C9A449]/50 transition-all duration-300 ${refreshing ? 'animate-spin' : ''}`}
              disabled={refreshing}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {payments.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg font-medium mb-2">No payment history yet</p>
              <p className="text-gray-500 text-sm">Payments will appear here once they are processed through Square</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#080808]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Payment ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Square
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-[#1a1a1a]/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-400">
                          {payment.id.slice(-8).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {payment.customer?.name || 'Unknown'}
                        </div>
                        {payment.customer?.email && (
                          <div className="text-xs text-gray-400">{payment.customer.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#C9A449]">
                          {formatCurrency(payment.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {payment.paymentType || 'payment'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {payment.paymentMethod || 'unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.squareId ? (
                          <span className="text-xs text-green-400">✓ Synced</span>
                        ) : (
                          <span className="text-xs text-gray-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Customer Payment History Section */}
      {selectedCustomerId && (
        <div className="mt-8">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden hover:border-[#C9A449]/20 transition-all duration-300">
            <div className="px-6 py-4 border-b border-[#1a1a1a] flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Customer Payment Context</h2>
              <button
                onClick={() => setSelectedCustomerId('')}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-6">
              <CustomerPaymentHistory
                customerId={selectedCustomerId}
                customerName={selectedCustomerName}
                variant="full"
                showTitle={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreatePaymentLinkModal
        isOpen={showPaymentLinkModal}
        onClose={() => setShowPaymentLinkModal(false)}
        customerId={selectedCustomerId || 'temp-customer-id'} // You'll need to implement customer selection
        onSuccess={(link) => {
          setPaymentLinks([link, ...paymentLinks]);
          setShowPaymentLinkModal(false);
          handleRefresh();
        }}
      />

      <CreateInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        customerId={selectedCustomerId || 'temp-customer-id'} // You'll need to implement customer selection
        onSuccess={() => {
          setShowInvoiceModal(false);
          handleRefresh();
        }}
      />
    </div>
  );
}
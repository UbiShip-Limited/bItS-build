'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link, FileText, CreditCard, ExternalLink, Copy, Trash2, RefreshCw, User, DollarSign, Calendar, TrendingUp, AlertCircle, Bell, Clock, Zap, Search, Download, Filter } from 'lucide-react';
import CreatePaymentLinkModal from '@/src/components/payments/CreatePaymentLinkModal';
import CreateInvoiceModal from '@/src/components/payments/CreateInvoiceModal';
import QuickCollectModal from '@/src/components/payments/QuickCollectModal';
import CustomerPaymentHistory from '@/src/components/payments/CustomerPaymentHistory';
import CustomerSelector from '@/src/components/dashboard/CustomerSelector';
import { paymentService, PaymentLink } from '@/src/lib/api/services/paymentService';
import type { Customer } from '@/src/lib/api/services/customerService';
import { apiClient } from '@/src/lib/api/apiClient';
import { toast } from '@/src/lib/toast';

export default function PaymentsPage() {
  const searchParams = useSearchParams();
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showQuickCollectModal, setShowQuickCollectModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'links' | 'history'>('links');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'refunded'>('all');
  
  // Use ref to track fetching state without causing dependency issues
  const fetchingDataRef = useRef(false);
  const hasInitialLoadRef = useRef(false);
  const eventSourceRef = useRef<EventSource | null>(null);

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
      const response = await apiClient.get<{ success: boolean; data: any }>('/payments/stats');
      if (response.success) {
        setPaymentStats(response.data);
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
      
      // Check if we should open the payment link modal from query params
      const action = searchParams.get('action');
      if (action === 'new-link') {
        // Small delay to ensure the page is loaded before opening modal
        setTimeout(() => {
          setShowPaymentLinkModal(true);
        }, 100);
      }
    }
  }, [fetchPaymentLinks, fetchPayments, fetchPaymentStats, searchParams]);
  
  // Set up real-time payment notifications
  useEffect(() => {
    // Connect to SSE endpoint for real-time updates
    const connectToSSE = () => {
      try {
        // Check if we're in a browser environment and the API is available
        if (typeof window === 'undefined') return;
        
        const eventSource = new EventSource('/api/events', {
          withCredentials: true
        });
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'payment_completed') {
              // Show notification
              toast.success(
                `Payment Received! ${data.data.customerName} - $${data.data.amount.toFixed(2)}`
              );
              
              // Refresh payment data
              fetchPaymentLinks();
              fetchPayments();
              fetchPaymentStats();
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        };
        
        eventSource.onerror = () => {
          // Silently close - SSE endpoint might not be available yet
          eventSource.close();
          eventSourceRef.current = null;
          // Don't reconnect for now - SSE endpoint needs to be implemented
        };
        
        eventSourceRef.current = eventSource;
      } catch (error) {
        // Silently fail - SSE is optional enhancement
        console.log('SSE not available - real-time updates disabled');
      }
    };
    
    // Only connect if the backend SSE is available
    // For now, commenting out until SSE endpoint is implemented
    // connectToSSE();
    
    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
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
        <h1 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-2 tracking-wide">Payment Management</h1>
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

      {/* Enhanced Customer Context Bar */}
      <div className="mb-6 p-4 bg-[#111111] border border-[#1a1a1a] rounded-2xl hover:border-[#C9A449]/20 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#C9A449]" />
            <label className="text-sm font-medium text-gray-300">
              Customer Context
            </label>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
              Optional but recommended
            </span>
          </div>
          {selectedCustomer && (
            <button
              onClick={() => {
                setSelectedCustomerId('');
                setSelectedCustomerName('');
                setSelectedCustomer(null);
              }}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear Selection
            </button>
          )}
        </div>
        <CustomerSelector
          value={selectedCustomerId}
          onChange={(customerId, customer) => {
            setSelectedCustomerId(customerId || '');
            setSelectedCustomerName(customer?.name || '');
            setSelectedCustomer(customer || null);
          }}
          placeholder="Search customers by name, email, or phone..."
        />
        {selectedCustomer && (
          <div className="mt-3 p-3 bg-gold-500/10 border border-gold-500/30 rounded-lg">
            <p className="text-sm text-white">
              Selected: <span className="font-medium text-[#C9A449]">{selectedCustomer.name}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Payment links and invoices will be associated with this customer
            </p>
          </div>
        )}
        {!selectedCustomer && (
          <p className="text-xs text-gray-500 mt-2">
            💡 Select a customer to track payments, or use quick create in the payment modal for walk-ins
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <button
          onClick={() => setShowQuickCollectModal(true)}
          className="flex items-center justify-center gap-4 p-6 bg-gradient-to-r from-[#C9A449]/20 to-[#C9A449]/10 border border-[#C9A449]/30 rounded-2xl transition-all duration-300 transform shadow-2xl hover:border-[#C9A449]/50 hover:-translate-y-1 hover:shadow-[#C9A449]/20"
        >
          <Zap className="w-8 h-8 text-[#C9A449]" />
          <div className="text-left">
            <h3 className="font-semibold text-white text-lg">Quick Collect</h3>
            <p className="text-sm text-[#C9A449] mt-1">Walk-in payment</p>
          </div>
        </button>
        <button
          onClick={() => setShowPaymentLinkModal(true)}
          className="flex items-center justify-center gap-4 p-6 bg-[#111111] border border-[#1a1a1a] rounded-2xl transition-all duration-300 transform shadow-2xl hover:border-[#C9A449]/20 hover:bg-[#111111] hover:-translate-y-1 hover:shadow-[#C9A449]/10"
        >
          <Link className="w-8 h-8 text-[#C9A449]" />
          <div className="text-left">
            <h3 className="font-semibold text-white text-lg">Payment Link</h3>
            <p className="text-sm text-gray-400 mt-1">
              {selectedCustomer ? `For ${selectedCustomer.name}` : 'Any customer'}
            </p>
          </div>
        </button>

        <button
          onClick={() => {
            if (!selectedCustomer) {
              alert('Please select a customer for invoices');
              return;
            }
            setShowInvoiceModal(true);
          }}
          className={`flex items-center justify-center gap-4 p-6 bg-[#111111] border border-[#1a1a1a] rounded-2xl transition-all duration-300 transform shadow-2xl ${
            selectedCustomer 
              ? 'hover:border-[#C9A449]/20 hover:bg-[#111111] hover:-translate-y-1 hover:shadow-[#C9A449]/10' 
              : 'opacity-50 cursor-not-allowed'
          }`}
          disabled={!selectedCustomer}
        >
          <FileText className="w-8 h-8 text-[#C9A449]" />
          <div className="text-left">
            <h3 className="font-semibold text-white text-lg">Create Invoice</h3>
            <p className="text-sm text-gray-400 mt-1">Formal billing (requires customer)</p>
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

      {/* Filters and Search Bar */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-4 mb-6 hover:border-[#C9A449]/20 transition-all duration-300">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers, amounts, or reference IDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#080808] border border-[#1a1a1a] rounded-lg text-white placeholder-gray-500 focus:border-[#C9A449]/50 focus:outline-none"
            />
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-4 py-2 bg-[#080808] border border-[#1a1a1a] rounded-lg text-white focus:border-[#C9A449]/50 focus:outline-none"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 bg-[#080808] border border-[#1a1a1a] rounded-lg text-white focus:border-[#C9A449]/50 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Export Button */}
          <button
            onClick={async () => {
              try {
                // Use the new getBlob method for blob response
                const blob = await apiClient.getBlob('/payments/export');
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success('Payments exported successfully!');
              } catch (error) {
                toast.error('Failed to export payments');
                console.error('Export error:', error);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A449]/10 hover:bg-[#C9A449]/20 text-[#C9A449] border border-[#C9A449]/30 rounded-lg transition-all duration-300"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
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
              <p className="text-gray-500 text-sm mb-6">Use the "Create Payment Link" button above to get started</p>
              <button
                onClick={() => setShowPaymentLinkModal(true)}
                className="px-6 py-2 bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] rounded-lg font-medium shadow-lg shadow-[#C9A449]/20"
              >
                Create Your First Link
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
                        <div className="text-sm text-white flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span>{link.customer?.name || 'Unknown Customer'}</span>
                        </div>
                        {link.customer?.email && (
                          <div className="text-xs text-gray-500">
                            {link.customer.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#C9A449]">{formatCurrency(link.amount || 0)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(link.status || 'active')}`}>
                            {link.status || 'Active'}
                          </span>
                          {link.status === 'active' && (link as any).enableReminders && (
                            <div className="flex items-center gap-1" title={`Reminders: ${(link as any).reminderCount || 0}/3 sent`}>
                              <Clock className="w-3 h-3 text-yellow-400" />
                              <span className="text-xs text-yellow-400">
                                {(link as any).reminderCount || 0}/3
                              </span>
                            </div>
                          )}
                        </div>
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
      <QuickCollectModal
        isOpen={showQuickCollectModal}
        onClose={() => setShowQuickCollectModal(false)}
        onSuccess={() => {
          setShowQuickCollectModal(false);
          handleRefresh();
        }}
      />

      <CreatePaymentLinkModal
        isOpen={showPaymentLinkModal}
        onClose={() => setShowPaymentLinkModal(false)}
        customerId={selectedCustomerId}
        customerName={selectedCustomerName}
        onSuccess={(link) => {
          setPaymentLinks([link, ...paymentLinks]);
          setShowPaymentLinkModal(false);
          handleRefresh();
        }}
      />

      <CreateInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        customerId={selectedCustomerId}
        onSuccess={() => {
          setShowInvoiceModal(false);
          handleRefresh();
        }}
      />
    </div>
  );
}
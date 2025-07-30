'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Filter, FileText, User, Calendar, DollarSign, UserPlus } from 'lucide-react';
import { TattooRequestApiClient, type TattooRequest } from '@/src/lib/api/services/tattooRequestApiClient';
import { apiClient } from '@/src/lib/api/apiClient';
import QuickPaymentActions from '@/src/components/payments/QuickPaymentActions';
import CustomerPaymentHistory from '@/src/components/payments/CustomerPaymentHistory';
import Modal from '@/src/components/ui/Modal';
import CustomerForm from '@/src/components/forms/CustomerForm';

export default function TattooRequestsPage() {
  const [requests, setRequests] = useState<TattooRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [selectedRequestForCustomer, setSelectedRequestForCustomer] = useState<TattooRequest | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 20
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 1
  });

  // Memoize the client to prevent recreation on every render
  const tattooRequestClient = useMemo(() => new TattooRequestApiClient(apiClient), []);

  const loadTattooRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tattooRequestClient.getAll({
        status: filters.status || undefined,
        page: filters.page,
        limit: filters.limit
      });
      
      setRequests(response.data);
      setPagination(response.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load tattoo requests');
    } finally {
      setLoading(false);
    }
  }, [tattooRequestClient, filters.status, filters.page, filters.limit]);

  useEffect(() => {
    loadTattooRequests();
  }, [loadTattooRequests]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-[#C9A449]/20 text-[#C9A449] border-[#C9A449]/30',
      'reviewed': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'approved': 'bg-green-500/20 text-green-400 border-green-500/30',
      'rejected': 'bg-red-500/20 text-red-400 border-red-500/30',
      'deposit_paid': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'in_progress': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'completed': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleCreateCustomerClick = (request: TattooRequest) => {
    setSelectedRequestForCustomer(request);
    setShowCreateCustomerModal(true);
  };

  const handleCustomerCreated = () => {
    setShowCreateCustomerModal(false);
    setSelectedRequestForCustomer(null);
    // Refresh the requests to show the updated customer info
    loadTattooRequests();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-[#1a1a1a]">
        <div>
          <h1 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-2 tracking-wide">Tattoo Requests</h1>
          <p className="text-gray-400 text-lg">Manage all tattoo requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl shadow-2xl p-6 mb-6 hover:border-[#C9A449]/20 transition-all duration-300">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#1a1a1a]">
          <Filter className="w-5 h-5 text-[#C9A449]" />
          <span className="font-semibold text-white text-lg">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
            <select 
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="block w-full px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg focus:border-[#C9A449]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A449]/20 text-white transition-all duration-300"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', page: 1, limit: 20 })}
              className="w-full px-3 py-2 border border-[#1a1a1a] text-gray-400 rounded-lg hover:border-[#C9A449]/30 hover:bg-[#1a1a1a]/50 hover:text-white font-medium transition-all duration-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tattoo Requests Table */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden hover:border-[#C9A449]/20 transition-all duration-300">
        {loading ? (
          <div className="p-8 text-center">
            <span className="loading loading-spinner loading-lg text-[#C9A449]"></span>
            <p className="mt-2 text-gray-400">Loading tattoo requests...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-lg">
              <p className="font-medium">{error}</p>
              <button 
                onClick={loadTattooRequests}
                className="mt-4 px-6 py-2 bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] rounded-lg font-medium shadow-lg shadow-[#C9A449]/20"
              >
                Retry
              </button>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-lg font-medium">No tattoo requests found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-[#080808]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Request
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Style
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-[#1a1a1a]/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-[#1a1a1a] rounded overflow-hidden border border-[#2a2a2a]">
                            {request.referenceImages && request.referenceImages.length > 0 ? (
                              <Image 
                                src={request.referenceImages[0].url} 
                                alt="Reference" 
                                width={40}
                                height={40}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[#C9A449]">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-white">
                              Request #{request.id.slice(-6)}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(request.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-300">
                          {request.customer ? (
                            <>
                              <User className="w-3 h-3 inline mr-1" />
                              {request.customer.name}
                            </>
                          ) : (
                            'Anonymous'
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.customer?.email || request.contactEmail || 'No email'}
                        </div>
                        {!request.customer && (request.contactEmail || request.contactPhone) && (
                          <button
                            onClick={() => handleCreateCustomerClick(request)}
                            className="mt-2 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#C9A449] hover:text-[#E5B563] bg-[#C9A449]/10 hover:bg-[#C9A449]/20 border border-[#C9A449]/30 hover:border-[#C9A449]/50 rounded-lg transition-all duration-300"
                          >
                            <UserPlus className="w-3 h-3" />
                            Create Customer
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-300 max-w-xs truncate">
                          {request.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.placement} • {request.size}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full border ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-medium">
                        {request.style || 'Not specified'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-medium">
                        <div className="space-y-2">
                          {/* Quick payment actions */}
                          {request.customer && (
                            <QuickPaymentActions
                              customerId={request.customer.id}
                              customerName={request.customer.name}
                              tattooRequestId={request.id}
                              requestStatus={request.status}
                              depositPaid={request.depositPaid}
                              variant="compact"
                              onPaymentCreated={() => {
                                // Refresh requests when payment is created
                                loadTattooRequests();
                              }}
                            />
                          )}
                          
                          {/* Show deposit status if exists */}
                          {request.depositPaid && request.depositAmount && (
                            <div className="text-xs text-green-400 flex items-center">
                              <DollarSign className="w-3 h-3 mr-1" />
                              ${request.depositAmount.toFixed(0)} paid
                            </div>
                          )}
                          
                          {/* Inline payment history */}
                          {request.customer && (
                            <CustomerPaymentHistory
                              customerId={request.customer.id}
                              variant="inline"
                              className="mt-1"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          href={`/dashboard/tattoo-request/${request.id}`} 
                          className="text-[#C9A449] hover:text-[#E5B563] font-medium px-2 py-1 transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="bg-[#080808] border-t border-[#1a1a1a] px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 font-medium">
                    Showing <span className="font-bold text-white">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="font-bold text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                    <span className="font-bold text-white">{pagination.total}</span> results
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="px-4 py-2 border border-[#1a1a1a] bg-[#111111] text-gray-400 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a1a1a] hover:text-white font-medium transition-all duration-300"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-white">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page === pagination.pages}
                    className="px-4 py-2 border border-[#1a1a1a] bg-[#111111] text-gray-400 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a1a1a] hover:text-white font-medium transition-all duration-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Customer Modal */}
      <Modal
        isOpen={showCreateCustomerModal}
        onClose={() => {
          setShowCreateCustomerModal(false);
          setSelectedRequestForCustomer(null);
        }}
        title="Create Customer Profile"
      >
        <CustomerForm
          tattooRequestId={selectedRequestForCustomer?.id}
          fromTattooRequest={true}
          onSuccess={handleCustomerCreated}
          onCancel={() => {
            setShowCreateCustomerModal(false);
            setSelectedRequestForCustomer(null);
          }}
        />
      </Modal>
    </div>
  );
}

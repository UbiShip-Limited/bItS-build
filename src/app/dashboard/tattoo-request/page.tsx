'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Filter, FileText, User, Calendar, DollarSign, UserPlus, Palette } from 'lucide-react';
import { TattooRequestApiClient, type TattooRequest } from '@/src/lib/api/services/tattooRequestApiClient';
import { apiClient } from '@/src/lib/api/apiClient';
import QuickPaymentActions from '@/src/components/payments/QuickPaymentActions';
import CustomerPaymentHistory from '@/src/components/payments/CustomerPaymentHistory';
import Modal from '@/src/components/ui/Modal';
import CustomerForm from '@/src/components/forms/CustomerForm';
import { DashboardPageLayout } from '../components/DashboardPageLayout';
import { DashboardCard } from '../components/DashboardCard';
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';

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
    const statusColors: Record<string, string> = {
      'new': `bg-gold-500/20 ${colors.textAccent} ${colors.borderDefault}`,
      'reviewed': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'approved': 'bg-green-500/20 text-green-400 border-green-500/30',
      'rejected': 'bg-red-500/20 text-red-400 border-red-500/30',
      'deposit_paid': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'in_progress': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'completed': `bg-white/10 ${colors.textSecondary} ${colors.borderSubtle}`
    };
    return statusColors[status] || `bg-white/10 ${colors.textSecondary} ${colors.borderSubtle}`;
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
    <DashboardPageLayout
      title="Tattoo Requests"
      description="Manage all tattoo requests"
      breadcrumbs={[{ label: 'Tattoo Requests' }]}
    >

      {/* Filters */}
      <DashboardCard
        title="Filters"
        className="mb-6"
      >
        <div className="flex items-center gap-2">
          <Filter className={`w-5 h-5 ${colors.textAccent}`} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className={`block ${typography.textSm} ${typography.fontMedium} ${colors.textSecondary} mb-2`}>Status</label>
            <select 
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className={`${components.input}`}
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div className="flex items-end sm:col-span-2 md:col-span-1">
            <button
              onClick={() => setFilters({ status: '', page: 1, limit: 20 })}
              className={`w-full ${components.button.base} ${components.button.sizes.medium} ${components.button.variants.secondary}`}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </DashboardCard>

      {/* Tattoo Requests Table */}
      <DashboardCard
        title="All Requests"
        subtitle={`Total: ${pagination.total} requests`}
        noPadding
      >
        {loading ? (
          <div className="p-8 text-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${colors.borderDefault} mx-auto mb-4`}></div>
            <p className={`${colors.textSecondary}`}>Loading tattoo requests...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className={`bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 ${components.radius.medium}`}>
              <p className={`${typography.fontMedium}`}>{error}</p>
              <button 
                onClick={loadTattooRequests}
                className={`mt-4 ${components.button.base} ${components.button.sizes.medium} ${components.button.variants.primary}`}
              >
                Retry
              </button>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className={`w-12 h-12 mx-auto mb-4 ${colors.textMuted}`} />
            <p className={`${typography.textLg} ${typography.fontMedium} ${colors.textSecondary}`}>No tattoo requests found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-obsidian/50">
                  <tr>
                    <th className={`px-6 py-4 text-left ${typography.textXs} ${typography.fontMedium} ${colors.textSecondary} uppercase ${typography.trackingWide}`}>
                      Request
                    </th>
                    <th className={`px-6 py-4 text-left ${typography.textXs} ${typography.fontMedium} ${colors.textSecondary} uppercase ${typography.trackingWide}`}>
                      Contact
                    </th>
                    <th className={`px-6 py-4 text-left ${typography.textXs} ${typography.fontMedium} ${colors.textSecondary} uppercase ${typography.trackingWide}`}>
                      Details
                    </th>
                    <th className={`px-6 py-4 text-left ${typography.textXs} ${typography.fontMedium} ${colors.textSecondary} uppercase ${typography.trackingWide}`}>
                      Status
                    </th>
                    <th className={`px-6 py-4 text-left ${typography.textXs} ${typography.fontMedium} ${colors.textSecondary} uppercase ${typography.trackingWide}`}>
                      Style
                    </th>
                    <th className={`px-6 py-4 text-left ${typography.textXs} ${typography.fontMedium} ${colors.textSecondary} uppercase ${typography.trackingWide}`}>
                      Payment
                    </th>
                    <th className={`px-6 py-4 text-right ${typography.textXs} ${typography.fontMedium} ${colors.textSecondary} uppercase ${typography.trackingWide}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-gold-500/10`}>
                  {requests.map((request) => (
                    <tr key={request.id} className={`hover:bg-white/5 ${effects.transitionNormal}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 bg-obsidian/50 rounded overflow-hidden border ${colors.borderSubtle}`}>
                            {request.referenceImages && request.referenceImages.length > 0 ? (
                              <Image 
                                src={request.referenceImages[0].url} 
                                alt="Reference" 
                                width={40}
                                height={40}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className={`h-full w-full flex items-center justify-center ${colors.textAccent}`}>
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className={`${typography.textSm} ${typography.fontSemibold} ${colors.textPrimary}`}>
                              Request #{request.id.slice(-6)}
                            </div>
                            <div className={`${typography.textSm} ${colors.textMuted} flex items-center`}>
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(request.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`${typography.textSm} ${typography.fontMedium} ${colors.textSecondary}`}>
                          {request.customer ? (
                            <>
                              <User className="w-3 h-3 inline mr-1" />
                              {request.customer.name}
                            </>
                          ) : (
                            'Anonymous'
                          )}
                        </div>
                        <div className={`${typography.textSm} ${colors.textMuted}`}>
                          {request.customer?.email || request.contactEmail || 'No email'}
                        </div>
                        {!request.customer && (request.contactEmail || request.contactPhone) && (
                          <button
                            onClick={() => handleCreateCustomerClick(request)}
                            className="mt-2 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gold-500 hover:text-gold-400 bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 hover:border-gold-500/50 rounded-lg transition-all duration-300"
                          >
                            <UserPlus className="w-3 h-3" />
                            Create Customer
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`${typography.textSm} ${typography.fontMedium} ${colors.textSecondary} max-w-xs truncate`}>
                          {request.description}
                        </div>
                        <div className={`${typography.textSm} ${colors.textMuted}`}>
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
                      <td className={`px-6 py-4 whitespace-nowrap ${typography.textSm} ${colors.textSecondary} ${typography.fontMedium}`}>
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
                      <td className={`px-6 py-4 whitespace-nowrap text-right ${typography.textSm} ${typography.fontMedium}`}>
                        <Link 
                          href={`/dashboard/tattoo-request/${request.id}`} 
                          className={`${colors.textAccent} hover:${colors.textAccentProminent} ${typography.fontMedium} px-2 py-1 ${effects.transitionNormal}`}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="grid lg:hidden gap-4 p-4">
              {requests.map((request) => (
                <div key={request.id} className={`${components.card} p-4 hover:shadow-lg ${effects.transitionNormal}`}>
                  {/* Card Header with Image and Basic Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 h-12 w-12 bg-obsidian/50 rounded-lg overflow-hidden border ${colors.borderSubtle}`}>
                        {request.referenceImages && request.referenceImages.length > 0 ? (
                          <Image 
                            src={request.referenceImages[0].url} 
                            alt="Reference" 
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className={`h-full w-full flex items-center justify-center ${colors.textAccent}`}>
                            <FileText className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className={`${typography.fontSemibold} ${colors.textPrimary}`}>
                          Request #{request.id.slice(-6)}
                        </div>
                        <div className={`${typography.textSm} ${colors.textMuted} flex items-center`}>
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(request.createdAt)}
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full border ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className={`mb-4 pb-4 border-b ${colors.borderSubtle}`}>
                    <div className={`${typography.fontMedium} ${colors.textSecondary} mb-1`}>
                      {request.customer ? (
                        <>
                          <User className="w-4 h-4 inline mr-1" />
                          {request.customer.name}
                        </>
                      ) : (
                        'Anonymous'
                      )}
                    </div>
                    <div className={`${typography.textSm} ${colors.textMuted}`}>
                      {request.customer?.email || request.contactEmail || 'No email'}
                    </div>
                    {!request.customer && (request.contactEmail || request.contactPhone) && (
                      <button
                        onClick={() => handleCreateCustomerClick(request)}
                        className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gold-500 hover:text-gold-400 bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 hover:border-gold-500/50 rounded-lg transition-all duration-300"
                      >
                        <UserPlus className="w-3 h-3" />
                        Create Customer
                      </button>
                    )}
                  </div>

                  {/* Tattoo Details */}
                  <div className={`mb-4 pb-4 border-b ${colors.borderSubtle}`}>
                    <div className={`${typography.textSm} ${colors.textSecondary} mb-2`}>
                      {request.description}
                    </div>
                    <div className={`${typography.textSm} ${colors.textMuted} flex items-center gap-3`}>
                      <span className="flex items-center">
                        <Palette className="w-3 h-3 mr-1" />
                        {request.style || 'Not specified'}
                      </span>
                      <span>•</span>
                      <span>{request.placement}</span>
                      <span>•</span>
                      <span>{request.size}</span>
                    </div>
                  </div>

                  {/* Payment Section */}
                  {request.customer && (
                    <div className={`mb-4`}>
                      <QuickPaymentActions
                        customerId={request.customer.id}
                        customerName={request.customer.name}
                        tattooRequestId={request.id}
                        requestStatus={request.status}
                        depositPaid={request.depositPaid}
                        variant="compact"
                        onPaymentCreated={() => {
                          loadTattooRequests();
                        }}
                      />
                      {request.depositPaid && request.depositAmount && (
                        <div className="text-xs text-green-400 flex items-center mt-2">
                          <DollarSign className="w-3 h-3 mr-1" />
                          ${request.depositAmount.toFixed(0)} deposit paid
                        </div>
                      )}
                      <CustomerPaymentHistory
                        customerId={request.customer.id}
                        variant="inline"
                        className="mt-2"
                      />
                    </div>
                  )}

                  {/* Action Button */}
                  <Link 
                    href={`/dashboard/tattoo-request/${request.id}`} 
                    className={`block w-full text-center px-4 py-2.5 ${components.button.base} ${components.button.variants.primary} ${components.button.sizes.small}`}
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            <div className={`bg-obsidian/50 border-t ${colors.borderSubtle} px-6 py-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${typography.textSm} ${colors.textSecondary} ${typography.fontMedium}`}>
                    Showing <span className={`${typography.fontSemibold} ${colors.textPrimary}`}>{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className={`${typography.fontSemibold} ${colors.textPrimary}`}>{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                    <span className={`${typography.fontSemibold} ${colors.textPrimary}`}>{pagination.total}</span> results
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className={`${components.button.base} ${components.button.sizes.small} ${components.button.variants.secondary} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Previous
                  </button>
                  <span className={`px-4 py-2 ${typography.textSm} ${typography.fontMedium} ${colors.textPrimary}`}>
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page === pagination.pages}
                    className={`${components.button.base} ${components.button.sizes.small} ${components.button.variants.secondary} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </DashboardCard>

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
    </DashboardPageLayout>
  );
}

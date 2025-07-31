'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Search, Plus, ChevronLeft, ChevronRight, Users, Mail, Phone } from 'lucide-react';
import { CustomerService, type Customer, type CustomerListResponse } from '@/src/lib/api/services/customerService';
import { apiClient } from '@/src/lib/api/apiClient';
import Modal from '../../../components/ui/Modal';
import CustomerForm from '../../../components/forms/CustomerForm';
import { DashboardPageLayout, DashboardCard } from '../components';
import { DashboardEmptyState } from '../components/DashboardEmptyState';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Define the limit constant used in pagination
  const limit = 20;

  // ✅ FIX: Memoize the customerService instance to prevent infinite loop
  const customerService = useMemo(() => new CustomerService(apiClient), []);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response: CustomerListResponse = await customerService.getCustomers({
        page: currentPage,
        limit: 20,
        search: searchTerm
      });

      setCustomers(response.data);
      setTotalPages(response.pagination.pages);
      setTotalCustomers(response.pagination.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, customerService]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadCustomers();
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    loadCustomers();
  };

  const handleEditClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedCustomer(null);
    loadCustomers();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <DashboardPageLayout
      title="Customers"
      description="Manage your customer database"
      breadcrumbs={[
        { label: 'Customers' }
      ]}
      actions={[
        {
          label: 'New Customer',
          onClick: () => setShowCreateModal(true),
          icon: <Plus className="w-4 h-4" />,
          variant: 'primary'
        }
      ]}
      loading={loading}
      error={error}
      onRetry={loadCustomers}
    >

      {/* Search Bar */}
      <DashboardCard
        title="Search Customers"
        className="mb-6"
      >
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#C9A449] w-5 h-5" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email or phone" 
                className="block w-full pl-10 pr-3 py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg focus:outline-none focus:border-[#C9A449]/50 focus:ring-1 focus:ring-[#C9A449]/20 text-white placeholder-gray-500 font-medium transition-all duration-300"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] rounded-lg font-medium shadow-lg shadow-[#C9A449]/20 transition-all duration-300"
          >
            Search
          </button>
        </form>
      </DashboardCard>

      {/* Customers Table */}
      <DashboardCard
        title="Customer List"
        subtitle={`${totalCustomers} total customers`}
        noPadding
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <span className="loading loading-spinner loading-lg text-[#C9A449]"></span>
              <p className="mt-2 text-gray-400">Loading customers...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-lg">
                <p className="font-medium mb-4">{error}</p>
                <button 
                  onClick={loadCustomers}
                  className="px-6 py-2 bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] rounded-lg font-medium shadow-lg shadow-[#C9A449]/20"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        ) : customers.length === 0 ? (
          <DashboardEmptyState
            icon={Users}
            title={searchTerm ? 'No customers found' : 'No customers yet'}
            description={searchTerm 
              ? 'Try adjusting your search terms or clear the search to see all customers.' 
              : 'Start building your customer database by adding your first customer.'
            }
            actions={searchTerm ? [
              {
                label: 'Clear Search',
                onClick: () => setSearchTerm(''),
                variant: 'secondary'
              }
            ] : [
              {
                label: 'Create First Customer',
                onClick: () => setShowCreateModal(true),
                variant: 'primary'
              }
            ]}
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-[#080808]">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Notes
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Added
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-[#1a1a1a]/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-[#C9A449] to-[#8B7635] text-[#080808] rounded-full flex items-center justify-center">
                            <span className="font-bold">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-white">{customer.name}</div>
                            {customer.squareId && (
                              <div className="text-xs text-gray-500">Square ID: {customer.squareId}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-300">{customer.email || '-'}</div>
                        <div className="text-sm text-gray-500">{customer.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-400 max-w-xs truncate">
                          {customer.notes || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-medium">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Link 
                            href={`/dashboard/customers/${customer.id}`} 
                            className="text-[#C9A449] hover:text-[#E5B563] font-medium px-2 py-1 transition-colors"
                          >
                            View
                          </Link>
                          <button 
                            onClick={() => handleEditClick(customer)}
                            className="text-gray-400 hover:text-white font-medium px-2 py-1 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="grid lg:hidden gap-4 p-4">
              {customers.map((customer) => (
                <div key={customer.id} className="bg-gradient-to-b from-obsidian/95 to-obsidian/90 border border-gold-500/10 rounded-2xl p-5 hover:border-gold-500/30 hover:shadow-lg transition-all duration-300">
                  {/* Customer Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-[#C9A449] to-[#8B7635] text-[#080808] rounded-full flex items-center justify-center shadow-lg">
                        <span className="font-bold text-lg">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {customer.name}
                        </div>
                        {customer.squareId && (
                          <div className="text-xs text-gray-500">
                            Square ID: {customer.squareId}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-2 mb-4 pb-4 border-b border-gold-500/10">
                    {customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gold-500/50" />
                        <span className="text-sm text-gray-300">{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gold-500/50" />
                        <span className="text-sm text-gray-300">{customer.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {customer.notes && (
                    <div className="mb-4 pb-4 border-b border-gold-500/10">
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {customer.notes}
                      </p>
                    </div>
                  )}

                  {/* Footer with Date and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Added {formatDate(customer.createdAt)}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditClick(customer)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-300"
                      >
                        Edit
                      </button>
                      <Link 
                        href={`/dashboard/customers/${customer.id}`} 
                        className="px-3 py-1.5 text-xs font-medium text-[#C9A449] hover:text-[#E5B563] bg-[#C9A449]/10 hover:bg-[#C9A449]/20 border border-[#C9A449]/30 hover:border-[#C9A449]/50 rounded-lg transition-all duration-300"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            <div className="bg-[#080808] border-t border-[#1a1a1a] px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-[#C9A449]/30 text-sm font-medium rounded-lg text-[#C9A449] bg-transparent hover:bg-[#C9A449]/10 disabled:opacity-50 transition-all duration-300"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-[#C9A449]/30 text-sm font-medium rounded-lg text-[#C9A449] bg-transparent hover:bg-[#C9A449]/10 disabled:opacity-50 transition-all duration-300"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-400 font-medium">
                      Showing <span className="font-bold text-white">{(currentPage - 1) * limit + 1}</span> to{' '}
                      <span className="font-bold text-white">{Math.min(currentPage * limit, totalCustomers)}</span> of{' '}
                      <span className="font-bold text-white">{totalCustomers}</span> customers
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-lg border border-[#1a1a1a] bg-[#111111] text-sm font-medium text-gray-400 hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50 transition-all duration-300"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-300 ${
                              currentPage === pageNum
                                ? 'z-10 bg-[#C9A449] border-[#C9A449] text-[#080808]'
                                : 'bg-[#111111] border-[#1a1a1a] text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-lg border border-[#1a1a1a] bg-[#111111] text-sm font-medium text-gray-400 hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50 transition-all duration-300"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </DashboardCard>

      {/* Create Customer Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="New Customer"
      >
        <CustomerForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCustomer(null);
        }}
        title="Edit Customer"
      >
        {selectedCustomer && (
          <CustomerForm
            customer={selectedCustomer}
            onSuccess={handleEditSuccess}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedCustomer(null);
            }}
          />
        )}
      </Modal>
    </DashboardPageLayout>
  );
}

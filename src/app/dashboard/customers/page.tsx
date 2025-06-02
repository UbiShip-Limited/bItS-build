'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomerService, type Customer, type CustomerListResponse } from '@/src/lib/api/services/customerService';
import { apiClient } from '@/src/lib/api/apiClient';
import Modal from '../../../components/ui/Modal';
import CustomerForm from '../../../components/forms/CustomerForm';

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

  const customerService = new CustomerService(apiClient);
  const limit = 20;

  useEffect(() => {
    loadCustomers();
  }, [currentPage, searchTerm]);

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response: CustomerListResponse = await customerService.getCustomers({
        page: currentPage,
        limit,
        search: searchTerm
      });

      setCustomers(response.data);
      setTotalPages(response.pagination.pages);
      setTotalCustomers(response.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

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
    <div>
      <div className="flex justify-between items-center mb-8 pb-6 border-b-2 border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Customers</h1>
          <p className="text-gray-600 text-lg">Manage your customer database</p>
        </div>
        <div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 flex items-center gap-2 font-medium border-2 border-black transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            New Customer
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-2 border-gray-200 rounded-lg shadow-md p-6 mb-6 hover:border-black transition-colors duration-200">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-5 h-5" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email or phone" 
                className="block w-full pl-10 pr-3 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black font-medium transition-colors duration-200"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium border-2 border-black transition-colors duration-200"
          >
            Search
          </button>
        </form>
      </div>

      {/* Customers Table */}
      <div className="bg-white border-2 border-gray-200 rounded-lg shadow-md overflow-hidden hover:border-black transition-colors duration-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              <p className="mt-2 text-gray-600">Loading customers...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="bg-white border-2 border-red-300 text-red-600 px-6 py-4 rounded-lg">
                <p className="font-medium mb-4">{error}</p>
                <button 
                  onClick={loadCustomers}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-gray-500 mb-4 text-lg font-medium">
                {searchTerm ? 'No customers found matching your search.' : 'No customers yet.'}
              </p>
              {!searchTerm && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
                >
                  Create First Customer
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y-2 divide-black">
                <thead className="bg-black">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
                      Notes
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
                      Added
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-black text-white rounded-full flex items-center justify-center">
                            <span className="font-bold">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-black">{customer.name}</div>
                            {customer.squareId && (
                              <div className="text-xs text-gray-600">Square ID: {customer.squareId}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
                        <div className="text-sm font-medium text-black">{customer.email || '-'}</div>
                        <div className="text-sm text-gray-600">{customer.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-100">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {customer.notes || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-medium border-r border-gray-100">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Link 
                            href={`/dashboard/customers/${customer.id}`} 
                            className="text-black hover:underline font-medium px-2 py-1"
                          >
                            View
                          </Link>
                          <button 
                            onClick={() => handleEditClick(customer)}
                            className="text-gray-600 hover:text-black hover:underline font-medium px-2 py-1"
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
            
            {/* Pagination */}
            <div className="bg-gray-50 border-t-2 border-black px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border-2 border-gray-300 text-sm font-medium rounded-lg text-black bg-white hover:border-black disabled:opacity-50 transition-colors duration-200"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border-2 border-gray-300 text-sm font-medium rounded-lg text-black bg-white hover:border-black disabled:opacity-50 transition-colors duration-200"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-black font-medium">
                      Showing <span className="font-bold">{(currentPage - 1) * limit + 1}</span> to{' '}
                      <span className="font-bold">{Math.min(currentPage * limit, totalCustomers)}</span> of{' '}
                      <span className="font-bold">{totalCustomers}</span> customers
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-lg border-2 border-gray-300 bg-white text-sm font-medium text-black hover:border-black disabled:opacity-50 transition-colors duration-200"
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
                            className={`relative inline-flex items-center px-4 py-2 border-2 text-sm font-medium transition-colors duration-200 ${
                              currentPage === pageNum
                                ? 'z-10 bg-black border-black text-white'
                                : 'bg-white border-gray-300 text-black hover:border-black'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-lg border-2 border-gray-300 bg-white text-sm font-medium text-black hover:border-black disabled:opacity-50 transition-colors duration-200"
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
      </div>

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
    </div>
  );
}

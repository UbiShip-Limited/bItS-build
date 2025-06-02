'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Filter, FileText, User, Calendar, DollarSign } from 'lucide-react';
import { TattooRequestService, type TattooRequest } from '@/src/lib/api/services/tattooRequestService';
import { apiClient } from '@/src/lib/api/apiClient';

export default function TattooRequestsPage() {
  const [requests, setRequests] = useState<TattooRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  const tattooRequestService = new TattooRequestService(apiClient);

  useEffect(() => {
    loadTattooRequests();
  }, [filters]);

  const loadTattooRequests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tattooRequestService.getAll({
        status: filters.status || undefined,
        page: filters.page,
        limit: filters.limit
      });
      
      setRequests(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load tattoo requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-white text-black border-gray-400',
      'reviewed': 'bg-black text-white border-black',
      'approved': 'bg-gray-800 text-white border-gray-800',
      'rejected': 'bg-white text-red-600 border-red-300',
      'deposit_paid': 'bg-gray-600 text-white border-gray-600',
      'in_progress': 'bg-gray-300 text-black border-gray-400',
      'completed': 'bg-gray-100 text-black border-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-black border-gray-300';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8 pb-6 border-b-2 border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Tattoo Requests</h1>
          <p className="text-gray-600 text-lg">Manage all tattoo requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-2 border-gray-200 rounded-lg shadow-md p-6 mb-6 hover:border-black transition-colors duration-200">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
          <Filter className="w-5 h-5 text-black" />
          <span className="font-semibold text-black text-lg">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Status</label>
            <select 
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="block w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none transition-colors duration-200"
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
              className="w-full px-3 py-2 border-2 border-gray-300 text-black rounded-lg hover:border-black hover:bg-gray-50 font-medium transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tattoo Requests Table */}
      <div className="bg-white border-2 border-gray-200 rounded-lg shadow-md overflow-hidden hover:border-black transition-colors duration-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <p className="mt-2 text-gray-600">Loading tattoo requests...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="bg-white border-2 border-red-300 text-red-600 px-6 py-4 rounded-lg">
              <p className="font-medium">{error}</p>
              <button 
                onClick={loadTattooRequests}
                className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No tattoo requests found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y-2 divide-black">
                <thead className="bg-black">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
                      Request
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700">
                      Style
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded overflow-hidden border-2 border-gray-300">
                            {request.referenceImages && request.referenceImages.length > 0 ? (
                              <img 
                                src={request.referenceImages[0].url} 
                                alt="Reference" 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-black">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-black">
                              Request #{request.id.slice(-6)}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(request.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
                        <div className="text-sm font-medium text-black">
                          {request.customer ? (
                            <>
                              <User className="w-3 h-3 inline mr-1" />
                              {request.customer.name}
                            </>
                          ) : (
                            'Anonymous'
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {request.customer?.email || request.contactEmail || 'No email'}
                        </div>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-100">
                        <div className="text-sm font-medium text-black max-w-xs truncate">
                          {request.description}
                        </div>
                        <div className="text-sm text-gray-600">
                          {request.placement} • {request.size}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-medium border-r border-gray-100">
                        {request.style || 'Not specified'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          href={`/dashboard/tattoo-request/${request.id}`} 
                          className="text-black hover:underline font-medium px-2 py-1"
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
            <div className="bg-gray-50 border-t-2 border-black px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black font-medium">
                    Showing <span className="font-bold">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="font-bold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                    <span className="font-bold">{pagination.total}</span> results
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="px-4 py-2 border-2 border-gray-300 text-black rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-black font-medium transition-colors duration-200"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-black">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page === pagination.pages}
                    className="px-4 py-2 border-2 border-gray-300 text-black rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-black font-medium transition-colors duration-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Calendar, FileText, DollarSign, Clock, Mail, Phone } from 'lucide-react';
import { CustomerService, type Customer } from '@/src/lib/api/services/customerService';
import { AppointmentApiClient, type AppointmentData } from '@/src/lib/api/services/appointmentApiClient';
import { TattooRequestService, type TattooRequest } from '@/src/lib/api/services/tattooRequestApiClient';
import { apiClient } from '@/src/lib/api/apiClient';
import Modal from '../../../../components/ui/Modal';
import CustomerForm from '../../../../components/forms/CustomerForm';

export default function CustomerDetailPage() {
  const params = useParams();
  
  // Handle case where params might be null
  if (!params || !params.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-400 mb-4">Invalid customer ID</p>
          <Link
            href="/dashboard/customers"
            className="px-4 py-2 bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] rounded-lg font-medium shadow-lg shadow-[#C9A449]/20"
          >
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }
  
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [tattooRequests, setTattooRequests] = useState<TattooRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // ✅ FIX: Memoize service instances to prevent infinite loops
  const customerService = useMemo(() => new CustomerService(apiClient), []);
  const appointmentService = useMemo(() => new AppointmentApiClient(apiClient), []);
  const tattooRequestService = useMemo(() => new TattooRequestService(apiClient), []);

  const loadCustomerData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load customer details
      const customerData = await customerService.getCustomer(customerId);
      setCustomer(customerData);

      // Load customer's appointments
      const appointmentsResponse = await appointmentService.getAppointments({
        customerId,
        limit: 10
      });
      setAppointments(appointmentsResponse.data);

      // Load customer's tattoo requests
      const tattooRequestsResponse = await tattooRequestService.getAll({
        limit: 10
      });
      // Filter for this customer (since API doesn't have customerId filter yet)
      const customerRequests = tattooRequestsResponse.data.filter(
        req => req.customerId === customerId
      );
      setTattooRequests(customerRequests);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load customer data');
    } finally {
      setLoading(false);
    }
  }, [customerId, customerService, appointmentService, tattooRequestService]);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  const handleEditSuccess = () => {
    setShowEditModal(false);
    loadCustomerData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-500/20 text-blue-400',
      confirmed: 'bg-green-500/20 text-green-400',
      completed: 'bg-gray-500/20 text-gray-400',
      cancelled: 'bg-red-500/20 text-red-400',
      pending: 'bg-[#C9A449]/20 text-[#C9A449]',
      new: 'bg-purple-500/20 text-purple-400',
      approved: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400',
      deposit_paid: 'bg-blue-500/20 text-blue-400',
      in_progress: 'bg-yellow-500/20 text-yellow-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-[#C9A449]"></span>
          <p className="mt-2 text-gray-400">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Customer not found'}</p>
          <Link
            href="/dashboard/customers"
            className="px-4 py-2 bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] rounded-lg font-medium shadow-lg shadow-[#C9A449]/20"
          >
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center text-gray-400 hover:text-[#C9A449] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customers
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-heading font-bold flex items-center gap-3 text-white">
              <div className="h-12 w-12 bg-gradient-to-br from-[#C9A449] to-[#8B7635] rounded-full flex items-center justify-center">
                <span className="text-[#080808] font-medium text-lg">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              {customer.name}
            </h1>
            <p className="text-gray-400 mt-1">Customer since {formatDate(customer.createdAt)}</p>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-[#C9A449]/20"
          >
            <Edit className="w-4 h-4" />
            Edit Customer
          </button>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <div className="bg-[#111111] rounded-2xl shadow-2xl p-6 border border-[#1a1a1a] hover:border-[#C9A449]/20 transition-all duration-300">
            <h2 className="text-lg font-semibold mb-4 text-white">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#C9A449] mt-0.5" />
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="font-medium text-gray-300">{customer.email || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#C9A449] mt-0.5" />
                <div>
                  <p className="text-sm text-gray-400">Phone</p>
                  <p className="font-medium text-gray-300">{customer.phone || 'Not provided'}</p>
                </div>
              </div>
              {customer.squareId && (
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-[#C9A449] mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Square ID</p>
                    <p className="font-medium text-gray-300">{customer.squareId}</p>
                  </div>
                </div>
              )}
            </div>

            {customer.notes && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Notes</h3>
                <p className="text-sm text-gray-400 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Appointments */}
          <div className="bg-[#111111] rounded-2xl shadow-2xl border border-[#1a1a1a] hover:border-[#C9A449]/20 transition-all duration-300">
            <div className="p-6 border-b border-[#1a1a1a]">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <Calendar className="w-5 h-5 text-[#C9A449]" />
                  Appointments
                </h2>
                <Link
                  href={`/dashboard/appointments?customerId=${customerId}`}
                  className="text-sm text-[#C9A449] hover:text-[#E5B563] transition-colors"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              {appointments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No appointments yet</p>
              ) : (
                <div className="space-y-3">
                  {appointments.slice(0, 5).map((appointment) => (
                    <Link
                      key={appointment.id}
                      href={`/dashboard/appointments/${appointment.id}`}
                      className="block p-4 border border-[#1a1a1a] rounded-lg hover:bg-[#1a1a1a]/50 hover:border-[#C9A449]/20 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-white">{appointment.type || 'Appointment'}</p>
                          <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(appointment.startTime)}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tattoo Requests */}
          <div className="bg-[#111111] rounded-2xl shadow-2xl border border-[#1a1a1a] hover:border-[#C9A449]/20 transition-all duration-300">
            <div className="p-6 border-b border-[#1a1a1a]">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <FileText className="w-5 h-5 text-[#C9A449]" />
                  Tattoo Requests
                </h2>
                <Link
                  href={`/dashboard/tattoo-requests?customerId=${customerId}`}
                  className="text-sm text-[#C9A449] hover:text-[#E5B563] transition-colors"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              {tattooRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No tattoo requests yet</p>
              ) : (
                <div className="space-y-3">
                  {tattooRequests.slice(0, 5).map((request) => (
                    <Link
                      key={request.id}
                      href={`/dashboard/tattoo-requests/${request.id}`}
                      className="block p-4 border border-[#1a1a1a] rounded-lg hover:bg-[#1a1a1a]/50 hover:border-[#C9A449]/20 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium line-clamp-1 text-white">{request.description}</p>
                          <p className="text-sm text-gray-400 mt-1">
                            {request.placement} • {request.size}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ml-2 ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Customer"
      >
        <CustomerForm
          customer={customer}
          onSuccess={handleEditSuccess}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>
    </div>
  );
}

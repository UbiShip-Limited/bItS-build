'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Calendar, FileText, DollarSign, Clock, Mail, Phone, User } from 'lucide-react';
import { CustomerService, type Customer } from '@/src/lib/api/services/customerService';
import { AppointmentService, type AppointmentData } from '@/src/lib/api/services/appointmentService';
import { TattooRequestService, type TattooRequest } from '@/src/lib/api/services/tattooRequestService';
import { apiClient } from '@/src/lib/api/apiClient';
import Modal from '../../../../components/ui/Modal';
import CustomerForm from '../../../../components/forms/CustomerForm';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [tattooRequests, setTattooRequests] = useState<TattooRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const customerService = new CustomerService(apiClient);
  const appointmentService = new AppointmentService(apiClient);
  const tattooRequestService = new TattooRequestService(apiClient);

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = async () => {
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
    } catch (err: any) {
      setError(err.message || 'Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

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
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      new: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      deposit_paid: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Customer not found'}</p>
          <Link
            href="/dashboard/customers"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customers
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-medium text-lg">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              {customer.name}
            </h1>
            <p className="text-gray-600 mt-1">Customer since {formatDate(customer.createdAt)}</p>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Customer
          </button>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{customer.email || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{customer.phone || 'Not provided'}</p>
                </div>
              </div>
              {customer.squareId && (
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Square ID</p>
                    <p className="font-medium">{customer.squareId}</p>
                  </div>
                </div>
              )}
            </div>

            {customer.notes && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Appointments */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  Appointments
                </h2>
                <Link
                  href={`/dashboard/appointments?customerId=${customerId}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
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
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{appointment.type || 'Appointment'}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
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
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  Tattoo Requests
                </h2>
                <Link
                  href={`/dashboard/tattoo-requests?customerId=${customerId}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
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
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium line-clamp-1">{request.description}</p>
                          <p className="text-sm text-gray-600 mt-1">
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

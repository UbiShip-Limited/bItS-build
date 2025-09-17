'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Calendar, FileText, DollarSign, Clock, Mail, Phone, Trash2 } from 'lucide-react';
import { CustomerService, type Customer } from '@/src/lib/api/services/customerService';
import { AppointmentApiClient, type AppointmentData } from '@/src/lib/api/services/appointmentApiClient';
import { TattooRequestService, type TattooRequest } from '@/src/lib/api/services/tattooRequestApiClient';
import { apiClient } from '@/src/lib/api/apiClient';
import Modal from '../../../../components/ui/Modal';
import CustomerForm from '../../../../components/forms/CustomerForm';
import { DashboardPageLayout } from '../../components/DashboardPageLayout';
import { DashboardCard } from '../../components/DashboardCard';
import { typography, colors, effects, components } from '@/src/lib/styles/globalStyleConstants';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();

  // ✅ ALL React hooks must be called before any early returns
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [tattooRequests, setTattooRequests] = useState<TattooRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ✅ Memoize service instances to prevent infinite loops
  const customerService = useMemo(() => new CustomerService(apiClient), []);
  const appointmentService = useMemo(() => new AppointmentApiClient(apiClient), []);
  const tattooRequestService = useMemo(() => new TattooRequestService(apiClient), []);
  
  const customerId = params?.id as string;

  const loadCustomerData = useCallback(async () => {
    if (!customerId) return;
    
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

  // ✅ NOW we can have early returns after all hooks are defined
  if (!params || !params.id) {
    return (
      <DashboardPageLayout
        title="Customer Details"
        description="Error loading customer"
        breadcrumbs={[
          { label: 'Customers', href: '/dashboard/customers' },
          { label: 'Error' }
        ]}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-400 mb-4">Invalid customer ID</p>
            <Link
              href="/dashboard/customers"
              className={`${components.button.base} ${components.button.sizes.medium} ${components.button.variants.primary}`}
            >
              Back to Customers
            </Link>
          </div>
        </div>
      </DashboardPageLayout>
    );
  }

  const handleEditSuccess = () => {
    setShowEditModal(false);
    loadCustomerData();
  };

  const handleDeleteCustomer = async () => {
    if (!customer) return;

    const confirmed = confirm(
      `Are you sure you want to delete ${customer.name}? This action cannot be undone. All associated appointments and requests will be preserved but unlinked.`
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      await customerService.deleteCustomer(customer.id);
      // Navigate back to customers list after successful deletion
      router.push('/dashboard/customers');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer');
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
      completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
      pending: `bg-gold-500/20 ${colors.textAccent} ${colors.borderDefault}`,
      new: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      approved: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      deposit_paid: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };
    return statusColors[status] || `bg-white/10 ${colors.textSecondary} ${colors.borderSubtle}`;
  };

  if (loading) {
    return (
      <DashboardPageLayout
        title="Customer Details"
        description="Loading customer information"
        breadcrumbs={[
          { label: 'Customers', href: '/dashboard/customers' },
          { label: 'Loading...' }
        ]}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${colors.borderDefault} mx-auto mb-4`}></div>
            <p className={colors.textSecondary}>Loading customer details...</p>
          </div>
        </div>
      </DashboardPageLayout>
    );
  }

  if (error || !customer) {
    return (
      <DashboardPageLayout
        title="Customer Details"
        description="Error loading customer"
        breadcrumbs={[
          { label: 'Customers', href: '/dashboard/customers' },
          { label: 'Error' }
        ]}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || 'Customer not found'}</p>
            <Link
              href="/dashboard/customers"
              className={`${colors.textAccent} hover:text-gold-400 ${effects.transitionNormal}`}
            >
              Back to customers
            </Link>
          </div>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      title="Customer Details"
      description={customer.name}
      breadcrumbs={[
        { label: 'Customers', href: '/dashboard/customers' },
        { label: customer.name }
      ]}
      actions={[
        {
          label: 'Edit Customer',
          onClick: () => setShowEditModal(true),
          icon: <Edit className="w-4 h-4" />,
          variant: 'primary'
        },
        {
          label: deleting ? 'Deleting...' : 'Delete',
          onClick: handleDeleteCustomer,
          icon: <Trash2 className="w-4 h-4" />,
          variant: 'secondary'
        }
      ]}
    >

      {/* Customer Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <DashboardCard
            title="Contact Information"
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className={`w-5 h-5 ${colors.textAccent} mt-0.5`} />
                <div>
                  <p className={`${typography.textSm} ${colors.textMuted}`}>Email</p>
                  <p className={`${typography.fontMedium} ${colors.textSecondary}`}>{customer.email || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className={`w-5 h-5 ${colors.textAccent} mt-0.5`} />
                <div>
                  <p className={`${typography.textSm} ${colors.textMuted}`}>Phone</p>
                  <p className={`${typography.fontMedium} ${colors.textSecondary}`}>{customer.phone || 'Not provided'}</p>
                </div>
              </div>
              {customer.squareId && (
                <div className="flex items-start gap-3">
                  <DollarSign className={`w-5 h-5 ${colors.textAccent} mt-0.5`} />
                  <div>
                    <p className={`${typography.textSm} ${colors.textMuted}`}>Square ID</p>
                    <p className={`${typography.fontMedium} ${colors.textSecondary}`}>{customer.squareId}</p>
                  </div>
                </div>
              )}
            </div>

            {customer.notes && (
              <div className={`mt-6 pt-6 border-t ${colors.borderSubtle}`}>
                <h3 className={`${typography.textSm} ${typography.fontSemibold} ${colors.textSecondary} mb-2`}>Notes</h3>
                <p className={`${typography.textSm} ${colors.textMuted} whitespace-pre-wrap`}>{customer.notes}</p>
              </div>
            )}
          </DashboardCard>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Appointments */}
          <DashboardCard
            title="Appointments"
            headerAction={
              <Link
                href={`/dashboard/appointments?customerId=${customerId}`}
                className={`${typography.textSm} ${colors.textAccent} hover:text-gold-400 ${effects.transitionNormal}`}
              >
                View All
              </Link>
            }
          >
            {appointments.length === 0 ? (
              <p className={`${colors.textMuted} text-center py-4`}>No appointments yet</p>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 5).map((appointment) => (
                  <Link
                    key={appointment.id}
                    href={`/dashboard/appointments/${appointment.id}`}
                    className={`block p-4 border ${colors.borderSubtle} ${components.radius.medium} hover:bg-white/5 hover:border-gold-500/30 ${effects.transitionNormal}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`${typography.fontMedium} ${colors.textPrimary}`}>{appointment.type || 'Appointment'}</p>
                        <p className={`${typography.textSm} ${colors.textMuted} flex items-center gap-1 mt-1`}>
                          <Clock className="w-3 h-3" />
                          {formatDateTime(appointment.startTime)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 ${typography.textXs} ${typography.fontMedium} rounded-full border ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </DashboardCard>

          {/* Tattoo Requests */}
          <DashboardCard
            title="Tattoo Requests"
            headerAction={
              <Link
                href={`/dashboard/tattoo-request?customerId=${customerId}`}
                className={`${typography.textSm} ${colors.textAccent} hover:text-gold-400 ${effects.transitionNormal}`}
              >
                View All
              </Link>
            }
          >
            {tattooRequests.length === 0 ? (
              <p className={`${colors.textMuted} text-center py-4`}>No tattoo requests yet</p>
            ) : (
              <div className="space-y-3">
                {tattooRequests.slice(0, 5).map((request) => (
                  <Link
                    key={request.id}
                    href={`/dashboard/tattoo-request/${request.id}`}
                    className={`block p-4 border ${colors.borderSubtle} ${components.radius.medium} hover:bg-white/5 hover:border-gold-500/30 ${effects.transitionNormal}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className={`${typography.fontMedium} line-clamp-1 ${colors.textPrimary}`}>{request.description}</p>
                        <p className={`${typography.textSm} ${colors.textMuted} mt-1`}>
                          {request.placement} • {request.size}
                        </p>
                      </div>
                      <span className={`px-2 py-1 ${typography.textXs} ${typography.fontMedium} rounded-full border ml-2 ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </DashboardCard>
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
    </DashboardPageLayout>
  );
}

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Search, 
  Filter,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  DollarSign,
  RefreshCw,
  CloudOff,
  Cloud
} from 'lucide-react';
// Components are loaded dynamically as needed
import { AppointmentApiClient, type AppointmentData, BookingStatus, BookingType } from '@/src/lib/api/services/appointmentApiClient';
import { apiClient } from '@/src/lib/api/apiClient';
import Modal from '@/src/components/ui/Modal';
import AppointmentForm from '@/src/components/forms/AppointmentForm';
import QuickPaymentActions from '@/src/components/payments/QuickPaymentActions';
import CustomerPaymentHistory from '@/src/components/payments/CustomerPaymentHistory';
import AppointmentNotificationStatus from '@/src/components/appointments/AppointmentNotificationStatus';
import { DashboardPageLayout, DashboardCard } from '../components';
import { DashboardEmptyState } from '../components/DashboardEmptyState';
import { toast } from '@/src/lib/toast';
import { typography, colors, effects, layout, components, spacing } from '@/src/lib/styles/globalStyleConstants';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);
  const [syncingSquare, setSyncingSquare] = useState(false);
  const [newAppointmentIds, setNewAppointmentIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    dateRange: '',
    from: '',
    to: '',
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

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Memoize the client to prevent recreation on every render
  const appointmentService = useMemo(() => new AppointmentApiClient(apiClient), []);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await appointmentService.getAppointments({
        status: filters.status || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page: filters.page,
        limit: filters.limit
      });
      
      setAppointments(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      setError(error instanceof Error ? error.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [appointmentService, filters.status, filters.from, filters.to, filters.page, filters.limit]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Listen for new appointments via SSE and auto-refresh
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
    const eventSource = new EventSource(`${apiUrl}/events?userId=admin-user`);

    eventSource.addEventListener('appointment_created', (event) => {
      // Auto-refresh the appointments list
      loadAppointments();
      
      // Mark new appointment for highlighting
      try {
        const data = JSON.parse(event.data);
        if (data.appointmentId) {
          setNewAppointmentIds(prev => new Set([...prev, data.appointmentId]));
          
          // Remove highlight after 5 seconds
          setTimeout(() => {
            setNewAppointmentIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.appointmentId);
              return newSet;
            });
          }, 5000);
        }
      } catch (e) {
        console.error('Error parsing appointment event:', e);
      }
    });

    eventSource.addEventListener('appointment_updated', () => {
      // Refresh on updates too
      loadAppointments();
    });

    return () => {
      eventSource.close();
    };
  }, [loadAppointments]);

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setSelectedAppointment(null);
    loadAppointments();
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
      await appointmentService.cancelAppointment(id, 'Cancelled by admin');
      loadAppointments();
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      setError(error instanceof Error ? error.message : 'Failed to cancel appointment');
    }
  };

  const handleSquareSync = async () => {
    setSyncingSquare(true);
    setError(null);
    
    try {
      // Call the Square sync endpoint and reload appointments after
      await apiClient.post('/square-sync/run', {});
      loadAppointments();
      // Show success message
      const syncMessage = 'Square sync started. This may take a few moments.';
      // Wait a bit and then reload appointments
      setTimeout(() => {
        loadAppointments();
      }, 3000);
      
      // You could also poll the sync status endpoint here
    } catch (error) {
      console.error('Failed to start Square sync:', error);
      setError(error instanceof Error ? error.message : 'Failed to start Square sync');

      // Show error message
      toast.error('Failed to start Square sync');

    } finally {
      setSyncingSquare(false);
    }
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(appointments.map(apt => apt.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      newSelectedIds.add(id);
    } else {
      newSelectedIds.delete(id);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleBulkStatusUpdate = async (newStatus: BookingStatus) => {
    if (selectedIds.size === 0) return;
    
    setBulkUpdating(true);
    try {
      // Call bulk update endpoint
      const response = await apiClient.post('/appointments/bulk-update', {
        appointmentIds: Array.from(selectedIds),
        updates: { status: newStatus }
      });
      
      toast.success(`Updated ${selectedIds.size} appointments`);
      setSelectedIds(new Set());
      loadAppointments();
    } catch (error) {
      console.error('Failed to bulk update:', error);
      toast.error('Failed to update appointments');
    } finally {
      setBulkUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      [BookingStatus.PENDING]: 'badge-warning',
      [BookingStatus.SCHEDULED]: 'badge-info',
      [BookingStatus.CONFIRMED]: 'badge-success',
      [BookingStatus.COMPLETED]: 'badge-accent',
      [BookingStatus.CANCELLED]: 'badge-error',
      [BookingStatus.NO_SHOW]: 'badge-ghost'
    };
    return colors[status] || 'badge-ghost';
  };

  const getBookingTypeLabel = (type: string) => {
    const labels = {
      [BookingType.CONSULTATION]: 'Consultation',
      [BookingType.DRAWING_CONSULTATION]: 'Drawing Consultation',
      [BookingType.TATTOO_SESSION]: 'Tattoo Session'
    };
    return labels[type] || type;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  return (
    <DashboardPageLayout
      title="Appointments"
      description="Manage all your appointments"
      breadcrumbs={[
        { label: 'Appointments' }
      ]}
      actions={[
        {
          label: "Today's Schedule",
          href: '/dashboard/appointments/today',
          icon: <Calendar className="w-4 h-4" />,
          variant: 'secondary'
        },
        {
          label: 'Calendar View',
          href: '/dashboard/appointments/calendar',
          icon: <Calendar className="w-4 h-4" />,
          variant: 'secondary'
        },
        {
          label: syncingSquare ? 'Syncing...' : 'Sync Square',
          onClick: syncingSquare ? undefined : handleSquareSync,
          icon: <RefreshCw className={`w-4 h-4 ${syncingSquare ? 'animate-spin' : ''}`} />,
          variant: 'secondary'
        },
        {
          label: 'New Appointment',
          onClick: () => setShowCreateModal(true),
          icon: <Plus className="w-4 h-4" />,
          variant: 'primary'
        }
      ]}
      loading={loading}
      error={error}
      onRetry={loadAppointments}
    >

      {/* Filters */}
      <DashboardCard
        title="Filters"
        className="mb-6"
      >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={`block ${typography.textSm} ${typography.fontMedium} ${colors.textSecondary} mb-2`}>
                Status
              </label>
              <select 
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className={components.select}
              >
                <option value="">All Statuses</option>
                {Object.values(BookingStatus).map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={`block ${typography.textSm} ${typography.fontMedium} ${colors.textSecondary} mb-2`}>
                From Date
              </label>
              <input 
                type="date"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value, page: 1 })}
                className={components.input}
              />
            </div>
            
            <div>
              <label className={`block ${typography.textSm} ${typography.fontMedium} ${colors.textSecondary} mb-2`}>
                To Date
              </label>
              <input 
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value, page: 1 })}
                className={components.input}
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', search: '', dateRange: '', from: '', to: '', page: 1, limit: 20 })}
                className={`w-full ${components.button.base} ${components.button.sizes.medium} ${components.button.variants.secondary}`}
              >
                Clear Filters
              </button>
            </div>
          </div>
      </DashboardCard>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className={`mb-4 p-4 ${components.card} flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <span className={`${colors.textPrimary} ${typography.fontMedium}`}>
              {selectedIds.size} appointment{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className={`${colors.textSecondary} hover:${colors.textPrimary} ${typography.textSm} ${effects.transitionNormal}`}
            >
              Clear selection
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`${typography.textSm} ${colors.textSecondary}`}>Bulk update status:</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusUpdate(e.target.value as BookingStatus);
                }
              }}
              disabled={bulkUpdating}
              className={`${components.select} w-auto min-w-[200px]`}
              defaultValue=""
            >
              <option value="" disabled>Choose status...</option>
              <option value={BookingStatus.CONFIRMED}>Confirm Selected</option>
              <option value={BookingStatus.COMPLETED}>Mark as Completed</option>
              <option value={BookingStatus.CANCELLED}>Cancel Selected</option>
              <option value={BookingStatus.NO_SHOW}>Mark as No Show</option>
            </select>
          </div>
        </div>
      )}

      {/* Appointments Table */}
      <DashboardCard
        title="Appointments List"
        subtitle={`Showing ${appointments.length} appointments`}
        noPadding
      >
        {appointments.length === 0 ? (
          <DashboardEmptyState
            icon={Calendar}
            title="No appointments found"
            description="You don't have any appointments yet. Create your first appointment to get started."
            actions={[
              {
                label: 'Create Appointment',
                onClick: () => setShowCreateModal(true),
                variant: 'primary'
              }
            ]}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className={`${colors.bgPrimary} ${colors.textMuted} ${typography.textXs} ${typography.fontMedium} uppercase ${typography.trackingWide} w-12`}>
                      <input
                        type="checkbox"
                        checked={appointments.length > 0 && selectedIds.size === appointments.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="checkbox checkbox-sm border-gold-500/30 checked:border-gold-500 [--chkbg:#C9A449] [--chkfg:#080808]"
                      />
                    </th>
                    <th className={`${colors.bgPrimary} ${colors.textMuted} ${typography.textXs} ${typography.fontMedium} uppercase ${typography.trackingWide}`}>Client</th>
                    <th className={`${colors.bgPrimary} ${colors.textMuted} ${typography.textXs} ${typography.fontMedium} uppercase ${typography.trackingWide}`}>Date & Time</th>
                    <th className={`${colors.bgPrimary} ${colors.textMuted} ${typography.textXs} ${typography.fontMedium} uppercase ${typography.trackingWide}`}>Artist</th>
                    <th className={`${colors.bgPrimary} ${colors.textMuted} ${typography.textXs} ${typography.fontMedium} uppercase ${typography.trackingWide}`}>Type</th>
                    <th className={`${colors.bgPrimary} ${colors.textMuted} ${typography.textXs} ${typography.fontMedium} uppercase ${typography.trackingWide}`}>Status</th>
                    <th className={`${colors.bgPrimary} ${colors.textMuted} ${typography.textXs} ${typography.fontMedium} uppercase ${typography.trackingWide}`}>Square</th>
                    <th className={`${colors.bgPrimary} ${colors.textMuted} ${typography.textXs} ${typography.fontMedium} uppercase ${typography.trackingWide}`}>Price</th>
                    <th className={`${colors.bgPrimary} ${colors.textMuted} ${typography.textXs} ${typography.fontMedium} uppercase ${typography.trackingWide}`}>Payment</th>
                    <th className={`${colors.bgPrimary} ${colors.textMuted} ${typography.textXs} ${typography.fontMedium} uppercase ${typography.trackingWide}`}>Notifications</th>
                    <th className={`${colors.bgPrimary} ${colors.textMuted} ${typography.textXs} ${typography.fontMedium} uppercase ${typography.trackingWide} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${colors.borderSubtle}`}>
                  {appointments.map((appointment) => {
                    const { date, time } = formatDateTime(appointment.startTime);
                    const isPaid = appointment.priceQuote && appointment.priceQuote > 0; // This will be improved when payment data is available
                    const hasSquareSync = !!appointment.squareId;
                    const isFirstTime = false; // This will be improved when we can check customer history
                    
                    return (
                      <tr 
                        key={appointment.id} 
                        className={`hover:bg-white/5 ${effects.transitionNormal} border-l-4 ${
                          appointment.status === BookingStatus.CONFIRMED ? 'border-l-green-500' :
                          appointment.status === BookingStatus.PENDING ? 'border-l-gold-500' :
                          appointment.status === BookingStatus.CANCELLED ? 'border-l-red-500' :
                          appointment.status === BookingStatus.COMPLETED ? 'border-l-gray-500' :
                          'border-l-transparent'
                        }`}
                      >
                        <td className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(appointment.id)}
                            onChange={(e) => handleSelectOne(appointment.id, e.target.checked)}
                            className="checkbox checkbox-sm border-gold-500/30 checked:border-gold-500 [--chkbg:#C9A449] [--chkfg:#080808]"
                          />
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar placeholder">
                              <div className={`bg-gradient-to-br from-gold-500 to-gold-600 ${colors.textPrimary} rounded-full w-10`}>
                                <User className="w-5 h-5" />
                              </div>
                            </div>
                            <div>
                              <div className={`${typography.fontSemibold} ${colors.textPrimary}`}>
                                {appointment.customer?.name || 'Anonymous'}
                              </div>
                              <div className={`${typography.textSm} ${colors.textMuted}`}>
                                {appointment.customer?.email || appointment.contactEmail || 'No email'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={`flex items-center gap-2 ${colors.textSecondary}`}>
                            <Calendar className={`w-4 h-4 ${colors.textAccent}`} />
                            <div>
                              <div className={`${typography.fontMedium}`}>{date}</div>
                              <div className={`${typography.textSm} ${colors.textMuted} flex items-center gap-1`}>
                                <Clock className="w-3 h-3" />
                                {time}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={colors.textSecondary}>
                            {appointment.artist ? (
                              <div>
                                <div className={`${typography.fontMedium} ${typography.textSm}`}>{appointment.artist.email.split('@')[0]}</div>
                                <div className={`${typography.textXs} ${colors.textMuted} capitalize`}>{appointment.artist.role}</div>
                              </div>
                            ) : (
                              <span className={`${colors.textMuted} ${typography.textSm}`}>Unassigned</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={colors.textSecondary}>
                            <div className={typography.fontMedium}>{getBookingTypeLabel(appointment.type)}</div>
                            <div className={`${typography.textSm} ${colors.textMuted}`}>{appointment.duration} minutes</div>
                          </div>
                        </td>
                        <td>
                          <span className={`inline-flex items-center px-2.5 py-0.5 ${components.radius.small} ${typography.textXs} ${typography.fontMedium} border ${
                            appointment.status === BookingStatus.CONFIRMED ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            appointment.status === BookingStatus.PENDING ? 'bg-gold-500/20 text-gold-400 border-gold-500/30' :
                            appointment.status === BookingStatus.COMPLETED ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
                            appointment.status === BookingStatus.CANCELLED ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          }`}>
                            {appointment.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-center">
                            {appointment.squareId ? (
                              <div className="tooltip" data-tip="Synced with Square">
                                <Cloud className="w-5 h-5 text-green-500" />
                              </div>
                            ) : appointment.customerId ? (
                              <div className="tooltip" data-tip="Not synced with Square">
                                <CloudOff className="w-5 h-5 text-gray-500" />
                              </div>
                            ) : (
                              <div className="tooltip" data-tip="Walk-in appointment">
                                <span className="text-xs text-gray-600">N/A</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          {appointment.priceQuote ? (
                            <div className={`flex items-center ${typography.fontMedium} ${colors.textAccent}`}>
                              <DollarSign className="w-4 h-4 mr-1" />
                              {appointment.priceQuote.toFixed(2)}
                            </div>
                          ) : (
                            <span className={colors.textMuted}>-</span>
                          )}
                        </td>
                        <td>
                          <div className="space-y-2">
                            {/* Quick payment actions */}
                            {appointment.customer && (
                              <QuickPaymentActions
                                customerId={appointment.customer.id}
                                customerName={appointment.customer.name}
                                appointmentId={appointment.id}
                                appointmentStatus={appointment.status}
                                currentPrice={appointment.priceQuote}
                                variant="compact"
                                onPaymentCreated={() => {
                                  // Refresh appointments when payment is created
                                  loadAppointments();
                                }}
                              />
                            )}
                            
                            {/* Inline payment history */}
                            {appointment.customer && (
                              <CustomerPaymentHistory
                                customerId={appointment.customer.id}
                                variant="inline"
                                className="mt-1"
                              />
                            )}
                          </div>
                        </td>
                        <td>
                          <AppointmentNotificationStatus 
                            appointmentId={appointment.id}
                            customerId={appointment.customerId || undefined}
                            compact={true}
                          />
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <Link 
                              href={`/dashboard/appointments/${appointment.id}`} 
                              className={`${components.button.base} ${components.button.sizes.small} ${components.button.variants.ghost} ${colors.textAccent} hover:${colors.textAccentProminent}`}
                            >
                              View
                            </Link>
                            <button 
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowCreateModal(true);
                              }}
                              className={`${components.button.base} ${components.button.sizes.small} ${components.button.variants.ghost} ${colors.textSecondary} hover:${colors.textPrimary}`}
                            >
                              Edit
                            </button>
                            {appointment.status !== BookingStatus.CANCELLED && (
                              <button 
                                onClick={() => handleCancelAppointment(appointment.id)}
                                className={`${components.button.base} ${components.button.sizes.small} ${components.button.variants.ghost} ${colors.textError} hover:text-red-300`}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className={`${colors.bgPrimary} border-t ${colors.borderSubtle} p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${typography.textSm} ${colors.textMuted}`}>
                    Showing <span className={`${typography.fontSemibold} ${colors.textPrimary}`}>{((filters.page - 1) * filters.limit) + 1}</span> to{' '}
                    <span className={`${typography.fontSemibold} ${colors.textPrimary}`}>{Math.min(filters.page * filters.limit, pagination.total)}</span> of{' '}
                    <span className={`${typography.fontSemibold} ${colors.textPrimary}`}>{pagination.total}</span> results
                  </p>
                </div>
                <div className="join">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className={`join-item btn btn-sm ${colors.bgSecondary} ${colors.borderSubtle} ${colors.textMuted} hover:bg-white/10 hover:${colors.textPrimary} ${effects.transitionNormal}`}
                  >
                    Previous
                  </button>
                  <button className={`join-item btn btn-sm btn-active ${colors.bgAccent} ${colors.textPrimary} ${colors.borderDefault}`}>
                    Page {filters.page} of {pagination.pages}
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page === pagination.pages}
                    className={`join-item btn btn-sm ${colors.bgSecondary} ${colors.borderSubtle} ${colors.textMuted} hover:bg-white/10 hover:${colors.textPrimary} ${effects.transitionNormal}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </DashboardCard>

      {/* Create/Edit Appointment Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedAppointment(null);
        }}
        title={selectedAppointment ? 'Edit Appointment' : 'New Appointment'}
        size="lg"
      >
        <AppointmentForm
          appointment={selectedAppointment}
          onSuccess={handleCreateSuccess}
          onCancel={() => {
            setShowCreateModal(false);
            setSelectedAppointment(null);
          }}
        />
      </Modal>
    </DashboardPageLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, DollarSign, User, Filter, Plus } from 'lucide-react';
import { AppointmentService, BookingStatus, BookingType, type AppointmentData } from '@/src/lib/api/services/appointmentService';
import { apiClient } from '@/src/lib/api/apiClient';
import Modal from '@/src/components/ui/Modal';
import AppointmentForm from '@/src/components/forms/AppointmentForm';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
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

  const appointmentService = new AppointmentService(apiClient);

  useEffect(() => {
    loadAppointments();
  }, [filters]);

  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await appointmentService.getAppointments({
        status: filters.status as BookingStatus || undefined,
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
  };

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
    <div className="p-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-smoke-900 mb-2">Appointments</h1>
          <p className="text-smoke-500 text-lg">Manage all your appointments</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/appointments/calendar"
            className="btn btn-outline btn-sm text-smoke-600 border-smoke-300 hover:bg-smoke-100 hover:border-smoke-400"
          >
            <Calendar className="w-4 h-4" />
            Calendar View
          </Link>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card bg-smoke-100 shadow-smoke hover:shadow-smoke-lg transition-all duration-300 border border-smoke-200 mb-6">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-smoke-700" />
            <span className="font-semibold text-smoke-900 text-lg">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-smoke-700 font-medium">Status</span>
              </label>
              <select 
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="select select-bordered bg-smoke-50 border-smoke-300 text-smoke-700 focus:border-smoke-500"
              >
                <option value="">All Statuses</option>
                {Object.values(BookingStatus).map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text text-smoke-700 font-medium">From Date</span>
              </label>
              <input 
                type="date"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value, page: 1 })}
                className="input input-bordered bg-smoke-50 border-smoke-300 text-smoke-700 focus:border-smoke-500"
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text text-smoke-700 font-medium">To Date</span>
              </label>
              <input 
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value, page: 1 })}
                className="input input-bordered bg-smoke-50 border-smoke-300 text-smoke-700 focus:border-smoke-500"
              />
            </div>
            
            <div className="form-control justify-end">
              <button
                onClick={() => setFilters({ status: '', from: '', to: '', page: 1, limit: 20 })}
                className="btn btn-ghost btn-block text-smoke-600 hover:bg-smoke-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="card bg-smoke-100 shadow-smoke hover:shadow-smoke-lg transition-all duration-300 border border-smoke-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <span className="loading loading-spinner loading-lg text-smoke-500"></span>
            <p className="mt-2 text-smoke-500">Loading appointments...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="alert alert-error">
              <span>{error}</span>
              <button 
                onClick={loadAppointments}
                className="btn btn-sm btn-ghost"
              >
                Retry
              </button>
            </div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-smoke-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-smoke-400" />
            <p className="text-lg font-medium">No appointments found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="border-smoke-300">
                    <th className="bg-gradient-to-r from-smoke-800 to-smoke-900 text-smoke-50">Client</th>
                    <th className="bg-gradient-to-r from-smoke-800 to-smoke-900 text-smoke-50">Date & Time</th>
                    <th className="bg-gradient-to-r from-smoke-800 to-smoke-900 text-smoke-50">Type</th>
                    <th className="bg-gradient-to-r from-smoke-800 to-smoke-900 text-smoke-50">Status</th>
                    <th className="bg-gradient-to-r from-smoke-800 to-smoke-900 text-smoke-50">Price</th>
                    <th className="bg-gradient-to-r from-smoke-800 to-smoke-900 text-smoke-50 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => {
                    const { date, time } = formatDateTime(appointment.startTime);
                    return (
                      <tr key={appointment.id} className="hover:bg-smoke-50 transition-colors border-smoke-200">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar placeholder">
                              <div className="bg-smoke-300 text-smoke-700 rounded-full w-10">
                                <User className="w-5 h-5" />
                              </div>
                            </div>
                            <div>
                              <div className="font-bold text-smoke-900">
                                {appointment.customer?.name || 'Anonymous'}
                              </div>
                              <div className="text-sm opacity-75 text-smoke-500">
                                {appointment.customer?.email || appointment.contactEmail || 'No email'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2 text-smoke-700">
                            <Calendar className="w-4 h-4 text-smoke-600" />
                            <div>
                              <div className="font-medium">{date}</div>
                              <div className="text-sm opacity-75 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {time}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="text-smoke-700">
                            <div className="font-medium">{getBookingTypeLabel(appointment.type)}</div>
                            <div className="text-sm opacity-75">{appointment.duration} minutes</div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getStatusColor(appointment.status)} badge-sm`}>
                            {appointment.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          {appointment.priceQuote ? (
                            <div className="flex items-center font-medium text-smoke-800">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {appointment.priceQuote.toFixed(2)}
                            </div>
                          ) : (
                            <span className="text-smoke-400">-</span>
                          )}
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <Link 
                              href={`/dashboard/appointments/${appointment.id}`} 
                              className="btn btn-ghost btn-xs text-smoke-600 hover:text-smoke-900"
                            >
                              View
                            </Link>
                            <button 
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowCreateModal(true);
                              }}
                              className="btn btn-ghost btn-xs text-smoke-600 hover:text-smoke-900"
                            >
                              Edit
                            </button>
                            {appointment.status !== BookingStatus.CANCELLED && (
                              <button 
                                onClick={() => handleCancelAppointment(appointment.id)}
                                className="btn btn-ghost btn-xs text-error"
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
            <div className="bg-smoke-50 border-t border-smoke-300 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-smoke-700">
                    Showing <span className="font-bold">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="font-bold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                    <span className="font-bold">{pagination.total}</span> results
                  </p>
                </div>
                <div className="join">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="join-item btn btn-sm"
                  >
                    Previous
                  </button>
                  <button className="join-item btn btn-sm btn-active">
                    Page {pagination.page} of {pagination.pages}
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page === pagination.pages}
                    className="join-item btn btn-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

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
    </div>
  );
}

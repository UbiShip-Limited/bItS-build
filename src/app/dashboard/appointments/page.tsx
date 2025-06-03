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
          <h1 className="text-3xl font-heading font-bold text-white mb-2 tracking-wide">Appointments</h1>
          <p className="text-gray-400 text-lg">Manage all your appointments</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/appointments/calendar"
            className="btn btn-ghost btn-sm text-gray-400 border border-[#1a1a1a] hover:border-[#C9A449]/30 hover:text-[#C9A449]"
          >
            <Calendar className="w-4 h-4" />
            Calendar View
          </Link>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-sm bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] border-0 shadow-lg shadow-[#C9A449]/20"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card bg-[#111111] shadow-2xl hover:shadow-[#C9A449]/10 hover:shadow-2xl transition-all duration-300 border border-[#1a1a1a] hover:border-[#C9A449]/20 mb-6">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-[#C9A449]" />
            <span className="font-semibold text-white text-lg">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-400 font-medium">Status</span>
              </label>
              <select 
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="select select-bordered bg-[#0a0a0a] border-[#1a1a1a] text-white focus:border-[#C9A449]/50 focus:outline-none"
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
                <span className="label-text text-gray-400 font-medium">From Date</span>
              </label>
              <input 
                type="date"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value, page: 1 })}
                className="input input-bordered bg-[#0a0a0a] border-[#1a1a1a] text-white focus:border-[#C9A449]/50 focus:outline-none"
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-400 font-medium">To Date</span>
              </label>
              <input 
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value, page: 1 })}
                className="input input-bordered bg-[#0a0a0a] border-[#1a1a1a] text-white focus:border-[#C9A449]/50 focus:outline-none"
              />
            </div>
            
            <div className="form-control justify-end">
              <button
                onClick={() => setFilters({ status: '', from: '', to: '', page: 1, limit: 20 })}
                className="btn btn-ghost btn-block text-gray-400 hover:text-white hover:bg-[#1a1a1a]/50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="card bg-[#111111] shadow-2xl hover:shadow-[#C9A449]/10 hover:shadow-2xl transition-all duration-300 border border-[#1a1a1a] hover:border-[#C9A449]/20 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <span className="loading loading-spinner loading-lg text-[#C9A449]"></span>
            <p className="mt-2 text-gray-400">Loading appointments...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="alert alert-error bg-red-500/10 border border-red-500/30">
              <span className="text-red-400">{error}</span>
              <button 
                onClick={loadAppointments}
                className="btn btn-sm btn-ghost text-red-400 hover:bg-red-500/10"
              >
                Retry
              </button>
            </div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-lg font-medium">No appointments found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="bg-[#080808] text-gray-400 text-xs font-medium uppercase tracking-wider">Client</th>
                    <th className="bg-[#080808] text-gray-400 text-xs font-medium uppercase tracking-wider">Date & Time</th>
                    <th className="bg-[#080808] text-gray-400 text-xs font-medium uppercase tracking-wider">Type</th>
                    <th className="bg-[#080808] text-gray-400 text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="bg-[#080808] text-gray-400 text-xs font-medium uppercase tracking-wider">Price</th>
                    <th className="bg-[#080808] text-gray-400 text-xs font-medium uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {appointments.map((appointment) => {
                    const { date, time } = formatDateTime(appointment.startTime);
                    return (
                      <tr key={appointment.id} className="hover:bg-[#1a1a1a]/50 transition-colors">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar placeholder">
                              <div className="bg-gradient-to-br from-[#C9A449] to-[#8B7635] text-[#080808] rounded-full w-10">
                                <User className="w-5 h-5" />
                              </div>
                            </div>
                            <div>
                              <div className="font-bold text-white">
                                {appointment.customer?.name || 'Anonymous'}
                              </div>
                              <div className="text-sm opacity-75 text-gray-500">
                                {appointment.customer?.email || appointment.contactEmail || 'No email'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="w-4 h-4 text-[#C9A449]" />
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
                          <div className="text-gray-300">
                            <div className="font-medium">{getBookingTypeLabel(appointment.type)}</div>
                            <div className="text-sm opacity-75">{appointment.duration} minutes</div>
                          </div>
                        </td>
                        <td>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            appointment.status === BookingStatus.CONFIRMED ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            appointment.status === BookingStatus.PENDING ? 'bg-[#C9A449]/20 text-[#C9A449] border-[#C9A449]/30' :
                            appointment.status === BookingStatus.COMPLETED ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
                            appointment.status === BookingStatus.CANCELLED ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          }`}>
                            {appointment.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          {appointment.priceQuote ? (
                            <div className="flex items-center font-medium text-[#C9A449]">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {appointment.priceQuote.toFixed(2)}
                            </div>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <Link 
                              href={`/dashboard/appointments/${appointment.id}`} 
                              className="btn btn-ghost btn-xs text-[#C9A449] hover:text-[#E5B563]"
                            >
                              View
                            </Link>
                            <button 
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowCreateModal(true);
                              }}
                              className="btn btn-ghost btn-xs text-gray-400 hover:text-white"
                            >
                              Edit
                            </button>
                            {appointment.status !== BookingStatus.CANCELLED && (
                              <button 
                                onClick={() => handleCancelAppointment(appointment.id)}
                                className="btn btn-ghost btn-xs text-red-400 hover:text-red-300"
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
            <div className="bg-[#080808] border-t border-[#1a1a1a] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    Showing <span className="font-bold text-white">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="font-bold text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                    <span className="font-bold text-white">{pagination.total}</span> results
                  </p>
                </div>
                <div className="join">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="join-item btn btn-sm bg-[#111111] border-[#1a1a1a] text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
                  >
                    Previous
                  </button>
                  <button className="join-item btn btn-sm btn-active bg-[#C9A449] text-[#080808] border-[#C9A449]">
                    Page {pagination.page} of {pagination.pages}
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page === pagination.pages}
                    className="join-item btn btn-sm bg-[#111111] border-[#1a1a1a] text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
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

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
      [BookingStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [BookingStatus.SCHEDULED]: 'bg-blue-100 text-blue-800',
      [BookingStatus.CONFIRMED]: 'bg-green-100 text-green-800',
      [BookingStatus.COMPLETED]: 'bg-gray-100 text-gray-800',
      [BookingStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [BookingStatus.NO_SHOW]: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-gray-600">Manage all your appointments</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/appointments/calendar"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Calendar View
          </Link>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input 
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value, page: 1 })}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input 
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value, page: 1 })}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', from: '', to: '', page: 1, limit: 20 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading appointments...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p>{error}</p>
            <button 
              onClick={loadAppointments}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No appointments found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => {
                    const { date, time } = formatDateTime(appointment.startTime);
                    return (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-8 h-8 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {appointment.customer?.name || 'Anonymous'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {appointment.customer?.email || appointment.contactEmail || 'No email'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-gray-900">{date}</div>
                              <div className="text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {time}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getBookingTypeLabel(appointment.type)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {appointment.duration} minutes
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                            {appointment.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {appointment.priceQuote ? (
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                              {appointment.priceQuote.toFixed(2)}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link 
                            href={`/dashboard/appointments/${appointment.id}`} 
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            View
                          </Link>
                          <button 
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowCreateModal(true);
                            }}
                            className="text-gray-600 hover:text-gray-900 mr-4"
                          >
                            Edit
                          </button>
                          {appointment.status !== BookingStatus.CANCELLED && (
                            <button 
                              onClick={() => handleCancelAppointment(appointment.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="bg-white px-4 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                    <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page === pagination.pages}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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

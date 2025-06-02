'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  DollarSign, 
  FileText, 
  ArrowLeft,
  Edit,
  XCircle,
  CheckCircle
} from 'lucide-react';
import { AppointmentService, BookingStatus, BookingType, type AppointmentData } from '@/src/lib/api/services/appointmentService';
import { apiClient } from '@/src/lib/api/apiClient';
import Modal from '@/src/components/ui/Modal';
import AppointmentForm from '@/src/components/forms/AppointmentForm';
import PaymentButton, { PaymentDropdown } from '@/src/components/payments/PaymentButton';
import { PaymentType } from '@/src/lib/api/services/paymentService';

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  const appointmentService = new AppointmentService(apiClient);

  useEffect(() => {
    if (params.id) {
      loadAppointment(params.id as string);
    }
  }, [params.id]);

  const loadAppointment = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await appointmentService.getAppointment(id);
      setAppointment(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: BookingStatus) => {
    if (!appointment || updating) return;
    
    setUpdating(true);
    try {
      await appointmentService.updateAppointment(appointment.id, { status: newStatus });
      await loadAppointment(appointment.id);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment || !confirm('Are you sure you want to cancel this appointment?')) return;
    
    setUpdating(true);
    try {
      await appointmentService.cancelAppointment(appointment.id, 'Cancelled by admin');
      await loadAppointment(appointment.id);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setUpdating(false);
    }
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    if (appointment) {
      loadAppointment(appointment.id);
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
        weekday: 'long',
        month: 'long', 
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading appointment...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Appointment not found'}</p>
          <Link 
            href="/dashboard/appointments"
            className="text-blue-600 hover:text-blue-800"
          >
            Back to appointments
          </Link>
        </div>
      </div>
    );
  }

  const { date, time } = formatDateTime(appointment.startTime);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/dashboard/appointments"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to appointments
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Appointment Details</h1>
            <p className="text-gray-600">ID: {appointment.id}</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            {appointment.status !== BookingStatus.CANCELLED && (
              <button
                onClick={handleCancel}
                disabled={updating}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status and Type */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Appointment Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                  {appointment.status.replace('_', ' ')}
                </span>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Type</p>
                <p className="font-medium">{getBookingTypeLabel(appointment.type)}</p>
              </div>
            </div>

            {/* Quick Status Actions */}
            {appointment.status !== BookingStatus.CANCELLED && appointment.status !== BookingStatus.COMPLETED && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600 mb-3">Quick Actions</p>
                <div className="flex flex-wrap gap-2">
                  {appointment.status !== BookingStatus.CONFIRMED && (
                    <button
                      onClick={() => handleStatusUpdate(BookingStatus.CONFIRMED)}
                      disabled={updating}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Confirm
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusUpdate(BookingStatus.COMPLETED)}
                    disabled={updating}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50"
                  >
                    Mark Complete
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(BookingStatus.NO_SHOW)}
                    disabled={updating}
                    className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50"
                  >
                    No Show
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Date and Time */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Schedule</h2>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{date}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-medium">{time} ({appointment.duration} minutes)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Notes
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">{appointment.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column - Customer & Payment Info */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
            
            {appointment.customer ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{appointment.customer.name}</p>
                  </div>
                </div>
                
                {appointment.customer.email && (
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <a 
                        href={`mailto:${appointment.customer.email}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {appointment.customer.email}
                      </a>
                    </div>
                  </div>
                )}
                
                {appointment.customer.phone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <a 
                        href={`tel:${appointment.customer.phone}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {appointment.customer.phone}
                      </a>
                    </div>
                  </div>
                )}
                
                <div className="pt-3 mt-3 border-t">
                  <Link
                    href={`/dashboard/customers/${appointment.customer.id}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View customer profile →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Anonymous Booking</p>
                
                {appointment.contactEmail && (
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Contact Email</p>
                      <a 
                        href={`mailto:${appointment.contactEmail}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {appointment.contactEmail}
                      </a>
                    </div>
                  </div>
                )}
                
                {appointment.contactPhone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Contact Phone</p>
                      <a 
                        href={`tel:${appointment.contactPhone}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {appointment.contactPhone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
            
            {appointment.priceQuote && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">Quote Amount</p>
                <p className="text-2xl font-bold">${appointment.priceQuote.toFixed(2)}</p>
              </div>
            )}
            
            <div className="space-y-3">
              {/* Quick Payment Button */}
              {appointment.customerId && (
                <PaymentButton
                  customerId={appointment.customerId}
                  customerName={appointment.customer?.name}
                  appointmentId={appointment.id}
                  defaultAmount={appointment.priceQuote || 0}
                  defaultType={
                    appointment.type === BookingType.CONSULTATION ? PaymentType.CONSULTATION :
                    appointment.type === BookingType.TATTOO_SESSION ? PaymentType.TATTOO_FINAL :
                    PaymentType.TATTOO_DEPOSIT
                  }
                  buttonText="Request Payment"
                  onSuccess={() => {
                    // Refresh appointment data or show success message
                    console.log('Payment link created successfully');
                  }}
                />
              )}
              
              {/* Payment Options Dropdown (for invoices) */}
              {appointment.priceQuote && appointment.priceQuote > 200 && appointment.customerId && (
                <PaymentDropdown
                  customerId={appointment.customerId}
                  customerName={appointment.customer?.name}
                  appointmentId={appointment.id}
                  defaultAmount={appointment.priceQuote}
                  defaultType={PaymentType.TATTOO_DEPOSIT}
                  buttonText="Payment Options"
                  showInvoiceOption={true}
                  onSuccess={() => {
                    console.log('Payment created successfully');
                  }}
                />
              )}
            </div>
            
            {/* Payment History */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-3">Payment History</h3>
              <p className="text-sm text-gray-500">No payments recorded yet</p>
            </div>
          </div>

          {/* Related Information */}
          {(appointment.tattooRequestId || appointment.squareId) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Related Information</h2>
              
              <div className="space-y-3">
                {appointment.tattooRequestId && (
                  <div>
                    <p className="text-sm text-gray-600">Tattoo Request</p>
                    <Link
                      href={`/dashboard/tattoo-request/${appointment.tattooRequestId}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View tattoo request →
                    </Link>
                  </div>
                )}
                
                {appointment.squareId && (
                  <div>
                    <p className="text-sm text-gray-600">Square Booking ID</p>
                    <p className="text-sm font-mono">{appointment.squareId}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Appointment"
        size="lg"
      >
        <AppointmentForm
          appointment={appointment}
          onSuccess={handleEditSuccess}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>
    </div>
  );
}

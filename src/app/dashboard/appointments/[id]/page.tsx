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
  FileText, 
  ArrowLeft,
  Edit,
  XCircle,
  CheckCircle
} from 'lucide-react';
import { AppointmentApiClient, BookingStatus, BookingType, type AppointmentData } from '@/src/lib/api/services/appointmentApiClient';
import { apiClient } from '@/src/lib/api/apiClient';
import Modal from '@/src/components/ui/Modal';
import AppointmentForm from '@/src/components/forms/AppointmentForm';
import PaymentButton, { PaymentDropdown } from '@/src/components/payments/PaymentButton';
import { PaymentType } from '@/src/lib/api/services/paymentService';
import AppointmentNotificationStatus from '@/src/components/appointments/AppointmentNotificationStatus';
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';
import { generateDisplayName, getUserTypeBadge } from '@/src/lib/utils/displayNames';

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  const appointmentService = new AppointmentApiClient(apiClient);

  useEffect(() => {
    if (params?.id) {
      loadAppointment(params.id as string);
    }
  }, [params?.id]);

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
      [BookingStatus.PENDING]: 'bg-[#C9A449]/20 text-[#C9A449]',
      [BookingStatus.SCHEDULED]: 'bg-blue-500/20 text-blue-400',
      [BookingStatus.CONFIRMED]: 'bg-green-500/20 text-green-400',
      [BookingStatus.COMPLETED]: 'bg-gray-500/20 text-gray-400',
      [BookingStatus.CANCELLED]: 'bg-red-500/20 text-red-400',
      [BookingStatus.NO_SHOW]: 'bg-orange-500/20 text-orange-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
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
          <span className="loading loading-spinner loading-lg text-[#C9A449]"></span>
          <p className="mt-2 text-gray-400">Loading appointment...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Appointment not found'}</p>
          <Link 
            href="/dashboard/appointments"
            className="text-[#C9A449] hover:text-[#E5B563] transition-colors"
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
          className="inline-flex items-center text-white/50 hover:text-gold-500 mb-4 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to appointments
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-body text-4xl sm:text-4xl md:text-5xl font-semibold leading-tight text-white">Appointment Details</h1>
            <p className="text-white/50">ID: {appointment.id}</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="font-body font-medium tracking-wide relative overflow-hidden inline-flex items-center justify-center rounded-lg px-6 py-3 text-base bg-gold-500 text-obsidian hover:bg-gold-400 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            {appointment.status !== BookingStatus.CANCELLED && (
              <button
                onClick={handleCancel}
                disabled={updating}
                className="font-body font-medium tracking-wide relative overflow-hidden inline-flex items-center justify-center rounded-lg px-6 py-3 text-base bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30 flex gap-2 disabled:opacity-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
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
          <div className="bg-obsidian/95 backdrop-blur-sm rounded-2xl border border-gold-500/10 shadow-[0_4px_12px_rgba(0,0,0,0.1)] p-6 hover:border-gold-500/50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
            <h2 className="text-lg font-semibold mb-4 text-white">Appointment Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-white/50 mb-1">Status</p>
                <span className={`px-3 py-1 inline-flex ${typography.textSm} ${typography.fontSemibold} rounded-full ${getStatusColor(appointment.status)}`}>
                  {appointment.status.replace('_', ' ')}
                </span>
              </div>
              
              <div>
                <p className="text-sm text-white/50 mb-1">Type</p>
                <p className="font-medium text-white/70">{getBookingTypeLabel(appointment.type)}</p>
              </div>
            </div>

            {/* Quick Status Actions */}
            {appointment.status !== BookingStatus.CANCELLED && appointment.status !== BookingStatus.COMPLETED && (
              <div className="mt-6 pt-6 border-t border-gold-500/10">
                <p className="text-sm text-white/50 mb-3">Quick Actions</p>
                <div className="flex flex-wrap gap-2">
                  {appointment.status !== BookingStatus.CONFIRMED && (
                    <button
                      onClick={() => handleStatusUpdate(BookingStatus.CONFIRMED)}
                      disabled={updating}
                      className="font-body font-medium tracking-wide relative overflow-hidden inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Confirm
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusUpdate(BookingStatus.COMPLETED)}
                    disabled={updating}
                    className="font-body font-medium tracking-wide relative overflow-hidden inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30 disabled:opacity-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  >
                    Mark Complete
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(BookingStatus.NO_SHOW)}
                    disabled={updating}
                    className="font-body font-medium tracking-wide relative overflow-hidden inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 disabled:opacity-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  >
                    No Show
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Date and Time */}
          <div className="bg-obsidian/95 backdrop-blur-sm rounded-2xl border border-gold-500/10 shadow-[0_4px_12px_rgba(0,0,0,0.1)] p-6 hover:border-gold-500/50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
            <h2 className="text-lg font-semibold mb-4 text-white">Schedule</h2>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <Calendar className={`w-5 h-5 ${colors.textAccent} mr-3`} />
                <div>
                  <p className={`${typography.textSm} ${colors.textMuted}`}>Date</p>
                  <p className="font-medium text-white/70">{date}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className={`w-5 h-5 ${colors.textAccent} mr-3`} />
                <div>
                  <p className={`${typography.textSm} ${colors.textMuted}`}>Time</p>
                  <p className="font-medium text-white/70">{time} ({appointment.duration} minutes)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="bg-obsidian/95 backdrop-blur-sm rounded-2xl border border-gold-500/10 shadow-[0_4px_12px_rgba(0,0,0,0.1)] p-6 hover:border-gold-500/50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
              <h2 className={`${typography.textLg} ${typography.fontSemibold} mb-4 flex items-center ${colors.textPrimary}`}>
                <FileText className={`w-5 h-5 mr-2 ${colors.textAccent}`} />
                Notes
              </h2>
              <p className={`${colors.textSecondary} whitespace-pre-wrap`}>{appointment.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column - Customer & Payment Info */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-obsidian/95 backdrop-blur-sm rounded-2xl border border-gold-500/10 shadow-[0_4px_12px_rgba(0,0,0,0.1)] p-6 hover:border-gold-500/50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
            <h2 className="text-lg font-semibold mb-4 text-white">Customer Information</h2>
            
            {appointment.customer ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className={`w-5 h-5 ${colors.textAccent} mr-3`} />
                  <div>
                    <p className={`${typography.textSm} ${colors.textMuted}`}>Name</p>
                    <p className="font-medium text-white/70">{appointment.customer?.name || 'Unknown'}</p>
                  </div>
                </div>
                
                {appointment.customer?.email && (
                  <div className="flex items-center">
                    <Mail className={`w-5 h-5 ${colors.textAccent} mr-3`} />
                    <div>
                      <p className={`${typography.textSm} ${colors.textMuted}`}>Email</p>
                      <a 
                        href={`mailto:${appointment.customer.email}`}
                        className="font-medium text-gold-500 hover:text-gold-500/90 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                      >
                        {appointment.customer?.email}
                      </a>
                    </div>
                  </div>
                )}
                
                {appointment.customer?.phone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-[#C9A449] mr-3" />
                    <div>
                      <p className="text-sm text-gray-400">Phone</p>
                      <a 
                        href={`tel:${appointment.customer.phone}`}
                        className="font-medium text-gold-500 hover:text-gold-500/90 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                      >
                        {appointment.customer?.phone}
                      </a>
                    </div>
                  </div>
                )}
                
                <div className="pt-3 mt-3 border-t border-[#1a1a1a]">
                  <Link
                    href={`/dashboard/customers/${appointment.customer?.id}`}
                    className="text-sm text-[#C9A449] hover:text-[#E5B563] transition-colors"
                  >
                    View customer profile →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-300">
                    {generateDisplayName({ contactEmail: appointment.contactEmail })}
                  </p>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeBadge({ contactEmail: appointment.contactEmail }).className}`}>
                    {getUserTypeBadge({ contactEmail: appointment.contactEmail }).icon}
                  </span>
                </div>
                
                {appointment.contactEmail && (
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-[#C9A449] mr-3" />
                    <div>
                      <p className="text-sm text-gray-400">Contact Email</p>
                      <a 
                        href={`mailto:${appointment.contactEmail}`}
                        className="font-medium text-gold-500 hover:text-gold-500/90 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                      >
                        {appointment.contactEmail}
                      </a>
                    </div>
                  </div>
                )}
                
                {appointment.contactPhone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-[#C9A449] mr-3" />
                    <div>
                      <p className="text-sm text-gray-400">Contact Phone</p>
                      <a 
                        href={`tel:${appointment.contactPhone}`}
                        className="font-medium text-gold-500 hover:text-gold-500/90 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
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
          <div className="bg-obsidian/95 backdrop-blur-sm rounded-2xl border border-gold-500/10 shadow-[0_4px_12px_rgba(0,0,0,0.1)] p-6 hover:border-gold-500/50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
            <h2 className="text-lg font-semibold mb-4 text-white">Payment Information</h2>
            
            {appointment.priceQuote && (
              <div className="mb-4">
                <p className="text-sm text-gray-400">Quote Amount</p>
                <p className="text-2xl font-bold text-[#C9A449]">${appointment.priceQuote.toFixed(2)}</p>
              </div>
            )}
            
            <div className="space-y-3">
              {/* Quick Payment Button */}
              {appointment.customerId && (
                <PaymentButton
                  customerId={appointment.customerId}
                  customerName={appointment.customer?.name || undefined}
                  appointmentId={appointment.id}
                  defaultAmount={appointment.priceQuote ?? 0}
                  defaultType={
                    appointment.type === BookingType.CONSULTATION ? PaymentType.CONSULTATION :
                    appointment.type === BookingType.TATTOO_SESSION ? PaymentType.TATTOO_FINAL :
                    PaymentType.TATTOO_DEPOSIT
                  }
                  buttonText="Request Payment"
                  onSuccess={() => {
                    console.log('Payment link created successfully');
                  }}
                />
              )}
              
              {/* Payment Options Dropdown (for invoices) */}
              {appointment.priceQuote && appointment.priceQuote > 200 && appointment.customerId && (
                <PaymentDropdown
                  customerId={appointment.customerId}
                  customerName={appointment.customer?.name || undefined}
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
            <div className="mt-6 pt-6 border-t border-[#1a1a1a]">
              <h3 className="font-medium mb-3 text-gray-300">Payment History</h3>
              <p className="text-sm text-gray-500">No payments recorded yet</p>
            </div>
          </div>

          {/* Artist Information */}
          {appointment.artist && (
            <div className="bg-[#111111] rounded-2xl shadow-2xl p-6 border border-[#1a1a1a] hover:border-[#C9A449]/20 transition-all duration-300">
              <h2 className="text-lg font-semibold mb-4 text-white">Assigned Artist</h2>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-[#C9A449] mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">Artist</p>
                    <p className="font-medium text-gray-300">{appointment.artist?.email || 'Not assigned'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-5 h-5 flex items-center justify-center mr-3">
                    <span className="w-2 h-2 bg-[#C9A449] rounded-full"></span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Role</p>
                    <p className="font-medium text-gray-300 capitalize">{appointment.artist?.role || 'artist'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Related Information */}
          {(appointment.tattooRequestId || appointment.squareId) && (
            <div className="bg-[#111111] rounded-2xl shadow-2xl p-6 border border-[#1a1a1a] hover:border-[#C9A449]/20 transition-all duration-300">
              <h2 className="text-lg font-semibold mb-4 text-white">Related Information</h2>
              
              <div className="space-y-3">
                {appointment.tattooRequestId && (
                  <div>
                    <p className="text-sm text-gray-400">Tattoo Request</p>
                    <Link
                      href={`/dashboard/tattoo-request/${appointment.tattooRequestId}`}
                      className="text-sm text-[#C9A449] hover:text-[#E5B563] transition-colors"
                    >
                      View tattoo request →
                    </Link>
                  </div>
                )}
                
                {appointment.squareId && (
                  <div>
                    <p className="text-sm text-gray-400">Square Booking ID</p>
                    <p className="text-sm font-mono text-gray-300">{appointment.squareId}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-400">Appointment ID</p>
                  <p className="text-xs font-mono text-gray-500">{appointment.id}</p>
                </div>
                
                {appointment.createdAt && (
                  <div>
                    <p className="text-sm text-gray-400">Created</p>
                    <p className="text-sm text-gray-300">
                      {new Date(appointment.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
                
                {appointment.updatedAt && appointment.updatedAt !== appointment.createdAt && (
                  <div>
                    <p className="text-sm text-gray-400">Last Updated</p>
                    <p className="text-sm text-gray-300">
                      {new Date(appointment.updatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Communication History */}
          <div className="bg-[#111111] rounded-2xl shadow-2xl p-6 border border-[#1a1a1a] hover:border-[#C9A449]/20 transition-all duration-300">
            <h2 className="text-lg font-semibold mb-4 text-white">Communication History</h2>
            <AppointmentNotificationStatus 
              appointmentId={appointment.id} 
              customerId={appointment.customerId || undefined}
            />
          </div>

          {/* Administrative Information */}
          <div className="bg-[#111111] rounded-2xl shadow-2xl p-6 border border-[#1a1a1a] hover:border-[#C9A449]/20 transition-all duration-300">
            <h2 className="text-lg font-semibold mb-4 text-white">Administrative Details</h2>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Booking Source</p>
                  <p className="text-sm text-gray-300">
                    {appointment.squareId ? 'Square Online' : 'Manual Entry'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Customer Type</p>
                  <p className="text-sm text-gray-300">
                    {appointment.customer ? 'Registered Customer' : 'Walk-in/Anonymous'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Duration</p>
                  <p className="text-sm text-gray-300">{appointment.duration || 60} minutes</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Payment Required</p>
                  <p className="text-sm text-gray-300">
                    {appointment.priceQuote ? `$${appointment.priceQuote.toFixed(2)} CAD` : 'TBD'}
                  </p>
                </div>
              </div>

              {(appointment.contactEmail || appointment.contactPhone) && (
                <div className="pt-3 border-t border-[#1a1a1a]">
                  <p className="text-sm text-gray-400 mb-2">Direct Contact Info</p>
                  {appointment.contactEmail && (
                    <p className="text-sm text-gray-300">📧 {appointment.contactEmail}</p>
                  )}
                  {appointment.contactPhone && (
                    <p className="text-sm text-gray-300">📞 {appointment.contactPhone}</p>
                  )}
                </div>
              )}
            </div>
          </div>
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

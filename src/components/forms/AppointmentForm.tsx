'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookingType, BookingStatus, AppointmentApiClient } from '@/src/lib/api/services/appointmentApiClient';
import { apiClient } from '@/src/lib/api/apiClient';
import CustomerSelector from '@/src/components/dashboard/CustomerSelector';
import Modal from '@/src/components/ui/Modal';
import CustomerForm from '@/src/components/forms/CustomerForm';
import { toast } from '@/src/lib/toast';
import { Button } from '@/src/components/ui/button';

interface AppointmentFormProps {
  appointment?: any;
  customerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AppointmentForm({ 
  appointment, 
  customerId,
  onSuccess, 
  onCancel 
}: AppointmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  const appointmentClient = new AppointmentApiClient(apiClient);
  
  const [formData, setFormData] = useState({
    customerId: customerId || appointment?.customerId || '',
    contactEmail: appointment?.contactEmail || '',
    contactPhone: appointment?.contactPhone || '',
    startAt: appointment?.startTime ? new Date(appointment.startTime).toISOString().slice(0, 16) : '',
    duration: appointment?.duration || 60,
    bookingType: appointment?.type || BookingType.CONSULTATION,
    status: appointment?.status || BookingStatus.SCHEDULED,
    note: appointment?.notes || '',
    priceQuote: appointment?.priceQuote || '',
    isAnonymous: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    if (!formData.startAt) {
      setError('Date and time is required');
      setLoading(false);
      return;
    }

    if (!formData.duration || formData.duration < 30) {
      setError('Duration must be at least 30 minutes');
      setLoading(false);
      return;
    }

    if (formData.isAnonymous && !formData.contactEmail) {
      setError('Email is required for anonymous bookings');
      setLoading(false);
      return;
    }

    if (!formData.isAnonymous && !formData.customerId) {
      setError('Please select a customer or choose anonymous booking');
      setLoading(false);
      return;
    }

    try {
      const appointmentData: any = {
        startAt: new Date(formData.startAt).toISOString(),
        duration: formData.duration,
        bookingType: formData.bookingType,
        status: formData.status,
        note: formData.note,
        priceQuote: formData.priceQuote ? parseFloat(formData.priceQuote) : undefined
      };

      // Add customer info based on whether it's anonymous or not
      if (formData.isAnonymous) {
        appointmentData.contactEmail = formData.contactEmail;
        appointmentData.contactPhone = formData.contactPhone;
      } else {
        appointmentData.customerId = formData.customerId;
      }

      let appointmentResult;
      if (appointment) {
        // Update existing appointment
        appointmentResult = await appointmentClient.updateAppointment(appointment.id, appointmentData);
      } else {
        // Create new appointment
        if (formData.isAnonymous) {
          appointmentResult = await appointmentClient.createAnonymousAppointment({
            contactEmail: formData.contactEmail,
            contactPhone: formData.contactPhone,
            startAt: formData.startAt,
            duration: formData.duration,
            bookingType: formData.bookingType as BookingType.CONSULTATION | BookingType.DRAWING_CONSULTATION,
            note: formData.note
          });
        } else {
          appointmentResult = await appointmentClient.createAppointment(appointmentData);
        }
      }

      // Show success toast
      toast.success(appointment ? 'Appointment updated successfully!' : 'Appointment created successfully!');
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/appointments');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save appointment';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerCreated = () => {
    setShowCustomerModal(false);
    // The customer list will be refreshed when the selector searches again
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Customer Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Type
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                checked={!formData.isAnonymous}
                onChange={() => setFormData({ ...formData, isAnonymous: false })}
                className="mr-2"
              />
              <span>Existing Customer</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.isAnonymous}
                onChange={() => setFormData({ ...formData, isAnonymous: true, customerId: '' })}
                className="mr-2"
              />
              <span>Anonymous Booking (Consultation Only)</span>
            </label>
          </div>
        </div>

        {!formData.isAnonymous && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Customer
            </label>
            <CustomerSelector
              value={formData.customerId}
              onChange={(customerId) => setFormData({ ...formData, customerId: customerId || '' })}
              onCreateNew={() => setShowCustomerModal(true)}
              required={!formData.isAnonymous}
              disabled={formData.isAnonymous}
            />
          </div>
        )}

        {/* Contact Information for Anonymous */}
        {formData.isAnonymous && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {/* Appointment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.startAt}
              onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes) *
            </label>
            <input
              type="number"
              required
              min="30"
              step="30"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Booking Type *
            </label>
            <select
              required
              value={formData.bookingType}
              onChange={(e) => setFormData({ ...formData, bookingType: e.target.value as BookingType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={formData.isAnonymous}
            >
              <option value={BookingType.CONSULTATION}>Consultation</option>
              <option value={BookingType.DRAWING_CONSULTATION}>Drawing Consultation</option>
              {!formData.isAnonymous && (
                <option value={BookingType.TATTOO_SESSION}>Tattoo Session</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as BookingStatus })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={BookingStatus.PENDING}>Pending</option>
              <option value={BookingStatus.SCHEDULED}>Scheduled</option>
              <option value={BookingStatus.CONFIRMED}>Confirmed</option>
              <option value={BookingStatus.COMPLETED}>Completed</option>
              <option value={BookingStatus.CANCELLED}>Cancelled</option>
              <option value={BookingStatus.NO_SHOW}>No Show</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Quote
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.priceQuote}
            onChange={(e) => setFormData({ ...formData, priceQuote: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            rows={4}
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any additional notes about the appointment..."
          />
        </div>

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              size="md"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            size="md"
          >
            {loading ? 'Saving...' : appointment ? 'Update Appointment' : 'Create Appointment'}
          </Button>
        </div>
      </form>

      {/* Create Customer Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="New Customer"
      >
        <CustomerForm
          onSuccess={handleCustomerCreated}
          onCancel={() => setShowCustomerModal(false)}
        />
      </Modal>
    </>
  );
} 
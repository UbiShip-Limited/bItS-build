'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookingType, BookingStatus } from '@/src/lib/api/services/appointmentService';
import { apiClient } from '@/src/lib/api/apiClient';
import { CustomerService } from '@/src/lib/api/services/customerService';

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
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  
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

  // Load customers for selection
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const customerService = new CustomerService(apiClient);
      const response = await customerService.getCustomers({ limit: 100 });
      setCustomers(response.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
      } else if (formData.customerId) {
        appointmentData.customerId = formData.customerId;
      } else {
        // Create appointment with customer details (will create customer if needed)
        appointmentData.customerEmail = formData.contactEmail;
        appointmentData.customerPhone = formData.contactPhone;
      }

      let response;
      if (appointment) {
        // Update existing appointment
        response = await apiClient.put(`/appointments/${appointment.id}`, appointmentData);
      } else {
        // Create new appointment
        if (formData.isAnonymous) {
          response = await apiClient.post('/appointments/anonymous', appointmentData);
        } else {
          response = await apiClient.post('/appointments', appointmentData);
        }
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/appointments');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSearch = async (searchTerm: string) => {
    if (searchTerm.length < 2) return;
    
    setSearchingCustomer(true);
    try {
      const customerService = new CustomerService(apiClient);
      const response = await customerService.searchCustomers(searchTerm);
      setCustomers(response.data);
    } catch (err) {
      console.error('Customer search failed:', err);
    } finally {
      setSearchingCustomer(false);
    }
  };

  return (
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
            <span>Existing or New Customer</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={formData.isAnonymous}
              onChange={() => setFormData({ ...formData, isAnonymous: true })}
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
          <select
            value={formData.customerId}
            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">-- Create New Customer --</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} ({customer.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Contact Information */}
      {(formData.isAnonymous || !formData.customerId) && (
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Any additional notes about the appointment..."
        />
      </div>

      <div className="flex justify-end space-x-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : appointment ? 'Update Appointment' : 'Create Appointment'}
        </button>
      </div>
    </form>
  );
} 
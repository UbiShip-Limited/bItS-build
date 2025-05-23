import React, { useState } from 'react';
import useTattooRequestForm from '../hooks/useTattooRequestForm';
import { useAppointments } from '../hooks/useAppointments';
import { BookingType, BookingStatus } from '../lib/api/services/appointmentService';

/**
 * Example component demonstrating the complete workflow from 
 * tattoo request submission to appointment creation
 */
export const TattooRequestToAppointmentFlow: React.FC = () => {
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedBookingType, setSelectedBookingType] = useState<BookingType>(BookingType.CONSULTATION);
  
  // Tattoo request form hook
  const {
    formData,
    isLoading: isSubmittingRequest,
    error: requestError,
    success: requestSuccess,
    response: tattooRequestResponse,
    handleInputChange,
    uploadImages,
    submitRequest,
    resetForm
  } = useTattooRequestForm();

  // Appointments hook
  const {
    createAnonymousAppointmentFromTattooRequest,
    createAppointmentFromTattooRequest,
    isLoading: isCreatingAppointment,
    error: appointmentError
  } = useAppointments();

  const handleTattooRequestSubmit = async () => {
    await submitRequest();
  };

  const handleCreateAnonymousAppointment = async () => {
    if (!tattooRequestResponse?.id) return;

    try {
      const appointment = await createAnonymousAppointmentFromTattooRequest(
        tattooRequestResponse.id,
        {
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          startAt: selectedDateTime,
          duration: selectedDuration,
          bookingType: selectedBookingType as BookingType.CONSULTATION | BookingType.DRAWING_CONSULTATION,
          note: `Created from tattoo request: ${tattooRequestResponse.description}`
        }
      );
      
      alert(`Appointment created successfully! ID: ${appointment.id}`);
      setShowAppointmentForm(false);
    } catch (error) {
      console.error('Failed to create appointment:', error);
    }
  };

  const handleCreateAppointmentWithCustomer = async () => {
    if (!tattooRequestResponse?.id) return;

    try {
      const appointment = await createAppointmentFromTattooRequest(
        tattooRequestResponse.id,
        {
          customerEmail: formData.contactEmail,
          customerPhone: formData.contactPhone,
          startAt: selectedDateTime,
          duration: selectedDuration,
          bookingType: selectedBookingType,
          status: BookingStatus.SCHEDULED,
          note: `Tattoo session from request: ${tattooRequestResponse.description}`
        }
      );
      
      alert(`Appointment created successfully! ID: ${appointment.id}`);
      setShowAppointmentForm(false);
    } catch (error) {
      console.error('Failed to create appointment:', error);
    }
  };

  if (requestSuccess && tattooRequestResponse) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-green-600 mb-4">
          Tattoo Request Submitted Successfully!
        </h2>
        
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <p><strong>Request ID:</strong> {tattooRequestResponse.id}</p>
          <p><strong>Description:</strong> {tattooRequestResponse.description}</p>
          {tattooRequestResponse.trackingToken && (
            <p><strong>Tracking Token:</strong> {tattooRequestResponse.trackingToken}</p>
          )}
        </div>

        {!showAppointmentForm ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Next Steps</h3>
            <p className="text-gray-600">
              Would you like to schedule an appointment for this tattoo request?
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setShowAppointmentForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Schedule Appointment
              </button>
              
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Schedule Appointment</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={selectedDateTime}
                  onChange={(e) => setSelectedDateTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appointment Type
                </label>
                <select
                  value={selectedBookingType}
                  onChange={(e) => setSelectedBookingType(e.target.value as BookingType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={BookingType.CONSULTATION}>Consultation</option>
                  <option value={BookingType.DRAWING_CONSULTATION}>Drawing Consultation</option>
                  <option value={BookingType.TATTOO_SESSION}>Tattoo Session</option>
                </select>
              </div>
            </div>

            {appointmentError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{appointmentError}</p>
              </div>
            )}

            <div className="flex space-x-4">
              {/* Anonymous appointment (for consultations) */}
              {(selectedBookingType === BookingType.CONSULTATION || 
                selectedBookingType === BookingType.DRAWING_CONSULTATION) && (
                <button
                  onClick={handleCreateAnonymousAppointment}
                  disabled={isCreatingAppointment || !selectedDateTime}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreatingAppointment ? 'Creating...' : 'Book Anonymous Consultation'}
                </button>
              )}
              
              {/* Regular appointment with customer creation */}
              <button
                onClick={handleCreateAppointmentWithCustomer}
                disabled={isCreatingAppointment || !selectedDateTime}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isCreatingAppointment ? 'Creating...' : 'Book Appointment'}
              </button>
              
              <button
                onClick={() => setShowAppointmentForm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>

            <div className="text-sm text-gray-600 mt-4">
              <p><strong>Note:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Anonymous consultations don't require full customer registration</li>
                <li>Regular appointments will create a customer record if needed</li>
                <li>All appointments are linked to your tattoo request</li>
                <li>You'll receive confirmation via email</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Submit Tattoo Request</h2>
      
      <form onSubmit={(e) => { e.preventDefault(); handleTattooRequestSubmit(); }} className="space-y-4">
        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Purpose *
          </label>
          <select
            name="purpose"
            value={formData.purpose}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select purpose</option>
            <option value="new_tattoo">New Tattoo</option>
            <option value="cover_up">Cover Up</option>
            <option value="touch_up">Touch Up</option>
            <option value="consultation">Consultation</option>
          </select>
        </div>

        {/* Contact Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Email *
          </label>
          <input
            type="email"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Contact Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Phone
          </label>
          <input
            type="tel"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your tattoo idea in detail..."
            required
          />
        </div>

        {/* Placement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Placement *
          </label>
          <input
            type="text"
            name="placement"
            value={formData.placement}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Upper arm, back, leg..."
            required
          />
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Size *
          </label>
          <select
            name="size"
            value={formData.size}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select size</option>
            <option value="small">Small (2-4 inches)</option>
            <option value="medium">Medium (4-8 inches)</option>
            <option value="large">Large (8+ inches)</option>
            <option value="full_piece">Full piece</option>
          </select>
        </div>

        {requestError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{requestError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmittingRequest}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmittingRequest ? 'Submitting...' : 'Submit Tattoo Request'}
        </button>
      </form>
    </div>
  );
};

export default TattooRequestToAppointmentFlow; 
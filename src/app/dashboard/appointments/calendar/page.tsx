'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, List } from 'lucide-react';
import { AppointmentService, type AppointmentData } from '@/src/lib/api/services/appointmentService';
import { apiClient } from '@/src/lib/api/apiClient';
import AppointmentCalendar from '@/src/components/dashboard/AppointmentCalendar';
import Modal from '@/src/components/ui/Modal';
import AppointmentForm from '@/src/components/forms/AppointmentForm';

export default function AppointmentCalendarPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);

  const appointmentService = new AppointmentService(apiClient);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load appointments for the current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const response = await appointmentService.getAppointments({
        from: firstDay.toISOString(),
        to: lastDay.toISOString(),
        limit: 100 // Get more appointments for calendar view
      });
      
      setAppointments(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // You could show appointments for that specific date
  };

  const handleAppointmentClick = (appointment: AppointmentData) => {
    router.push(`/dashboard/appointments/${appointment.id}`);
  };

  const handleCreateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedAppointment(null);
    setShowCreateModal(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setSelectedDate(null);
    setSelectedAppointment(null);
    loadAppointments();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Appointment Calendar</h1>
          <p className="text-gray-400">View and manage appointments in calendar view</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/appointments"
            className="px-4 py-2 border border-[#1a1a1a] text-gray-400 rounded-lg hover:border-[#C9A449]/30 hover:text-[#C9A449] hover:bg-[#1a1a1a]/50 flex items-center gap-2 transition-all duration-300"
          >
            <List className="w-4 h-4" />
            List View
          </Link>
          <button 
            onClick={() => {
              setSelectedDate(new Date());
              setShowCreateModal(true);
            }}
            className="bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] px-4 py-2 rounded-lg font-medium shadow-lg shadow-[#C9A449]/20 transition-all duration-300"
          >
            + New Appointment
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg text-[#C9A449]"></span>
            <p className="mt-2 text-gray-400">Loading calendar...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={loadAppointments}
              className="px-4 py-2 bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] rounded-lg font-medium shadow-lg shadow-[#C9A449]/20"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <AppointmentCalendar
          appointments={appointments}
          onDateClick={handleDateClick}
          onAppointmentClick={handleAppointmentClick}
          onCreateClick={handleCreateClick}
        />
      )}

      {/* Create Appointment Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedDate(null);
          setSelectedAppointment(null);
        }}
        title="New Appointment"
        size="lg"
      >
        <AppointmentForm
          appointment={selectedAppointment ? {
            ...selectedAppointment,
            startTime: selectedDate ? selectedDate.toISOString() : selectedAppointment.startTime
          } : selectedDate ? {
            startTime: selectedDate.toISOString()
          } : undefined}
          onSuccess={handleCreateSuccess}
          onCancel={() => {
            setShowCreateModal(false);
            setSelectedDate(null);
            setSelectedAppointment(null);
          }}
        />
      </Modal>
    </div>
  );
} 
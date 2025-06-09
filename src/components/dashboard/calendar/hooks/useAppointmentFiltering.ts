import { useState, useMemo } from 'react';
import { BookingStatus, type AppointmentData } from '@/src/lib/api/services/appointmentApiClient';
import { getTimeSlotKey } from '../../utils/calendarUtils';

export const useAppointmentFiltering = (appointments: AppointmentData[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');

  // Filter appointments based on search and status
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const matchesSearch = !searchTerm || 
        (appointment.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appointment.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appointment.customer?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || appointment.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  // Group appointments by date and time for efficient lookup
  const appointmentsByDateTime = useMemo(() => {
    const grouped: Record<string, Record<string, AppointmentData[]>> = {};
    
    filteredAppointments.forEach(appointment => {
      const date = new Date(appointment.startTime);
      const dateKey = date.toDateString();
      const timeKey = getTimeSlotKey(date);
      
      if (!grouped[dateKey]) grouped[dateKey] = {};
      if (!grouped[dateKey][timeKey]) grouped[dateKey][timeKey] = [];
      
      grouped[dateKey][timeKey].push(appointment);
    });

    return grouped;
  }, [filteredAppointments]);

  return {
    filteredAppointments,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    appointmentsByDateTime
  };
}; 
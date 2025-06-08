import { useMemo } from 'react';
import { BookingStatus, type AppointmentData } from '@/src/lib/api/services/appointmentApiClient';

export interface DayStats {
  total: number;
  confirmed: number;
  pending: number;
  completed: number;
  cancelled: number;
  revenue: number;
}

export const useCalendarStats = (appointments: AppointmentData[]) => {
  const dayStats = useMemo(() => {
    const stats: Record<string, DayStats> = {};
    
    appointments.forEach(appointment => {
      const dateKey = new Date(appointment.startTime).toDateString();
      
      if (!stats[dateKey]) {
        stats[dateKey] = {
          total: 0,
          confirmed: 0,
          pending: 0,
          completed: 0,
          cancelled: 0,
          revenue: 0
        };
      }
      
      stats[dateKey].total++;
      
      // Count by status
      switch (appointment.status) {
        case BookingStatus.CONFIRMED:
          stats[dateKey].confirmed++;
          break;
        case BookingStatus.PENDING:
        case BookingStatus.SCHEDULED:
          stats[dateKey].pending++;
          break;
        case BookingStatus.COMPLETED:
          stats[dateKey].completed++;
          break;
        case BookingStatus.CANCELLED:
        case BookingStatus.NO_SHOW:
          stats[dateKey].cancelled++;
          break;
      }
      
      // Add to revenue if appointment has price quote and is not cancelled
      if (appointment.priceQuote && 
          appointment.status !== BookingStatus.CANCELLED && 
          appointment.status !== BookingStatus.NO_SHOW) {
        stats[dateKey].revenue += appointment.priceQuote;
      }
    });

    return stats;
  }, [appointments]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const overall = {
      totalAppointments: appointments.length,
      totalRevenue: 0,
      pendingCount: 0,
      confirmedCount: 0,
      completedCount: 0,
      cancelledCount: 0
    };

    appointments.forEach(appointment => {
      if (appointment.priceQuote && 
          appointment.status !== BookingStatus.CANCELLED && 
          appointment.status !== BookingStatus.NO_SHOW) {
        overall.totalRevenue += appointment.priceQuote;
      }

      switch (appointment.status) {
        case BookingStatus.PENDING:
        case BookingStatus.SCHEDULED:
          overall.pendingCount++;
          break;
        case BookingStatus.CONFIRMED:
          overall.confirmedCount++;
          break;
        case BookingStatus.COMPLETED:
          overall.completedCount++;
          break;
        case BookingStatus.CANCELLED:
        case BookingStatus.NO_SHOW:
          overall.cancelledCount++;
          break;
      }
    });

    return overall;
  }, [appointments]);

  return {
    dayStats,
    overallStats
  };
}; 
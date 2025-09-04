import { BookingStatus } from '../../types/booking';
import { AnalyticsUtils, DateRange } from './analyticsUtils';
import type { PrismaClient } from '@prisma/client';

export interface AppointmentMetrics {
  today: { count: number; completed: number; remaining: number };
  week: { scheduled: number; completed: number; cancelled: number };
  metrics: {
    averageDuration: number;
    conversionRate: number;
    noShowRate: number;
    rebookingRate: number;
  };
}

export interface AppointmentStats {
  scheduled: number;
  completed: number;
  cancelled: number;
}

export interface AppointmentEfficiencyMetrics {
  averageDuration: number;
  conversionRate: number;
  noShowRate: number;
  rebookingRate: number;
}

/**
 * Service for appointment analytics and calculations
 */
export class AppointmentAnalyticsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get appointment count for a specific period
   */
  async getAppointmentCountForPeriod(start: Date, end: Date): Promise<number> {
    return this.prisma.appointment.count({
      where: {
        startTime: { gte: start, lte: end }
      }
    });
  }

  /**
   * Get comprehensive appointment metrics
   */
  async getAppointmentMetrics(
    today: DateRange,
    thisWeek: DateRange
  ): Promise<AppointmentMetrics> {
    // Combine queries to reduce database hits
    const [weekAppointments, efficiencyMetrics] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          startTime: {
            gte: Math.min(today.start.getTime(), thisWeek.start.getTime()) < new Date().getTime() ? 
              new Date(Math.min(today.start.getTime(), thisWeek.start.getTime())) : thisWeek.start,
            lte: new Date()
          }
        },
        select: {
          startTime: true,
          status: true,
        }
      }),
      this.getAppointmentEfficiencyMetrics()
    ]);

    // Calculate metrics from single query result
    const todayAppointments = weekAppointments.filter(a => 
      a.startTime && a.startTime >= today.start && a.startTime <= today.end
    );
    const todayCompleted = todayAppointments.filter(a => a.status === BookingStatus.COMPLETED);
    
    const thisWeekAppointments = weekAppointments.filter(a => 
      a.startTime && a.startTime >= thisWeek.start && a.startTime <= thisWeek.end
    );
    const weekCompleted = thisWeekAppointments.filter(a => a.status === BookingStatus.COMPLETED);
    const weekCancelled = thisWeekAppointments.filter(a => a.status === BookingStatus.CANCELLED);

    return {
      today: {
        count: todayAppointments.length,
        completed: todayCompleted.length,
        remaining: todayAppointments.length - todayCompleted.length
      },
      week: {
        scheduled: thisWeekAppointments.length,
        completed: weekCompleted.length,
        cancelled: weekCancelled.length
      },
      metrics: efficiencyMetrics
    };
  }

  /**
   * Get booking utilization percentage
   */
  async getBookingUtilization(): Promise<number> {
    // This is a simplified calculation - would need actual working hours configuration
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const totalAppointments = await this.getAppointmentCountForPeriod(thirtyDaysAgo, now);
    
    // Assuming 8 appointments per day max, 5 days a week, 4 weeks
    const maxPossibleAppointments = 8 * 5 * 4;
    
    return Math.min(100, (totalAppointments / maxPossibleAppointments) * 100);
  }

  /**
   * Get completed appointments for a period
   */
  private async getCompletedAppointmentsForPeriod(start: Date, end: Date): Promise<number> {
    return this.prisma.appointment.count({
      where: {
        startTime: { gte: start, lte: end },
        status: BookingStatus.COMPLETED
      }
    });
  }

  /**
   * Get appointment statistics for a period
   */
  private async getAppointmentStatsForPeriod(start: Date, end: Date): Promise<AppointmentStats> {
    const [scheduled, completed, cancelled] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          startTime: { gte: start, lte: end }
        }
      }),
      this.prisma.appointment.count({
        where: {
          startTime: { gte: start, lte: end },
          status: BookingStatus.COMPLETED
        }
      }),
      this.prisma.appointment.count({
        where: {
          startTime: { gte: start, lte: end },
          status: BookingStatus.CANCELLED
        }
      })
    ]);

    return { scheduled, completed, cancelled };
  }

  /**
   * Get appointment efficiency metrics
   */
  private async getAppointmentEfficiencyMetrics(): Promise<AppointmentEfficiencyMetrics> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalAppointments, completedAppointments, noShows, appointments] = await Promise.all([
      this.getAppointmentCountForPeriod(thirtyDaysAgo, now),
      this.getCompletedAppointmentsForPeriod(thirtyDaysAgo, now),
      this.prisma.appointment.count({
        where: {
          startTime: { gte: thirtyDaysAgo, lte: now },
          status: 'no_show'
        }
      }),
      this.prisma.appointment.findMany({
        where: {
          startTime: { gte: thirtyDaysAgo, lte: now },
          endTime: { not: null }
        },
        select: {
          startTime: true,
          endTime: true
        }
      })
    ]);

    // Calculate average duration in minutes
    const durations = appointments
      .filter(apt => apt.endTime && apt.startTime)
      .map(apt => {
        const duration = apt.endTime!.getTime() - apt.startTime!.getTime();
        return duration / (1000 * 60); // Convert to minutes
      });

    const averageDuration = durations.length > 0 
      ? AnalyticsUtils.calculateAverage(durations) 
      : 120; // Default 2 hours

    const conversionRate = totalAppointments > 0 
      ? (completedAppointments / totalAppointments) * 100 
      : 0;

    const noShowRate = totalAppointments > 0 
      ? (noShows / totalAppointments) * 100 
      : 0;

    // Simplified rebooking rate calculation
    const rebookingRate = 15; // This would need more complex logic to track actual rebookings

    return {
      averageDuration,
      conversionRate,
      noShowRate,
      rebookingRate
    };
  }
} 
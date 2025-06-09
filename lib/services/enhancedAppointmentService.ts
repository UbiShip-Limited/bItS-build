import { AppointmentService } from './appointmentService';
import { NotificationService, NotificationPriority } from './notificationService';
import { CommunicationService } from './communicationService';
import { WorkflowService } from './workflowService';
import { AnalyticsService } from './analyticsService';
import { realtimeService } from './realtimeService';
import { cacheService } from './cacheService';
import { prisma } from '../prisma/prisma';
import { BookingStatus, BookingType } from '../types/booking';
import type { Appointment } from '@prisma/client';

export interface AppointmentConflict {
  id: string;
  startTime: Date;
  endTime: Date;
  type: string;
  artistId?: string;
  customerName?: string;
}

export interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
  duration: number;
  isAvailable: boolean;
  artistId?: string;
}

export interface AppointmentMetrics {
  utilization: number;
  averageDuration: number;
  conversionRate: number;
  noShowRate: number;
  popularTimeSlots: Array<{ hour: number; count: number }>;
}

export interface BulkOperationResult {
  successful: string[];
  failed: Array<{ id: string; error: string }>;
  total: number;
}

/**
 * Enhanced Appointment Service with analytics, notifications, and automation
 * Extends the base AppointmentService with new dashboard features
 */
export class EnhancedAppointmentService extends AppointmentService {
  private notificationService: NotificationService;
  private communicationService: CommunicationService;
  private workflowService: WorkflowService;
  private analyticsService: AnalyticsService;

  constructor() {
    super();
    this.notificationService = new NotificationService();
    this.communicationService = new CommunicationService();
    this.workflowService = new WorkflowService();
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Enhanced appointment creation with automation
   */
  async create(data: any): Promise<Appointment> {
    // Create appointment using base service
    const appointment = await super.create(data);

    try {
      // Trigger workflows for appointment creation
      await this.workflowService.triggerWorkflows(
        'appointment_created',
        'appointment',
        appointment.id,
        { appointment, customer: data.customerId }
      );

      // Create notification
      await this.notificationService.createAppointmentNotification(
        'created',
        appointment.id,
        appointment.customerId || undefined,
        { appointmentType: appointment.type }
      );

      // Send confirmation email if customer has email
      if (appointment.customerId || data.contactEmail) {
        try {
          await this.communicationService.sendAppointmentConfirmation(appointment.id);
        } catch (emailError) {
          console.warn('Failed to send appointment confirmation:', emailError);
          // Don't fail the appointment creation for email issues
        }
      }

    } catch (automationError) {
      console.error('Automation failed for appointment creation:', automationError);
      // Continue - don't fail appointment creation for automation issues
    }

    return appointment;
  }

  /**
   * Enhanced appointment update with notifications
   */
  async update(id: string, data: any): Promise<Appointment> {
    const oldAppointment = await this.findById(id);
    const updatedAppointment = await super.update(id, data);

    try {
      // Trigger update workflows
      await this.workflowService.triggerWorkflows(
        'appointment_updated',
        'appointment',
        id,
        { 
          appointment: updatedAppointment, 
          previousAppointment: oldAppointment,
          changes: Object.keys(data)
        }
      );

      // Create notification for significant changes
      const significantChanges = ['startAt', 'artistId', 'status'];
      const hasSignificantChanges = significantChanges.some(field => field in data);

      if (hasSignificantChanges) {
        await this.notificationService.createAppointmentNotification(
          'updated',
          id,
          updatedAppointment.customerId || undefined,
          { changes: Object.keys(data) }
        );
      }

    } catch (automationError) {
      console.error('Automation failed for appointment update:', automationError);
    }

    return updatedAppointment;
  }

  /**
   * Enhanced appointment cancellation
   */
  async cancel(id: string, reason?: string, cancelledBy?: string): Promise<Appointment> {
    const cancelledAppointment = await super.cancel(id, reason, cancelledBy);

    try {
      // Trigger cancellation workflows
      await this.workflowService.triggerWorkflows(
        'appointment_cancelled',
        'appointment',
        id,
        { appointment: cancelledAppointment, reason, cancelledBy }
      );

      // Create high-priority notification
      await this.notificationService.createAppointmentNotification(
        'cancelled',
        id,
        cancelledAppointment.customerId || undefined,
        { reason, cancelledBy }
      );

    } catch (automationError) {
      console.error('Automation failed for appointment cancellation:', automationError);
    }

    return cancelledAppointment;
  }

  /**
   * Check for appointment conflicts with detailed information
   */
  async checkDetailedConflicts(
    startTime: Date, 
    endTime: Date, 
    artistId?: string, 
    excludeAppointmentId?: string
  ): Promise<AppointmentConflict[]> {
    const conflicts = await prisma.appointment.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                AND: [
                  { startTime: { lte: startTime } },
                  { endTime: { gt: startTime } }
                ]
              },
              {
                AND: [
                  { startTime: { lt: endTime } },
                  { endTime: { gte: endTime } }
                ]
              },
              {
                AND: [
                  { startTime: { gte: startTime } },
                  { endTime: { lte: endTime } }
                ]
              }
            ]
          },
          { status: { not: BookingStatus.CANCELLED } },
          ...(artistId ? [{ artistId }] : []),
          ...(excludeAppointmentId ? [{ id: { not: excludeAppointmentId } }] : [])
        ]
      },
      include: {
        customer: {
          select: { name: true }
        }
      }
    });

    return conflicts.map(conflict => ({
      id: conflict.id,
      startTime: conflict.startTime!,
      endTime: conflict.endTime!,
      type: conflict.type || 'Unknown',
      artistId: conflict.artistId || undefined,
      customerName: conflict.customer?.name || 'Anonymous'
    }));
  }

  /**
   * Suggest alternative appointment times
   */
  async suggestAlternativeTimes(
    preferredDate: Date,
    duration: number,
    artistId?: string,
    numberOfSuggestions: number = 5
  ): Promise<AvailabilitySlot[]> {
    const suggestions: AvailabilitySlot[] = [];
    const startOfDay = new Date(preferredDate);
    startOfDay.setHours(9, 0, 0, 0); // Business hours start at 9 AM
    
    const endOfDay = new Date(preferredDate);
    endOfDay.setHours(17, 0, 0, 0); // Business hours end at 5 PM

    // Check availability every 30 minutes
    for (let current = new Date(startOfDay); current < endOfDay; current.setMinutes(current.getMinutes() + 30)) {
      const slotEnd = new Date(current.getTime() + duration * 60000);
      
      if (slotEnd > endOfDay) break;

      const conflicts = await this.checkDetailedConflicts(current, slotEnd, artistId);
      
      if (conflicts.length === 0) {
        suggestions.push({
          startTime: new Date(current),
          endTime: slotEnd,
          duration,
          isAvailable: true,
          artistId
        });

        if (suggestions.length >= numberOfSuggestions) break;
      }
    }

    return suggestions;
  }

  /**
   * Get appointment metrics for analytics
   */
  async getAppointmentMetrics(period: 'week' | 'month' | 'quarter' = 'month'): Promise<AppointmentMetrics> {
    const startDate = this.getStartDateForPeriod(period);
    
    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: { gte: startDate },
        status: { not: BookingStatus.CANCELLED }
      },
      include: {
        customer: true
      }
    });

    // Calculate utilization (appointments vs available slots)
    const totalWorkingHours = this.getWorkingHoursInPeriod(period);
    const totalBookedHours = appointments.reduce((sum, apt) => sum + (apt.duration || 60), 0) / 60;
    const utilization = totalWorkingHours > 0 ? (totalBookedHours / totalWorkingHours) * 100 : 0;

    // Calculate average duration
    const averageDuration = appointments.length > 0 
      ? appointments.reduce((sum, apt) => sum + (apt.duration || 60), 0) / appointments.length 
      : 0;

    // Calculate no-show rate
    const noShowAppointments = appointments.filter(apt => apt.status === BookingStatus.NO_SHOW);
    const noShowRate = appointments.length > 0 ? (noShowAppointments.length / appointments.length) * 100 : 0;

    // Calculate conversion rate (scheduled -> completed)
    const completedAppointments = appointments.filter(apt => apt.status === BookingStatus.COMPLETED);
    const conversionRate = appointments.length > 0 ? (completedAppointments.length / appointments.length) * 100 : 0;

    // Calculate popular time slots
    const timeSlotCounts = new Map<number, number>();
    appointments.forEach(apt => {
      if (apt.startTime) {
        const hour = apt.startTime.getHours();
        timeSlotCounts.set(hour, (timeSlotCounts.get(hour) || 0) + 1);
      }
    });

    const popularTimeSlots = Array.from(timeSlotCounts.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      utilization: Math.round(utilization),
      averageDuration: Math.round(averageDuration),
      conversionRate: Math.round(conversionRate),
      noShowRate: Math.round(noShowRate),
      popularTimeSlots
    };
  }

  /**
   * Get detailed revenue analytics by appointment type
   */
  async getRevenueAnalytics(period: 'week' | 'month' | 'quarter' = 'month') {
    const startDate = this.getStartDateForPeriod(period);
    
    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: { gte: startDate },
        status: BookingStatus.COMPLETED,
        priceQuote: { not: null }
      },
      select: {
        type: true,
        priceQuote: true,
        startTime: true
      }
    });

    // Revenue by service type
    const revenueByType = appointments.reduce((acc, apt) => {
      const type = apt.type || 'Unknown';
      if (!acc[type]) {
        acc[type] = { revenue: 0, count: 0 };
      }
      acc[type].revenue += apt.priceQuote || 0;
      acc[type].count += 1;
      return acc;
    }, {} as Record<string, { revenue: number; count: number }>);

    // Daily revenue trend
    const dailyRevenue = appointments.reduce((acc, apt) => {
      if (apt.startTime) {
        const date = apt.startTime.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + (apt.priceQuote || 0);
      }
      return acc;
    }, {} as Record<string, number>);

    const totalRevenue = appointments.reduce((sum, apt) => sum + (apt.priceQuote || 0), 0);
    const averageAppointmentValue = appointments.length > 0 ? totalRevenue / appointments.length : 0;

    return {
      totalRevenue,
      averageAppointmentValue: Math.round(averageAppointmentValue),
      revenueByType: Object.entries(revenueByType).map(([type, data]) => ({
        type,
        revenue: data.revenue,
        count: data.count,
        averageValue: Math.round(data.revenue / data.count)
      })),
      dailyTrend: Object.entries(dailyRevenue).map(([date, revenue]) => ({
        date,
        revenue
      })).sort((a, b) => a.date.localeCompare(b.date))
    };
  }

  /**
   * Get artist performance analytics
   */
  async getArtistPerformance(period: 'week' | 'month' | 'quarter' = 'month') {
    const startDate = this.getStartDateForPeriod(period);
    
    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: { gte: startDate },
        status: { not: BookingStatus.CANCELLED },
        artistId: { not: null }
      },
      include: {
        artist: {
          select: { id: true, email: true }
        }
      }
    });

    interface ArtistStatsType {
      artistId: string;
      artistEmail: string;
      totalAppointments: number;
      completedAppointments: number;
      totalRevenue: number;
      totalHours: number;
    }

    const artistStats = appointments.reduce((acc, apt) => {
      const artistId = apt.artistId!;
      const artistEmail = apt.artist?.email || 'Unknown';
      
      if (!acc[artistId]) {
        acc[artistId] = {
          artistId,
          artistEmail,
          totalAppointments: 0,
          completedAppointments: 0,
          totalRevenue: 0,
          totalHours: 0
        };
      }
      
      acc[artistId].totalAppointments += 1;
      if (apt.status === BookingStatus.COMPLETED) {
        acc[artistId].completedAppointments += 1;
        acc[artistId].totalRevenue += apt.priceQuote || 0;
      }
      acc[artistId].totalHours += (apt.duration || 60) / 60;
      
      return acc;
    }, {} as Record<string, ArtistStatsType>);

    return Object.values(artistStats).map((stats: ArtistStatsType) => ({
      ...stats,
      completionRate: stats.totalAppointments > 0 ? 
        Math.round((stats.completedAppointments / stats.totalAppointments) * 100) : 0,
      averageRevenue: stats.completedAppointments > 0 ? 
        Math.round(stats.totalRevenue / stats.completedAppointments) : 0,
      utilizationHours: Math.round(stats.totalHours)
    }));
  }

  /**
   * Bulk update appointments
   */
  async bulkUpdate(
    appointmentIds: string[], 
    updates: Partial<any>
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      successful: [],
      failed: [],
      total: appointmentIds.length
    };

    for (const id of appointmentIds) {
      try {
        await this.update(id, updates);
        result.successful.push(id);
      } catch (error) {
        result.failed.push({
          id,
          error: error.message || 'Unknown error'
        });
      }
    }

    // Create notification for bulk operation
    if (result.total > 0) {
      await this.notificationService.createSystemAlert(
        'Bulk Operation Completed',
        `Updated ${result.successful.length}/${result.total} appointments`,
        NotificationPriority.MEDIUM,
        { operation: 'bulk_update', result }
      );
    }

    return result;
  }

  /**
   * Get upcoming appointments with notifications
   */
  async getUpcomingAppointments(hours: number = 24): Promise<Appointment[]> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: now,
          lte: futureTime
        },
        status: { in: [BookingStatus.SCHEDULED, BookingStatus.CONFIRMED] }
      },
      include: {
        customer: true,
        artist: true
      },
      orderBy: { startTime: 'asc' }
    });

    // Check if reminders need to be sent
    for (const appointment of upcomingAppointments) {
      if (appointment.startTime) {
        const hoursUntilAppointment = (appointment.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // Send reminder 24 hours before
        if (hoursUntilAppointment <= 24 && hoursUntilAppointment > 23) {
          try {
            await this.communicationService.scheduleReminder(appointment.id, 'day_before');
          } catch (error) {
            console.warn('Failed to schedule reminder:', error);
          }
        }
      }
    }

    return upcomingAppointments;
  }

  /**
   * Get appointment analytics for dashboard
   */
  async getDashboardAnalytics(): Promise<{
    todayStats: { total: number; completed: number; remaining: number };
    weeklyTrend: Array<{ date: string; count: number }>;
    utilization: number;
    popularServices: Array<{ service: string; count: number }>;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Today's stats
    const todayAppointments = await prisma.appointment.findMany({
      where: {
        startTime: { gte: today, lte: endOfToday }
      }
    });

    const todayStats = {
      total: todayAppointments.length,
      completed: todayAppointments.filter(apt => apt.status === BookingStatus.COMPLETED).length,
      remaining: todayAppointments.filter(apt => apt.status !== BookingStatus.COMPLETED && apt.status !== BookingStatus.CANCELLED).length
    };

    // Weekly trend (last 7 days)
    const weeklyTrend: Array<{ date: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = await prisma.appointment.count({
        where: {
          startTime: { gte: date, lt: nextDay },
          status: { not: BookingStatus.CANCELLED }
        }
      });

      weeklyTrend.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }

    // Get metrics for utilization
    const metrics = await this.getAppointmentMetrics('week');

    // Popular services (appointment types)
    const serviceStats = await prisma.appointment.groupBy({
      by: ['type'],
      where: {
        startTime: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        status: { not: BookingStatus.CANCELLED }
      },
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } },
      take: 5
    });

    const popularServices = serviceStats.map(stat => ({
      service: stat.type || 'Unknown',
      count: stat._count.type
    }));

    return {
      todayStats,
      weeklyTrend,
      utilization: metrics.utilization,
      popularServices
    };
  }

  // Private helper methods
  private getStartDateForPeriod(period: 'week' | 'month' | 'quarter'): Date {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }
  }

  private getWorkingHoursInPeriod(period: 'week' | 'month' | 'quarter'): number {
    // Assuming 8 hours/day, 5 days/week
    const workingHoursPerWeek = 8 * 5;
    
    switch (period) {
      case 'week':
        return workingHoursPerWeek;
      case 'month':
        return workingHoursPerWeek * 4;
      case 'quarter':
        return workingHoursPerWeek * 12;
    }
  }
} 
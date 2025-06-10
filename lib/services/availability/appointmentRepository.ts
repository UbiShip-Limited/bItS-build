import { prisma } from '../../prisma/prisma';
import { BookingStatus } from '../../types/booking';
import { Prisma } from '@prisma/client';
import { ExistingAppointment, AppointmentConflict } from './types';

export class AppointmentRepository {
  /**
   * Get existing appointments in a time range
   */
  async getExistingAppointments(
    startAtMin: Date,
    startAtMax: Date,
    teamMemberIds?: string[]
  ): Promise<ExistingAppointment[]> {
    const whereClause: Prisma.AppointmentWhereInput = {
      startTime: {
        gte: startAtMin,
        lte: startAtMax
      },
      status: {
        in: [BookingStatus.SCHEDULED, BookingStatus.CONFIRMED]
      }
    };

    if (teamMemberIds?.length) {
      whereClause.artistId = { in: teamMemberIds };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        duration: true,
        artistId: true,
        status: true
      }
    });

    return appointments.map(apt => ({
      id: apt.id,
      startTime: apt.startTime,
      endTime: apt.endTime,
      duration: apt.duration,
      artistId: apt.artistId,
      status: apt.status
    }));
  }

  /**
   * Check if a specific time slot is available
   */
  async isTimeSlotAvailable(
    startAt: Date,
    endAt: Date,
    teamMemberId?: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    const whereClause: Prisma.AppointmentWhereInput = {
      startTime: { lt: endAt },
      endTime: { gt: startAt },
      status: { in: [BookingStatus.SCHEDULED, BookingStatus.CONFIRMED] }
    };

    if (teamMemberId) {
      whereClause.artistId = teamMemberId;
    }

    if (excludeAppointmentId) {
      whereClause.id = { not: excludeAppointmentId };
    }

    const conflictingAppointments = await prisma.appointment.count({
      where: whereClause
    });

    return conflictingAppointments === 0;
  }

  /**
   * Get detailed appointment conflicts with customer information
   */
  async getDetailedConflicts(
    startTime: Date,
    endTime: Date,
    artistId?: string,
    excludeAppointmentId?: string
  ): Promise<AppointmentConflict[]> {
    const whereClause: Prisma.AppointmentWhereInput = {
      AND: [
        {
          OR: [
            // New appointment starts during existing appointment
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } }
              ]
            },
            // New appointment ends during existing appointment
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } }
              ]
            },
            // New appointment completely encompasses existing appointment
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } }
              ]
            }
          ]
        },
        { status: { not: BookingStatus.CANCELLED } }
      ]
    };

    // If artistId is provided, check conflicts for that artist
    if (artistId) {
      whereClause.artistId = artistId;
    }

    // Exclude current appointment if updating
    if (excludeAppointmentId) {
      whereClause.id = { not: excludeAppointmentId };
    }

    const conflicts = await prisma.appointment.findMany({
      where: whereClause,
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
   * Get team members (artists) for scheduling
   */
  async getTeamMembers(teamMemberIds?: string[]) {
    const whereClause = teamMemberIds?.length 
      ? { id: { in: teamMemberIds }, role: { in: ['artist', 'admin'] } }
      : { role: { in: ['artist', 'admin'] } };

    return prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
  }
} 
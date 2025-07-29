import { prisma } from '../prisma/prisma';
import { NotFoundError } from './errors';
import { AnalyticsService } from './analyticsService';
import type { Customer, TattooRequest } from '@prisma/client';

export interface CustomerProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  segment: 'new' | 'regular' | 'vip';
  totalSpent: number;
  appointmentCount: number;
  lastVisit?: Date;
}

export interface CustomerTimeline {
  customerId: string;
  events: Array<{
    id: string;
    type: string;
    title: string;
    date: Date;
    amount?: number;
  }>;
}

/**
 * Enhanced Customer Service with analytics integration
 */
export class EnhancedCustomerService {
  private analyticsService: AnalyticsService;

  constructor(prisma?: any) {
    this.analyticsService = new AnalyticsService(prisma || require('../prisma/prisma').prisma);
  }

  /**
   * Creates a new customer from the details of an anonymous tattoo request.
   * This is a common workflow when converting a request to an appointment.
   * @param tattooRequest - The anonymous tattoo request.
   * @returns The newly created customer.
   */
  async createFromTattooRequest(tattooRequest: TattooRequest): Promise<Customer> {
    if (!tattooRequest.contactEmail && !tattooRequest.contactPhone) {
      throw new Error('Cannot create customer without contact information from tattoo request.');
    }

    // Generate a name from email if available, otherwise use a fallback.
    const name = tattooRequest.contactEmail
      ? tattooRequest.contactEmail.split('@')[0]
      : 'New Customer';

    const customer = await prisma.customer.create({
      data: {
        name,
        email: tattooRequest.contactEmail,
        phone: tattooRequest.contactPhone,
        notes: `Created from tattoo request: ${tattooRequest.id}`,
      },
    });

    return customer;
  }

  async getCustomerProfile(customerId: string): Promise<CustomerProfile> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        appointments: { where: { status: 'completed' } },
        payments: { where: { status: 'completed' } }
      }
    });

    if (!customer) {
      throw new NotFoundError('Customer', customerId);
    }

    const totalSpent = customer.payments.reduce((sum, p) => sum + p.amount, 0);
    const appointmentCount = customer.appointments.length;
    
    // Determine segment
    let segment: 'new' | 'regular' | 'vip' = 'new';
    if (appointmentCount >= 4 || totalSpent >= 1000) {
      segment = 'vip';
    } else if (appointmentCount >= 1) {
      segment = 'regular';
    }

    const lastAppointment = customer.appointments
      .sort((a, b) => b.startTime!.getTime() - a.startTime!.getTime())[0];

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      segment,
      totalSpent,
      appointmentCount,
      lastVisit: lastAppointment?.startTime || undefined
    };
  }

  async getCustomerTimeline(customerId: string): Promise<CustomerTimeline> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        appointments: true,
        payments: true,
        tattooRequests: true
      }
    });

    if (!customer) {
      throw new NotFoundError('Customer', customerId);
    }

    const events: Array<{
      id: string;
      type: string;
      title: string;
      date: Date;
      amount?: number;
    }> = [];

    // Add appointment events
    customer.appointments.forEach(apt => {
      events.push({
        id: apt.id,
        type: 'appointment',
        title: `${apt.type || 'Appointment'} - ${apt.status}`,
        date: apt.startTime || apt.createdAt
      });
    });

    // Add payment events
    customer.payments.forEach(payment => {
      events.push({
        id: payment.id,
        type: 'payment',
        title: `Payment - ${payment.status}`,
        date: payment.createdAt,
        amount: payment.amount
      });
    });

    // Sort by date
    events.sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
      customerId,
      events
    };
  }

  async getCustomerInsights() {
    return this.analyticsService.getCustomerSegments();
  }
} 
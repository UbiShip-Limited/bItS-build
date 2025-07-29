import * as cron from 'node-cron';
import { prisma } from '../prisma/prisma';
import { emailTemplateService } from './emailTemplateService';
import { auditService } from './auditService';
import { RealtimeService } from './realtimeService';
import type { Appointment, Customer, TattooRequest, EmailAutomationLog } from '@prisma/client';
import { subHours, addHours, addDays, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export interface EmailAutomationType {
  appointment_reminder_24h: 'appointment_reminder_24h';
  appointment_reminder_2h: 'appointment_reminder_2h';
  aftercare_instructions: 'aftercare_instructions';
  review_request: 'review_request';
  re_engagement: 're_engagement';
  abandoned_request_recovery: 'abandoned_request_recovery';
}

export type EmailAutomationTypeKey = keyof EmailAutomationType;

interface EmailAutomationConfig {
  enabled: boolean;
  timingHours?: number;
  timingMinutes?: number;
  businessHoursOnly: boolean;
}

/**
 * Service for managing automated email workflows
 */
export class EmailAutomationService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private realtimeService: RealtimeService;
  private readonly timezone = 'America/Los_Angeles'; // Pacific Time
  private readonly businessStartHour = 9; // 9 AM
  private readonly businessEndHour = 20; // 8 PM
  
  constructor(realtimeService: RealtimeService) {
    this.realtimeService = realtimeService;
  }
  
  /**
   * Initialize all email automation cron jobs
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing email automation service...');
    
    // Run automation checks every 15 minutes
    const job = cron.schedule('*/15 * * * *', async () => {
      await this.runAutomationChecks();
    });
    
    this.jobs.set('automation_check', job);
    
    // Initialize default settings if they don't exist
    await this.initializeDefaultSettings();
    
    console.log('✅ Email automation service initialized');
  }
  
  /**
   * Stop all cron jobs
   */
  stop(): void {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped cron job: ${name}`);
    });
    this.jobs.clear();
  }
  
  /**
   * Initialize default automation settings
   */
  private async initializeDefaultSettings(): Promise<void> {
    const defaultSettings: Array<{
      emailType: EmailAutomationTypeKey;
      timingHours?: number;
      timingMinutes?: number;
    }> = [
      { emailType: 'appointment_reminder_24h', timingHours: 24 },
      { emailType: 'appointment_reminder_2h', timingHours: 2 },
      { emailType: 'aftercare_instructions', timingHours: 2 },
      { emailType: 'review_request', timingHours: 168 }, // 7 days
      { emailType: 're_engagement', timingHours: 2160 }, // 90 days
      { emailType: 'abandoned_request_recovery', timingHours: 48 }
    ];
    
    for (const setting of defaultSettings) {
      await prisma.emailAutomationSetting.upsert({
        where: { emailType: setting.emailType },
        update: {},
        create: {
          emailType: setting.emailType,
          enabled: true,
          timingHours: setting.timingHours,
          timingMinutes: setting.timingMinutes,
          businessHoursOnly: true
        }
      });
    }
  }
  
  /**
   * Run all automation checks
   */
  private async runAutomationChecks(): Promise<void> {
    try {
      console.log(`[EmailAutomation] Running automation checks at ${new Date().toISOString()}`);
      
      // Get all enabled automation settings
      const settings = await prisma.emailAutomationSetting.findMany({
        where: { enabled: true }
      });
      
      for (const setting of settings) {
        try {
          await this.processAutomationType(setting.emailType as EmailAutomationTypeKey, {
            enabled: setting.enabled,
            timingHours: setting.timingHours || 0,
            timingMinutes: setting.timingMinutes || 0,
            businessHoursOnly: setting.businessHoursOnly
          });
        } catch (error) {
          console.error(`[EmailAutomation] Error processing ${setting.emailType}:`, error);
          await auditService.log({
            action: 'EMAIL_AUTOMATION_ERROR',
            resource: 'EmailAutomation',
            details: {
              emailType: setting.emailType,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        }
      }
    } catch (error) {
      console.error('[EmailAutomation] Error in automation checks:', error);
    }
  }
  
  /**
   * Process a specific automation type
   */
  private async processAutomationType(
    type: EmailAutomationTypeKey,
    config: EmailAutomationConfig
  ): Promise<void> {
    if (!config.enabled) return;
    
    switch (type) {
      case 'appointment_reminder_24h':
        await this.processAppointmentReminders(24);
        break;
      case 'appointment_reminder_2h':
        await this.processAppointmentReminders(2);
        break;
      case 'aftercare_instructions':
        await this.processAftercareEmails();
        break;
      case 'review_request':
        await this.processReviewRequests();
        break;
      case 're_engagement':
        await this.processReEngagementEmails();
        break;
      case 'abandoned_request_recovery':
        await this.processAbandonedRequests();
        break;
    }
  }
  
  /**
   * Process appointment reminders
   */
  private async processAppointmentReminders(hoursBeforeAppointment: number): Promise<void> {
    const now = new Date();
    const targetTime = addHours(now, hoursBeforeAppointment);
    
    // Find appointments that need reminders
    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: targetTime,
          lt: addHours(targetTime, 0.25) // 15 minute window
        },
        status: {
          in: ['scheduled', 'confirmed']
        },
        customer: {
          emailUnsubscribed: false,
          email: {
            not: null
          }
        }
      },
      include: {
        customer: true,
        artist: true
      }
    });
    
    for (const appointment of appointments) {
      if (!appointment.customer?.email) continue;
      
      // Check if reminder was already sent
      const existingLog = await this.checkIfEmailSent(
        appointment.customerId!,
        appointment.id,
        hoursBeforeAppointment === 24 ? 'appointment_reminder_24h' : 'appointment_reminder_2h'
      );
      
      if (!existingLog) {
        await this.sendAppointmentReminder(appointment, hoursBeforeAppointment);
      }
    }
  }
  
  /**
   * Send appointment reminder email
   */
  private async sendAppointmentReminder(
    appointment: Appointment & { customer: Customer | null; artist: any },
    hoursBeforeAppointment: number
  ): Promise<void> {
    if (!appointment.customer?.email || !appointment.startTime) return;
    
    const templateName = hoursBeforeAppointment === 24 
      ? 'appointment_reminder_24h' 
      : 'appointment_reminder_2h';
    
    const timeUntil = hoursBeforeAppointment === 24 ? 'tomorrow' : `in ${hoursBeforeAppointment} hours`;
    const appointmentDate = formatInTimeZone(appointment.startTime, this.timezone, 'EEEE, MMMM d, yyyy');
    const appointmentTime = formatInTimeZone(appointment.startTime, this.timezone, 'h:mm a');
    
    try {
      // Check business hours if required
      if (!(await this.isWithinBusinessHours())) {
        console.log(`[EmailAutomation] Skipping ${templateName} - outside business hours`);
        return;
      }
      
      const result = await emailTemplateService.sendEmail(
        templateName,
        appointment.customer.email,
        {
          customerName: appointment.customer.name,
          timeUntil,
          appointmentDate,
          appointmentTime,
          duration: `${appointment.duration || 60} minutes`,
          artistName: appointment.artist?.name || 'Our team',
          appointmentType: appointment.type || 'Tattoo Session'
        }
      );
      
      // Log the sent email
      await this.logEmailSent({
        customerId: appointment.customerId!,
        appointmentId: appointment.id,
        emailType: templateName,
        emailAddress: appointment.customer.email,
        templateId: templateName,
        status: result.success ? 'sent' : 'failed',
        error: result.error
      });
      
      if (result.success) {
        await this.realtimeService.sendNotification({
          type: 'email_sent',
          title: 'Appointment Reminder Sent',
          message: `Reminder sent to ${appointment.customer.name} for appointment ${timeUntil}`,
          severity: 'info',
          metadata: {
            appointmentId: appointment.id,
            customerId: appointment.customerId,
            emailType: templateName
          }
        });
      }
    } catch (error) {
      console.error(`[EmailAutomation] Error sending ${templateName}:`, error);
      await this.logEmailSent({
        customerId: appointment.customerId!,
        appointmentId: appointment.id,
        emailType: templateName,
        emailAddress: appointment.customer.email,
        templateId: templateName,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Process aftercare instruction emails
   */
  private async processAftercareEmails(): Promise<void> {
    const now = new Date();
    const twoHoursAgo = subHours(now, 2);
    
    // Find completed appointments that need aftercare instructions
    const appointments = await prisma.appointment.findMany({
      where: {
        endTime: {
          gte: subHours(twoHoursAgo, 0.25), // 15 minute window
          lt: twoHoursAgo
        },
        status: 'completed',
        type: {
          in: ['tattoo_session', 'touch_up']
        },
        customer: {
          emailUnsubscribed: false,
          email: {
            not: null
          }
        }
      },
      include: {
        customer: true
      }
    });
    
    for (const appointment of appointments) {
      if (!appointment.customer?.email) continue;
      
      const existingLog = await this.checkIfEmailSent(
        appointment.customerId!,
        appointment.id,
        'aftercare_instructions'
      );
      
      if (!existingLog) {
        await this.sendAftercareInstructions(appointment);
      }
    }
  }
  
  /**
   * Send aftercare instructions email
   */
  private async sendAftercareInstructions(
    appointment: Appointment & { customer: Customer | null }
  ): Promise<void> {
    if (!appointment.customer?.email) return;
    
    try {
      if (!(await this.isWithinBusinessHours())) {
        console.log('[EmailAutomation] Skipping aftercare_instructions - outside business hours');
        return;
      }
      
      const result = await emailTemplateService.sendEmail(
        'aftercare_instructions',
        appointment.customer.email,
        {
          customerName: appointment.customer.name
        }
      );
      
      await this.logEmailSent({
        customerId: appointment.customerId!,
        appointmentId: appointment.id,
        emailType: 'aftercare_instructions',
        emailAddress: appointment.customer.email,
        templateId: 'aftercare_instructions',
        status: result.success ? 'sent' : 'failed',
        error: result.error
      });
      
      if (result.success) {
        await this.realtimeService.sendNotification({
          type: 'email_sent',
          title: 'Aftercare Instructions Sent',
          message: `Aftercare instructions sent to ${appointment.customer.name}`,
          severity: 'info',
          metadata: {
            appointmentId: appointment.id,
            customerId: appointment.customerId,
            emailType: 'aftercare_instructions'
          }
        });
      }
    } catch (error) {
      console.error('[EmailAutomation] Error sending aftercare instructions:', error);
      await this.logEmailSent({
        customerId: appointment.customerId!,
        appointmentId: appointment.id,
        emailType: 'aftercare_instructions',
        emailAddress: appointment.customer.email,
        templateId: 'aftercare_instructions',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Process review request emails
   */
  private async processReviewRequests(): Promise<void> {
    const now = new Date();
    const sevenDaysAgo = subHours(now, 168);
    
    // Find completed appointments that need review requests
    const appointments = await prisma.appointment.findMany({
      where: {
        endTime: {
          gte: subHours(sevenDaysAgo, 0.25),
          lt: sevenDaysAgo
        },
        status: 'completed',
        customer: {
          emailUnsubscribed: false,
          email: {
            not: null
          }
        }
      },
      include: {
        customer: true,
        artist: true
      }
    });
    
    for (const appointment of appointments) {
      if (!appointment.customer?.email) continue;
      
      const existingLog = await this.checkIfEmailSent(
        appointment.customerId!,
        appointment.id,
        'review_request'
      );
      
      if (!existingLog) {
        await this.sendReviewRequest(appointment);
      }
    }
  }
  
  /**
   * Send review request email
   */
  private async sendReviewRequest(
    appointment: Appointment & { customer: Customer | null; artist: any }
  ): Promise<void> {
    if (!appointment.customer?.email) return;
    
    try {
      if (!(await this.isWithinBusinessHours())) {
        console.log('[EmailAutomation] Skipping review_request - outside business hours');
        return;
      }
      
      const result = await emailTemplateService.sendEmail(
        'review_request',
        appointment.customer.email,
        {
          customerName: appointment.customer.name,
          artistName: appointment.artist?.name || 'our team',
          appointmentType: appointment.type || 'tattoo session'
        }
      );
      
      await this.logEmailSent({
        customerId: appointment.customerId!,
        appointmentId: appointment.id,
        emailType: 'review_request',
        emailAddress: appointment.customer.email,
        templateId: 'review_request',
        status: result.success ? 'sent' : 'failed',
        error: result.error
      });
      
      if (result.success) {
        await this.realtimeService.sendNotification({
          type: 'email_sent',
          title: 'Review Request Sent',
          message: `Review request sent to ${appointment.customer.name}`,
          severity: 'info',
          metadata: {
            appointmentId: appointment.id,
            customerId: appointment.customerId,
            emailType: 'review_request'
          }
        });
      }
    } catch (error) {
      console.error('[EmailAutomation] Error sending review request:', error);
      await this.logEmailSent({
        customerId: appointment.customerId!,
        appointmentId: appointment.id,
        emailType: 'review_request',
        emailAddress: appointment.customer.email,
        templateId: 'review_request',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Process re-engagement emails for inactive customers
   */
  private async processReEngagementEmails(): Promise<void> {
    const now = new Date();
    const ninetyDaysAgo = subDays(now, 90);
    
    // Find customers who haven't had activity in 90 days
    const inactiveCustomers = await prisma.customer.findMany({
      where: {
        emailUnsubscribed: false,
        email: {
          not: null
        },
        lastActivityDate: {
          lt: ninetyDaysAgo
        }
      }
    });
    
    for (const customer of inactiveCustomers) {
      if (!customer.email) continue;
      
      // Check if we've sent a re-engagement email in the last 30 days
      const recentEmail = await prisma.emailAutomationLog.findFirst({
        where: {
          customerId: customer.id,
          emailType: 're_engagement',
          sentAt: {
            gte: subDays(now, 30)
          }
        }
      });
      
      if (!recentEmail) {
        await this.sendReEngagementEmail(customer);
      }
    }
  }
  
  /**
   * Send re-engagement email
   */
  private async sendReEngagementEmail(customer: Customer): Promise<void> {
    if (!customer.email) return;
    
    try {
      if (!(await this.isWithinBusinessHours())) {
        console.log('[EmailAutomation] Skipping re_engagement - outside business hours');
        return;
      }
      
      const result = await emailTemplateService.sendEmail(
        're_engagement',
        customer.email,
        {
          customerName: customer.name
        }
      );
      
      await this.logEmailSent({
        customerId: customer.id,
        emailType: 're_engagement',
        emailAddress: customer.email,
        templateId: 're_engagement',
        status: result.success ? 'sent' : 'failed',
        error: result.error
      });
      
      if (result.success) {
        await this.realtimeService.sendNotification({
          type: 'email_sent',
          title: 'Re-engagement Email Sent',
          message: `Re-engagement email sent to ${customer.name}`,
          severity: 'info',
          metadata: {
            customerId: customer.id,
            emailType: 're_engagement'
          }
        });
      }
    } catch (error) {
      console.error('[EmailAutomation] Error sending re-engagement email:', error);
      await this.logEmailSent({
        customerId: customer.id,
        emailType: 're_engagement',
        emailAddress: customer.email,
        templateId: 're_engagement',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Process abandoned tattoo request recovery emails
   */
  private async processAbandonedRequests(): Promise<void> {
    const now = new Date();
    const fortyEightHoursAgo = subHours(now, 48);
    
    // Find tattoo requests that are still 'new' after 48 hours
    const abandonedRequests = await prisma.tattooRequest.findMany({
      where: {
        status: 'new',
        createdAt: {
          lt: fortyEightHoursAgo
        },
        customer: {
          emailUnsubscribed: false,
          email: {
            not: null
          }
        }
      },
      include: {
        customer: true
      }
    });
    
    for (const request of abandonedRequests) {
      const email = request.customer?.email || request.contactEmail;
      if (!email) continue;
      
      const existingLog = await this.checkIfEmailSent(
        request.customerId,
        undefined,
        'abandoned_request_recovery',
        request.id
      );
      
      if (!existingLog) {
        await this.sendAbandonedRequestRecovery(request);
      }
    }
  }
  
  /**
   * Send abandoned request recovery email
   */
  private async sendAbandonedRequestRecovery(
    request: TattooRequest & { customer: Customer | null }
  ): Promise<void> {
    const email = request.customer?.email || request.contactEmail;
    if (!email) return;
    
    try {
      if (!(await this.isWithinBusinessHours())) {
        console.log('[EmailAutomation] Skipping abandoned_request_recovery - outside business hours');
        return;
      }
      
      const customerName = request.customer?.name || 'there';
      const trackingUrl = request.trackingToken 
        ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/track-request/${request.trackingToken}`
        : '';
      
      const result = await emailTemplateService.sendEmail(
        'abandoned_request_recovery',
        email,
        {
          customerName,
          description: request.description.substring(0, 100) + '...',
          trackingUrl
        }
      );
      
      await this.logEmailSent({
        customerId: request.customerId,
        tattooRequestId: request.id,
        emailType: 'abandoned_request_recovery',
        emailAddress: email,
        templateId: 'abandoned_request_recovery',
        status: result.success ? 'sent' : 'failed',
        error: result.error
      });
      
      if (result.success) {
        await this.realtimeService.sendNotification({
          type: 'email_sent',
          title: 'Abandoned Request Recovery Sent',
          message: `Recovery email sent for tattoo request`,
          severity: 'info',
          metadata: {
            tattooRequestId: request.id,
            customerId: request.customerId,
            emailType: 'abandoned_request_recovery'
          }
        });
      }
    } catch (error) {
      console.error('[EmailAutomation] Error sending abandoned request recovery:', error);
      await this.logEmailSent({
        customerId: request.customerId,
        tattooRequestId: request.id,
        emailType: 'abandoned_request_recovery',
        emailAddress: email,
        templateId: 'abandoned_request_recovery',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Check if an email has already been sent
   */
  private async checkIfEmailSent(
    customerId: string | null,
    appointmentId: string | undefined,
    emailType: string,
    tattooRequestId?: string
  ): Promise<EmailAutomationLog | null> {
    const where: any = {
      emailType,
      status: 'sent'
    };
    
    if (customerId) where.customerId = customerId;
    if (appointmentId) where.appointmentId = appointmentId;
    if (tattooRequestId) where.tattooRequestId = tattooRequestId;
    
    return prisma.emailAutomationLog.findFirst({
      where,
      orderBy: { sentAt: 'desc' }
    });
  }
  
  /**
   * Log email sent
   */
  private async logEmailSent(data: {
    customerId?: string | null;
    appointmentId?: string;
    tattooRequestId?: string;
    emailType: string;
    emailAddress: string;
    templateId: string;
    status: string;
    error?: string | null;
    metadata?: any;
  }): Promise<void> {
    await prisma.emailAutomationLog.create({
      data: {
        customerId: data.customerId || null,
        appointmentId: data.appointmentId,
        tattooRequestId: data.tattooRequestId,
        emailType: data.emailType,
        emailAddress: data.emailAddress,
        templateId: data.templateId,
        sentAt: new Date(),
        status: data.status,
        error: data.error,
        metadata: data.metadata
      }
    });
  }
  
  /**
   * Check if current time is within business hours
   */
  private async isWithinBusinessHours(): Promise<boolean> {
    const now = new Date();
    const currentHour = parseInt(formatInTimeZone(now, this.timezone, 'H'));
    
    // Check if it's within business hours (9 AM - 8 PM PST)
    return currentHour >= this.businessStartHour && currentHour < this.businessEndHour;
  }
  
  /**
   * Get automation settings
   */
  async getSettings(): Promise<any[]> {
    return prisma.emailAutomationSetting.findMany({
      orderBy: { emailType: 'asc' }
    });
  }
  
  /**
   * Update automation settings
   */
  async updateSettings(
    emailType: EmailAutomationTypeKey,
    updates: Partial<EmailAutomationConfig>
  ): Promise<any> {
    return prisma.emailAutomationSetting.update({
      where: { emailType },
      data: updates
    });
  }
  
  /**
   * Get automation logs
   */
  async getLogs(filters: {
    emailType?: string;
    status?: string;
    customerId?: string;
    appointmentId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<EmailAutomationLog[]> {
    const where: any = {};
    
    if (filters.emailType) where.emailType = filters.emailType;
    if (filters.status) where.status = filters.status;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.appointmentId) where.appointmentId = filters.appointmentId;
    
    if (filters.startDate || filters.endDate) {
      where.sentAt = {};
      if (filters.startDate) where.sentAt.gte = filters.startDate;
      if (filters.endDate) where.sentAt.lte = filters.endDate;
    }
    
    return prisma.emailAutomationLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: filters.limit || 100,
      include: {
        customer: true,
        appointment: true,
        tattooRequest: true
      }
    });
  }
  
  /**
   * Manually trigger an automation for testing
   */
  async triggerAutomation(
    emailType: EmailAutomationTypeKey,
    targetId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (emailType) {
        case 'appointment_reminder_24h':
        case 'appointment_reminder_2h':
          const appointment = await prisma.appointment.findUnique({
            where: { id: targetId },
            include: { customer: true, artist: true }
          });
          if (!appointment) throw new Error('Appointment not found');
          await this.sendAppointmentReminder(
            appointment as any,
            emailType === 'appointment_reminder_24h' ? 24 : 2
          );
          break;
          
        case 'aftercare_instructions':
          const appointmentForAftercare = await prisma.appointment.findUnique({
            where: { id: targetId },
            include: { customer: true }
          });
          if (!appointmentForAftercare) throw new Error('Appointment not found');
          await this.sendAftercareInstructions(appointmentForAftercare as any);
          break;
          
        case 'review_request':
          const appointmentForReview = await prisma.appointment.findUnique({
            where: { id: targetId },
            include: { customer: true, artist: true }
          });
          if (!appointmentForReview) throw new Error('Appointment not found');
          await this.sendReviewRequest(appointmentForReview as any);
          break;
          
        case 're_engagement':
          const customer = await prisma.customer.findUnique({
            where: { id: targetId }
          });
          if (!customer) throw new Error('Customer not found');
          await this.sendReEngagementEmail(customer);
          break;
          
        case 'abandoned_request_recovery':
          const request = await prisma.tattooRequest.findUnique({
            where: { id: targetId },
            include: { customer: true }
          });
          if (!request) throw new Error('Tattoo request not found');
          await this.sendAbandonedRequestRecovery(request as any);
          break;
          
        default:
          throw new Error(`Unknown email type: ${emailType}`);
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Note: The singleton instance is created in server.ts with proper dependencies
// This export is for type reference and will be overridden at runtime
export let emailAutomationService: EmailAutomationService;
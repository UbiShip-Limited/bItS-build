import { PrismaClient } from '@prisma/client';
import { CommunicationService } from './communicationService';
import { EmailTemplateService } from './emailTemplateService';
import { EmailService } from './emailService';
import { differenceInDays, isWeekend, addDays } from 'date-fns';

export class PaymentReminderService {
  private prisma: PrismaClient;
  private communicationService: CommunicationService;
  private emailTemplateService: EmailTemplateService;
  private emailService: EmailService;

  constructor(
    prisma: PrismaClient,
    communicationService: CommunicationService,
    emailTemplateService: EmailTemplateService
  ) {
    this.prisma = prisma;
    this.communicationService = communicationService;
    this.emailTemplateService = emailTemplateService;
    this.emailService = new EmailService();
  }

  /**
   * Main method to process payment reminders
   * Should be called by a cron job daily
   */
  async processPaymentReminders(): Promise<{
    processed: number;
    sent: number;
    errors: number;
  }> {
    const stats = { processed: 0, sent: 0, errors: 0 };

    try {
      // Get all active payment links that might need reminders
      const paymentLinks = await this.prisma.paymentLink.findMany({
        where: {
          status: 'active',
          enableReminders: true,
          reminderCount: { lt: 3 }, // Max 3 reminders
          deletedAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: {
          customer: true
        }
      });

      stats.processed = paymentLinks.length;
      console.log(`📧 Processing ${paymentLinks.length} payment links for reminders`);

      for (const link of paymentLinks) {
        try {
          const shouldSend = await this.shouldSendReminder(link);
          
          if (shouldSend) {
            await this.sendPaymentReminder(link);
            stats.sent++;
            
            // Update reminder tracking
            await this.prisma.paymentLink.update({
              where: { id: link.id },
              data: {
                lastReminderSent: new Date(),
                reminderCount: link.reminderCount + 1
              }
            });
            
            console.log(`✅ Reminder sent for payment link ${link.id} to ${link.customer.name}`);
          }
        } catch (error) {
          console.error(`❌ Error processing reminder for link ${link.id}:`, error);
          stats.errors++;
        }
      }

      // Log summary
      await this.prisma.auditLog.create({
        data: {
          action: 'payment_reminders_processed',
          resource: 'payment_reminder',
          resourceId: 'batch',
          details: stats
        }
      });

      return stats;
    } catch (error) {
      console.error('Error processing payment reminders:', error);
      throw error;
    }
  }

  /**
   * Determine if a reminder should be sent for this payment link
   */
  private async shouldSendReminder(link: any): Promise<boolean> {
    // Don't send on weekends
    if (isWeekend(new Date())) {
      return false;
    }

    // Check if customer has unsubscribed
    if (link.customer.emailUnsubscribed) {
      return false;
    }

    // Parse reminder schedule (defaults to [2, 7, 14] days)
    const schedule = link.reminderSchedule as number[] || [2, 7, 14];
    
    // Get days since link was created
    const daysSinceCreation = differenceInDays(new Date(), new Date(link.createdAt));
    
    // Get days since last reminder (if any)
    const daysSinceLastReminder = link.lastReminderSent 
      ? differenceInDays(new Date(), new Date(link.lastReminderSent))
      : null;

    // Check if we're at a scheduled reminder day
    const reminderIndex = link.reminderCount;
    if (reminderIndex >= schedule.length) {
      return false; // Already sent all scheduled reminders
    }

    const scheduledDay = schedule[reminderIndex];
    
    // For first reminder, check days since creation
    if (reminderIndex === 0) {
      return daysSinceCreation >= scheduledDay;
    }
    
    // For subsequent reminders, check days since last reminder
    const daysBetweenReminders = schedule[reminderIndex] - schedule[reminderIndex - 1];
    return daysSinceLastReminder !== null && daysSinceLastReminder >= daysBetweenReminders;
  }

  /**
   * Send a payment reminder email
   */
  private async sendPaymentReminder(link: any): Promise<void> {
    const reminderNumber = link.reminderCount + 1;
    const isLastReminder = reminderNumber >= 3;
    
    // Get or create reminder template
    const template = await this.getOrCreateReminderTemplate(reminderNumber, isLastReminder);
    
    // Replace variables in template
    const emailContent = this.replaceTemplateVariables(template, {
      customerName: link.customer.name || 'Valued Customer',
      amount: `$${link.amount.toFixed(2)} CAD`,
      paymentLink: link.url,
      reminderNumber: reminderNumber.toString(),
      daysOverdue: differenceInDays(new Date(), new Date(link.createdAt)).toString(),
      paymentType: link.metadata?.paymentType || 'payment',
      shopName: 'Bowen Island Tattoo Shop'
    });

    // Send email  
    await this.emailService.send({
      to: link.customer.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });

    // Also notify owner about the reminder
    if (reminderNumber === 3) {
      await this.communicationService.sendOwnerPaymentNotification({
        id: link.id,
        amount: link.amount,
        customerName: link.customer.name,
        paymentMethod: 'Pending',
        appointmentId: link.appointmentId || undefined,
        transactionId: `reminder-${link.id}`
      });
    }
  }

  /**
   * Get or create email template for reminders
   */
  private async getOrCreateReminderTemplate(reminderNumber: number, isLast: boolean) {
    const templateKey = `payment_reminder_${reminderNumber}`;
    
    // Try to get existing template
    let template = await this.prisma.emailTemplate.findFirst({
      where: { 
        name: templateKey,
        isActive: true
      }
    });

    // If no template exists, create default
    if (!template) {
      const defaultTemplate = this.getDefaultReminderTemplate(reminderNumber, isLast);
      template = await this.prisma.emailTemplate.create({
        data: {
          name: templateKey,
          displayName: `Payment Reminder ${reminderNumber}`,
          subject: defaultTemplate.subject,
          body: defaultTemplate.text,
          htmlBody: defaultTemplate.html,
          variables: ['customerName', 'amount', 'paymentLink', 'reminderNumber', 'daysOverdue'],
          isActive: true
        }
      });
    }

    return template;
  }

  /**
   * Get default reminder template based on reminder number
   */
  private getDefaultReminderTemplate(reminderNumber: number, isLast: boolean) {
    const templates = {
      1: {
        subject: 'Payment Reminder - {{shopName}}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #C9A449;">Payment Reminder</h2>
            <p>Hi {{customerName}},</p>
            <p>This is a friendly reminder that you have an outstanding payment of <strong>{{amount}}</strong> with Bowen Island Tattoo Shop.</p>
            <p>Please complete your payment at your earliest convenience:</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="{{paymentLink}}" style="background-color: #C9A449; color: #080808; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Complete Payment
              </a>
            </div>
            <p>If you've already made this payment, please disregard this email.</p>
            <p>Thank you!</p>
          </div>
        `,
        text: `Payment Reminder\n\nHi {{customerName}},\n\nYou have an outstanding payment of {{amount}}.\n\nPlease complete your payment here: {{paymentLink}}\n\nThank you!`
      },
      2: {
        subject: 'Second Payment Reminder - {{shopName}}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #C9A449;">Second Payment Reminder</h2>
            <p>Hi {{customerName}},</p>
            <p>We haven't received your payment of <strong>{{amount}}</strong> yet.</p>
            <p>Your payment has been pending for {{daysOverdue}} days. Please complete it as soon as possible to secure your appointment:</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="{{paymentLink}}" style="background-color: #C9A449; color: #080808; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Pay Now
              </a>
            </div>
            <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
            <p>Best regards,<br>Bowen Island Tattoo Shop</p>
          </div>
        `,
        text: `Second Payment Reminder\n\nHi {{customerName}},\n\nYour payment of {{amount}} has been pending for {{daysOverdue}} days.\n\nPlease complete your payment here: {{paymentLink}}\n\nThank you!`
      },
      3: {
        subject: 'Final Payment Reminder - Action Required',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ff6b6b;">Final Payment Reminder</h2>
            <p>Hi {{customerName}},</p>
            <p>This is your <strong>final reminder</strong> regarding your outstanding payment of <strong>{{amount}}</strong>.</p>
            <p>Your payment has been pending for <strong>{{daysOverdue}} days</strong>. Please complete it immediately to avoid cancellation of your appointment:</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="{{paymentLink}}" style="background-color: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Complete Payment Now
              </a>
            </div>
            <p style="color: #ff6b6b;"><strong>Important:</strong> If payment is not received within 48 hours, your appointment may be cancelled and offered to another client.</p>
            <p>If you're experiencing any issues with payment, please contact us immediately.</p>
            <p>Thank you,<br>Bowen Island Tattoo Shop</p>
          </div>
        `,
        text: `FINAL PAYMENT REMINDER\n\nHi {{customerName}},\n\nThis is your final reminder for your outstanding payment of {{amount}}.\n\nYour payment has been pending for {{daysOverdue}} days.\n\nPlease complete your payment immediately: {{paymentLink}}\n\nIf payment is not received within 48 hours, your appointment may be cancelled.\n\nThank you!`
      }
    };

    return templates[reminderNumber as keyof typeof templates] || templates[1];
  }

  /**
   * Replace template variables with actual values
   */
  private replaceTemplateVariables(template: any, variables: Record<string, string>) {
    let subject = template.subject;
    let html = template.htmlContent;
    let text = template.textContent;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      html = html.replace(regex, value);
      text = text.replace(regex, value);
    });

    return { subject, html, text };
  }

  /**
   * Update payment link settings (called from API)
   */
  async updateReminderSettings(
    paymentLinkId: string,
    settings: {
      enableReminders?: boolean;
      reminderSchedule?: number[];
      expiresAt?: Date;
    }
  ): Promise<void> {
    await this.prisma.paymentLink.update({
      where: { id: paymentLinkId },
      data: {
        enableReminders: settings.enableReminders,
        reminderSchedule: settings.reminderSchedule ? JSON.stringify(settings.reminderSchedule) : undefined,
        expiresAt: settings.expiresAt
      }
    });
  }

  /**
   * Get reminder status for a payment link
   */
  async getReminderStatus(paymentLinkId: string) {
    const link = await this.prisma.paymentLink.findUnique({
      where: { id: paymentLinkId },
      select: {
        enableReminders: true,
        reminderCount: true,
        lastReminderSent: true,
        reminderSchedule: true,
        status: true,
        createdAt: true
      }
    });

    if (!link) return null;

    const schedule = link.reminderSchedule as number[] || [2, 7, 14];
    const nextReminderIndex = link.reminderCount;
    const nextReminderDay = nextReminderIndex < schedule.length ? schedule[nextReminderIndex] : null;
    
    let nextReminderDate: Date | null = null;
    if (nextReminderDay && link.status === 'active') {
      if (link.reminderCount === 0) {
        nextReminderDate = addDays(new Date(link.createdAt), nextReminderDay);
      } else if (link.lastReminderSent) {
        const daysBetween = nextReminderDay - schedule[nextReminderIndex - 1];
        nextReminderDate = addDays(new Date(link.lastReminderSent), daysBetween);
      }
    }

    return {
      enabled: link.enableReminders,
      remindersSent: link.reminderCount,
      lastReminderDate: link.lastReminderSent,
      nextReminderDate,
      schedule
    };
  }
}
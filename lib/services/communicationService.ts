import { prisma } from '../prisma/prisma';
import { ValidationError, NotFoundError } from './errors';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: EmailTemplateType;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum EmailTemplateType {
  APPOINTMENT_CONFIRMATION = 'appointment_confirmation',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_FOLLOWUP = 'appointment_followup',
  APPOINTMENT_CANCELLATION = 'appointment_cancellation',
  REQUEST_RECEIVED = 'request_received',
  REQUEST_APPROVED = 'request_approved',
  REQUEST_REJECTED = 'request_rejected',
  REQUEST_NEEDS_INFO = 'request_needs_info',
  PAYMENT_INVOICE = 'payment_invoice',
  PAYMENT_RECEIPT = 'payment_receipt',
  PAYMENT_REMINDER = 'payment_reminder',
  PAYMENT_REFUND = 'payment_refund',
  CUSTOM = 'custom'
}

export interface Message {
  id: string;
  customerId?: string;
  contactEmail: string;
  contactPhone?: string;
  subject: string;
  body: string;
  type: MessageType;
  direction: 'inbound' | 'outbound';
  status: MessageStatus;
  templateId?: string;
  data?: any;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

export enum MessageType {
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app'
}

export enum MessageStatus {
  DRAFT = 'draft',
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  BOUNCED = 'bounced'
}

export interface SendEmailData {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  templateData?: Record<string, any>;
  customerId?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export interface SendSMSData {
  to: string;
  message: string;
  customerId?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export interface ConversationThread {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  messages: Message[];
  lastMessageAt: Date;
  unreadCount: number;
}

export interface DeliveryStatus {
  messageId: string;
  status: MessageStatus;
  deliveredAt?: Date;
  readAt?: Date;
  errorReason?: string;
  providerData?: any;
}

export interface CommunicationStats {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  responseRate: number;
  byType: Record<MessageType, number>;
  byTemplate: Record<string, number>;
  recentActivity: Array<{
    date: string;
    sent: number;
    delivered: number;
  }>;
}

/**
 * Communication Service for email templates, messaging, and customer communications
 * Handles email templates, SMS, and conversation management
 */
export class CommunicationService {

  /**
   * Send templated email
   */
  async sendTemplatedEmail(
    templateId: string,
    recipientEmail: string,
    templateData: Record<string, any> = {},
    customerId?: string
  ): Promise<Message> {
    // Get email template
    const template = await this.getEmailTemplate(templateId);
    if (!template || !template.isActive) {
      throw new NotFoundError('Email template', templateId);
    }

    // Process template variables
    const processedSubject = this.processTemplate(template.subject, templateData);
    const processedBody = this.processTemplate(template.body, templateData);

    // Create message record
    const messageData = {
      customerId,
      contactEmail: recipientEmail,
      subject: processedSubject,
      body: processedBody,
      type: MessageType.EMAIL,
      direction: 'outbound' as const,
      status: MessageStatus.QUEUED,
      templateId: template.id,
      data: templateData
    };

    const message = await this.createMessage(messageData);

    // Send email (this would integrate with actual email service)
    try {
      await this.sendEmailViaProvider(message);
      await this.updateMessageStatus(message.id, MessageStatus.SENT);
    } catch (error) {
      await this.updateMessageStatus(message.id, MessageStatus.FAILED, error.message);
      throw error;
    }

    return message;
  }

  /**
   * Send SMS message
   */
  async sendSMS(phoneNumber: string, message: string, customerId?: string): Promise<Message> {
    // Validate phone number format
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new ValidationError('Invalid phone number format');
    }

    // Create message record
    const messageData = {
      customerId,
      contactPhone: phoneNumber,
      contactEmail: '', // Required field, but not used for SMS
      subject: 'SMS Message',
      body: message,
      type: MessageType.SMS,
      direction: 'outbound' as const,
      status: MessageStatus.QUEUED
    };

    const smsMessage = await this.createMessage(messageData);

    // Send SMS (this would integrate with actual SMS service like Twilio)
    try {
      await this.sendSMSViaProvider(smsMessage);
      await this.updateMessageStatus(smsMessage.id, MessageStatus.SENT);
    } catch (error) {
      await this.updateMessageStatus(smsMessage.id, MessageStatus.FAILED, error.message);
      throw error;
    }

    return smsMessage;
  }

  /**
   * Schedule reminder for appointment
   */
  async scheduleReminder(
    appointmentId: string,
    timing: 'day_before' | 'hour_before' | 'custom',
    customTime?: Date
  ): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { customer: true }
    });

    if (!appointment) {
      throw new NotFoundError('Appointment', appointmentId);
    }

    if (!appointment.startTime) {
      throw new ValidationError('Cannot schedule reminder for appointment without start time');
    }

    // Calculate reminder time
    let reminderTime: Date;
    switch (timing) {
      case 'day_before':
        reminderTime = new Date(appointment.startTime.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'hour_before':
        reminderTime = new Date(appointment.startTime.getTime() - 60 * 60 * 1000);
        break;
      case 'custom':
        if (!customTime) {
          throw new ValidationError('Custom time required for custom reminder timing');
        }
        reminderTime = customTime;
        break;
    }

    // Create scheduled reminder record in audit log
    await prisma.auditLog.create({
      data: {
        action: 'reminder_scheduled',
        resource: 'Appointment',
        resourceId: appointmentId,
        resourceType: 'appointment',
        details: {
          type: 'appointment_reminder',
          appointmentId,
          customerId: appointment.customerId,
          timing,
          reminderTime: reminderTime.toISOString(),
          customerEmail: appointment.customer?.email || appointment.contactEmail,
          customerPhone: appointment.customer?.phone || appointment.contactPhone
        }
      }
    });
  }

  /**
   * Get conversation history for a customer
   */
  async getConversationHistory(customerId: string): Promise<Message[]> {
    // Get messages from audit log (since we're storing them there for now)
    const messageLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { 
            action: 'message_sent',
            resourceType: 'customer',
            resourceId: customerId
          },
          {
            action: 'message_received',
            resourceType: 'customer', 
            resourceId: customerId
          }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    return messageLogs.map(log => ({
      id: log.id,
      customerId,
      contactEmail: log.details?.contactEmail || '',
      contactPhone: log.details?.contactPhone,
      subject: log.details?.subject || '',
      body: log.details?.body || '',
      type: log.details?.type || MessageType.EMAIL,
      direction: log.details?.direction || 'outbound',
      status: log.details?.status || MessageStatus.SENT,
      templateId: log.details?.templateId,
      data: log.details?.data,
      sentAt: log.details?.sentAt ? new Date(log.details.sentAt) : undefined,
      deliveredAt: log.details?.deliveredAt ? new Date(log.details.deliveredAt) : undefined,
      readAt: log.details?.readAt ? new Date(log.details.readAt) : undefined,
      errorMessage: log.details?.errorMessage,
      createdAt: log.createdAt
    }));
  }

  /**
   * Track email delivery status
   */
  async trackEmailDelivery(messageId: string): Promise<DeliveryStatus> {
    // Get message from audit log
    const messageLog = await prisma.auditLog.findUnique({
      where: { id: messageId }
    });

    if (!messageLog) {
      throw new NotFoundError('Message', messageId);
    }

    // In a real implementation, this would check with the email provider's API
    return {
      messageId,
      status: messageLog.details?.status || MessageStatus.SENT,
      deliveredAt: messageLog.details?.deliveredAt ? new Date(messageLog.details.deliveredAt) : undefined,
      readAt: messageLog.details?.readAt ? new Date(messageLog.details.readAt) : undefined,
      errorReason: messageLog.details?.errorMessage,
      providerData: messageLog.details?.providerData
    };
  }

  /**
   * Create email template
   */
  async createEmailTemplate(templateData: {
    name: string;
    subject: string;
    body: string;
    type: EmailTemplateType;
    variables?: string[];
  }): Promise<EmailTemplate> {
    // Extract variables from template
    const extractedVariables = this.extractTemplateVariables(templateData.body + ' ' + templateData.subject);
    const variables = templateData.variables || extractedVariables;

    // Store template in audit log for now
    const auditLog = await prisma.auditLog.create({
      data: {
        action: 'email_template_created',
        resource: 'EmailTemplate',
        resourceType: 'email_template',
        details: {
          name: templateData.name,
          subject: templateData.subject,
          body: templateData.body,
          type: templateData.type,
          variables,
          isActive: true
        }
      }
    });

    return {
      id: auditLog.id,
      name: templateData.name,
      subject: templateData.subject,
      body: templateData.body,
      type: templateData.type,
      variables,
      isActive: true,
      createdAt: auditLog.createdAt,
      updatedAt: auditLog.createdAt
    };
  }

  /**
   * Get email template
   */
  async getEmailTemplate(templateId: string): Promise<EmailTemplate | null> {
    const templateLog = await prisma.auditLog.findUnique({
      where: { id: templateId }
    });

    if (!templateLog || templateLog.action !== 'email_template_created') {
      return null;
    }

    return {
      id: templateLog.id,
      name: templateLog.details?.name || '',
      subject: templateLog.details?.subject || '',
      body: templateLog.details?.body || '',
      type: templateLog.details?.type || EmailTemplateType.CUSTOM,
      variables: templateLog.details?.variables || [],
      isActive: templateLog.details?.isActive !== false,
      createdAt: templateLog.createdAt,
      updatedAt: templateLog.createdAt
    };
  }

  /**
   * List email templates
   */
  async listEmailTemplates(type?: EmailTemplateType): Promise<EmailTemplate[]> {
    const where: any = {
      action: 'email_template_created'
    };

    if (type) {
      where.details = { path: ['type'], equals: type };
    }

    const templateLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return templateLogs.map(log => ({
      id: log.id,
      name: log.details?.name || '',
      subject: log.details?.subject || '',
      body: log.details?.body || '',
      type: log.details?.type || EmailTemplateType.CUSTOM,
      variables: log.details?.variables || [],
      isActive: log.details?.isActive !== false,
      createdAt: log.createdAt,
      updatedAt: log.createdAt
    }));
  }

  /**
   * Get customer conversation threads
   */
  async getConversationThreads(limit: number = 20): Promise<ConversationThread[]> {
    // Get customers with recent message activity
    const customers = await prisma.customer.findMany({
      include: {
        _count: {
          select: { appointments: true, payments: true }
        }
      },
      take: limit,
      orderBy: { updatedAt: 'desc' }
    });

    const threads: ConversationThread[] = [];

    for (const customer of customers) {
      const messages = await this.getConversationHistory(customer.id);
      
      if (messages.length > 0) {
        threads.push({
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email || undefined,
          customerPhone: customer.phone || undefined,
          messages: messages.slice(0, 5), // Latest 5 messages
          lastMessageAt: messages[0]?.createdAt || customer.updatedAt,
          unreadCount: messages.filter(m => !m.readAt && m.direction === 'inbound').length
        });
      }
    }

    return threads.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }

  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmation(appointmentId: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { customer: true, artist: true }
    });

    if (!appointment) {
      throw new NotFoundError('Appointment', appointmentId);
    }

    const recipientEmail = appointment.customer?.email || appointment.contactEmail;
    if (!recipientEmail) {
      throw new ValidationError('No email address found for appointment confirmation');
    }

    const templateData = {
      customerName: appointment.customer?.name || 'Valued Customer',
      appointmentDate: appointment.startTime?.toLocaleDateString() || 'TBD',
      appointmentTime: appointment.startTime?.toLocaleTimeString() || 'TBD',
      appointmentType: appointment.type || 'Appointment',
      duration: appointment.duration || 60,
      artistName: appointment.artist?.email || 'Studio Artist',
      notes: appointment.notes || '',
      studioName: 'Bowen Island Tattoo Shop',
      studioPhone: '(604) 555-0123',
      studioAddress: 'Bowen Island, BC'
    };

    // Try to find existing confirmation template, otherwise create a default one
    const templates = await this.listEmailTemplates(EmailTemplateType.APPOINTMENT_CONFIRMATION);
    let template = templates.find(t => t.isActive);

    if (!template) {
      template = await this.createDefaultAppointmentConfirmationTemplate();
    }

    await this.sendTemplatedEmail(
      template.id,
      recipientEmail,
      templateData,
      appointment.customerId || undefined
    );
  }

  /**
   * Get communication statistics
   */
  async getCommunicationStats(period: 'week' | 'month' | 'quarter' = 'month'): Promise<CommunicationStats> {
    const startDate = this.getStartDateForPeriod(period);
    
    const messageLogs = await prisma.auditLog.findMany({
      where: {
        action: { in: ['message_sent', 'message_delivered', 'message_read'] },
        createdAt: { gte: startDate }
      }
    });

    const sentMessages = messageLogs.filter(log => log.action === 'message_sent');
    const deliveredMessages = messageLogs.filter(log => log.action === 'message_delivered');
    const readMessages = messageLogs.filter(log => log.action === 'message_read');

    const deliveryRate = sentMessages.length > 0 ? (deliveredMessages.length / sentMessages.length) * 100 : 0;
    const openRate = sentMessages.length > 0 ? (readMessages.length / sentMessages.length) * 100 : 0;

    // Calculate by type
    const byType = sentMessages.reduce((acc, log) => {
      const type = log.details?.type || MessageType.EMAIL;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<MessageType, number>);

    // Calculate by template
    const byTemplate = sentMessages.reduce((acc, log) => {
      const templateId = log.details?.templateId || 'custom';
      acc[templateId] = (acc[templateId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSent: sentMessages.length,
      deliveryRate: Math.round(deliveryRate),
      openRate: Math.round(openRate),
      responseRate: 0, // Would need to implement response tracking
      byType,
      byTemplate,
      recentActivity: [] // Would need to implement daily activity tracking
    };
  }

  // Private helper methods

  private async createMessage(messageData: any): Promise<Message> {
    const auditLog = await prisma.auditLog.create({
      data: {
        action: 'message_sent',
        resource: 'Message',
        resourceType: 'customer',
        resourceId: messageData.customerId,
        details: messageData
      }
    });

    return {
      id: auditLog.id,
      customerId: messageData.customerId,
      contactEmail: messageData.contactEmail,
      contactPhone: messageData.contactPhone,
      subject: messageData.subject,
      body: messageData.body,
      type: messageData.type,
      direction: messageData.direction,
      status: messageData.status,
      templateId: messageData.templateId,
      data: messageData.data,
      createdAt: auditLog.createdAt
    };
  }

  private async updateMessageStatus(messageId: string, status: MessageStatus, errorMessage?: string): Promise<void> {
    const log = await prisma.auditLog.findUnique({ where: { id: messageId } });
    if (log) {
      await prisma.auditLog.update({
        where: { id: messageId },
        data: {
          details: {
            ...log.details,
            status,
            errorMessage,
            [status === MessageStatus.SENT ? 'sentAt' : status === MessageStatus.DELIVERED ? 'deliveredAt' : 'updatedAt']: new Date().toISOString()
          }
        }
      });
    }
  }

  private processTemplate(template: string, data: Record<string, any>): string {
    let processed = template;
    
    // Replace {{variable}} patterns with actual data
    Object.entries(data).forEach(([key, value]) => {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(pattern, String(value || ''));
    });

    return processed;
  }

  private extractTemplateVariables(templateText: string): string[] {
    const variablePattern = /{{(\s*\w+\s*)}}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variablePattern.exec(templateText)) !== null) {
      variables.add(match[1].trim());
    }

    return Array.from(variables);
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Basic phone number validation - would use a proper library in production
    const phonePattern = /^\+?[\d\s\-\(\)]{10,}$/;
    return phonePattern.test(phone);
  }

  private async sendEmailViaProvider(message: Message): Promise<void> {
    // This would integrate with actual email provider (SendGrid, AWS SES, etc.)
    console.log('Sending email:', {
      to: message.contactEmail,
      subject: message.subject,
      body: message.body
    });
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendSMSViaProvider(message: Message): Promise<void> {
    // This would integrate with actual SMS provider (Twilio, AWS SNS, etc.)
    console.log('Sending SMS:', {
      to: message.contactPhone,
      body: message.body
    });
    
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async createDefaultAppointmentConfirmationTemplate(): Promise<EmailTemplate> {
    return this.createEmailTemplate({
      name: 'Appointment Confirmation',
      subject: 'Appointment Confirmed - {{appointmentType}} on {{appointmentDate}}',
      body: `
Dear {{customerName}},

Your appointment has been confirmed!

Appointment Details:
- Date: {{appointmentDate}}
- Time: {{appointmentTime}}
- Type: {{appointmentType}}
- Duration: {{duration}} minutes
- Artist: {{artistName}}

{{#if notes}}
Notes: {{notes}}
{{/if}}

Location:
{{studioName}}
{{studioAddress}}
Phone: {{studioPhone}}

We look forward to seeing you!

Best regards,
{{studioName}} Team
      `.trim(),
      type: EmailTemplateType.APPOINTMENT_CONFIRMATION,
      variables: ['customerName', 'appointmentDate', 'appointmentTime', 'appointmentType', 'duration', 'artistName', 'notes', 'studioName', 'studioAddress', 'studioPhone']
    });
  }

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
} 
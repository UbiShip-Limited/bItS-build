import { prisma } from '../prisma/prisma';
import type { Prisma } from '@prisma/client';

export type AuditAction = 
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'UPDATE_STATUS'
  | 'LINK_IMAGES'
  | 'CONVERTED_TO_APPOINTMENT'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'APPOINTMENT_CONFIRMATION_SENT'
  | 'APPOINTMENT_REMINDER_SENT'
  | 'AFTERCARE_INSTRUCTIONS_SENT'
  | 'TATTOO_REQUEST_CONFIRMATION_SENT'
  | 'EMAIL_AUTOMATION_ERROR'
  | 'EMAIL_SKIPPED'
  | 'EMAIL_SENT'
  | 'EMAIL_FAILED'
  | 'EMAIL_SEND_FAILED'
  | 'CUSTOMER_CONFIRMATION_FAILED'
  | 'OWNER_NOTIFICATION_FAILED'
  | 'OWNER_NOTIFICATION_SENT'
  | 'payment_link_email_sent'
  | 'payment_link_email_failed'
  | 'business_hours_initialized'
  | 'business_hours_updated'
  | 'special_hours_created'
  | 'special_hours_updated'
  | 'special_hours_deleted';

export type AuditResource = 
  | 'TattooRequest'
  | 'Customer'
  | 'Appointment'
  | 'User'
  | 'Payment'
  | 'Invoice'
  | 'Auth'
  | 'Email'
  | 'EmailTemplate'
  | 'EmailAutomation'
  | 'payment_link'
  | 'business_hours'
  | 'special_hours';

export interface AuditLogData {
  userId?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  details?: Prisma.JsonObject;
}

export class AuditService {
  private prisma: any;

  constructor(prisma?: any) {
    this.prisma = prisma || require('../prisma/prisma').prisma;
  }

  /**
   * Creates an audit log entry.
   * This centralizes audit logging across the application.
   * @param logData - The data for the audit log entry.
   */
  async log(logData: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: logData.userId,
          action: logData.action,
          resource: logData.resource,
          resourceId: logData.resourceId,
          details: logData.details || {},
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // We don't rethrow the error because auditing failures should not
      // block the primary application logic.
    }
  }
}

// Export a singleton instance for easy use across services
export const auditService = new AuditService(); 
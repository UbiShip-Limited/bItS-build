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
  | 'LOGIN_FAILURE';

export type AuditResource = 
  | 'TattooRequest'
  | 'Customer'
  | 'Appointment'
  | 'User'
  | 'Payment'
  | 'Invoice'
  | 'Auth';

export interface AuditLogData {
  userId?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  details?: Prisma.JsonObject;
}

export class AuditService {
  /**
   * Creates an audit log entry.
   * This centralizes audit logging across the application.
   * @param logData - The data for the audit log entry.
   */
  async log(logData: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
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
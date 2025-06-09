import { NotificationService, NotificationPriority } from './notificationService';
import { CommunicationService } from './communicationService';
import { WorkflowService } from './workflowService';
import type { Appointment } from '@prisma/client';

export interface BulkOperationResult {
  successful: string[];
  failed: Array<{ id: string; error: string }>;
  total: number;
}

export interface AutomationConfig {
  enableNotifications: boolean;
  enableWorkflows: boolean;
  enableCommunication: boolean;
  reminderHours: number[];
}

/**
 * Focused service for appointment automation
 * Handles workflows, notifications, and communication
 */
export class AppointmentAutomationService {
  private notificationService: NotificationService;
  private communicationService: CommunicationService;
  private workflowService: WorkflowService;

  constructor() {
    this.notificationService = new NotificationService();
    this.communicationService = new CommunicationService();
    this.workflowService = new WorkflowService();
  }

  /**
   * Handle automation for appointment creation
   */
  async onAppointmentCreated(appointment: Appointment, data?: any): Promise<void> {
    try {
      // Trigger workflows for appointment creation
      await this.workflowService.triggerWorkflows(
        'appointment_created',
        'appointment',
        appointment.id,
        { appointment, customer: data?.customerId }
      );

      // Create notification
      await this.notificationService.createAppointmentNotification(
        'created',
        appointment.id,
        appointment.customerId || undefined,
        { appointmentType: appointment.type }
      );

      // Send confirmation email if customer has email
      if (appointment.customerId || data?.contactEmail) {
        try {
          await this.communicationService.sendAppointmentConfirmation(appointment.id);
        } catch (emailError) {
          console.warn('Failed to send appointment confirmation:', emailError);
          // Don't fail for email issues
        }
      }

    } catch (automationError) {
      console.error('Automation failed for appointment creation:', automationError);
      // Log but don't throw - automation failures shouldn't break core operations
    }
  }

  /**
   * Handle automation for appointment updates
   */
  async onAppointmentUpdated(
    appointment: Appointment, 
    oldAppointment: Appointment, 
    changes: string[]
  ): Promise<void> {
    try {
      // Trigger update workflows
      await this.workflowService.triggerWorkflows(
        'appointment_updated',
        'appointment',
        appointment.id,
        { 
          appointment, 
          previousAppointment: oldAppointment,
          changes
        }
      );

      // Create notification for significant changes
      const significantChanges = ['startAt', 'artistId', 'status'];
      const hasSignificantChanges = significantChanges.some(field => changes.includes(field));

      if (hasSignificantChanges) {
        await this.notificationService.createAppointmentNotification(
          'updated',
          appointment.id,
          appointment.customerId || undefined,
          { changes }
        );

        // Send update notification email
        if (appointment.customerId || appointment.contactEmail) {
          try {
            await this.communicationService.sendAppointmentUpdate(appointment.id, changes);
          } catch (emailError) {
            console.warn('Failed to send appointment update:', emailError);
          }
        }
      }

    } catch (automationError) {
      console.error('Automation failed for appointment update:', automationError);
    }
  }

  /**
   * Handle automation for appointment cancellation
   */
  async onAppointmentCancelled(
    appointment: Appointment, 
    reason?: string, 
    cancelledBy?: string
  ): Promise<void> {
    try {
      // Trigger cancellation workflows
      await this.workflowService.triggerWorkflows(
        'appointment_cancelled',
        'appointment',
        appointment.id,
        { appointment, reason, cancelledBy }
      );

      // Create high-priority notification
      await this.notificationService.createAppointmentNotification(
        'cancelled',
        appointment.id,
        appointment.customerId || undefined,
        { reason, cancelledBy }
      );

      // Send cancellation email
      if (appointment.customerId || appointment.contactEmail) {
        try {
          await this.communicationService.sendAppointmentCancellation(appointment.id, reason);
        } catch (emailError) {
          console.warn('Failed to send cancellation email:', emailError);
        }
      }

    } catch (automationError) {
      console.error('Automation failed for appointment cancellation:', automationError);
    }
  }

  /**
   * Process bulk operations with proper error handling
   */
  async processBulkOperation<T>(
    items: string[],
    operation: (id: string) => Promise<T>,
    operationName: string
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      successful: [],
      failed: [],
      total: items.length
    };

    for (const id of items) {
      try {
        await operation(id);
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
        `Bulk ${operationName} Completed`,
        `Processed ${result.successful.length}/${result.total} items`,
        NotificationPriority.MEDIUM,
        { operation: operationName, result }
      );
    }

    return result;
  }

  /**
   * Send reminder notifications for upcoming appointments
   */
  async processAppointmentReminders(appointments: Appointment[]): Promise<void> {
    const now = new Date();

    for (const appointment of appointments) {
      if (!appointment.startTime) continue;

      const hoursUntilAppointment = (appointment.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      try {
        // Send reminder 24 hours before
        if (hoursUntilAppointment <= 24 && hoursUntilAppointment > 23) {
          await this.communicationService.scheduleReminder(appointment.id, 'day_before');
          await this.notificationService.createAppointmentNotification(
            'reminder_sent',
            appointment.id,
            appointment.customerId || undefined,
            { type: 'day_before' }
          );
        }

        // Send reminder 2 hours before
        if (hoursUntilAppointment <= 2 && hoursUntilAppointment > 1) {
          await this.communicationService.scheduleReminder(appointment.id, 'hours_before');
          await this.notificationService.createAppointmentNotification(
            'reminder_sent',
            appointment.id,
            appointment.customerId || undefined,
            { type: 'hours_before' }
          );
        }

      } catch (error) {
        console.warn(`Failed to send reminder for appointment ${appointment.id}:`, error);
      }
    }
  }

  /**
   * Handle appointment conflicts automation
   */
  async onConflictDetected(
    conflictingAppointments: { id: string; startTime: Date; endTime: Date }[],
    newAppointment: { startTime: Date; endTime: Date; artistId?: string }
  ): Promise<void> {
    try {
      // Create high-priority notification for conflicts
      await this.notificationService.createSystemAlert(
        'Appointment Conflict Detected',
        `${conflictingAppointments.length} conflicts found`,
        NotificationPriority.HIGH,
        { 
          conflicts: conflictingAppointments,
          newAppointment
        }
      );

      // Trigger conflict resolution workflow
      await this.workflowService.triggerWorkflows(
        'appointment_conflict',
        'appointment',
        'conflict',
        {
          conflicts: conflictingAppointments,
          newAppointment
        }
      );

    } catch (error) {
      console.error('Failed to handle conflict automation:', error);
    }
  }

  /**
   * Setup default automation workflows
   */
  async setupDefaultWorkflows(): Promise<void> {
    try {
      // Example workflow setups - these would be configured in WorkflowService
      await this.workflowService.createWorkflow({
        name: 'appointment_confirmation',
        trigger: 'appointment_created',
        actions: [
          {
            type: 'send_email',
            template: 'appointment_confirmation',
            delay: 0
          }
        ]
      });

      await this.workflowService.createWorkflow({
        name: 'appointment_reminder',
        trigger: 'appointment_reminder',
        actions: [
          {
            type: 'send_email',
            template: 'appointment_reminder',
            delay: 0
          },
          {
            type: 'send_sms',
            template: 'appointment_reminder_sms',
            delay: 300 // 5 minutes after email
          }
        ]
      });

    } catch (error) {
      console.error('Failed to setup default workflows:', error);
    }
  }

  /**
   * Get automation statistics
   */
  async getAutomationStats(): Promise<{
    workflowsTriggered: number;
    notificationsSent: number;
    emailsSent: number;
    smsSent: number;
    errors: number;
  }> {
    // This would ideally come from the individual services
    // For now, return placeholder data
    return {
      workflowsTriggered: 0,
      notificationsSent: 0,
      emailsSent: 0,
      smsSent: 0,
      errors: 0
    };
  }
} 
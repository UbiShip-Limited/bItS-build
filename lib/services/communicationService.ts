import { prisma } from '../prisma/prisma';
import type { Customer, Appointment, TattooRequest } from '@prisma/client';
import { emailTemplateService } from './emailTemplateService';
import { auditService } from './auditService';
import { RealtimeService } from './realtimeService';

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export interface SMSMessage {
  to: string;
  body: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface CommunicationPreferences {
  email: boolean;
  sms: boolean;
  reminderHours: number; // Hours before appointment to send reminder
}

/**
 * CommunicationService handles all customer communications including
 * appointment reminders, confirmations, and other notifications.
 * 
 * Currently, Square handles automatic appointment notifications when bookings
 * are created/updated through their API. This service is for additional
 * custom communications beyond Square's capabilities.
 */
export class CommunicationService {
  private realtimeService: RealtimeService;
  private emailService: any; // Optional email service
  private smsService: any; // Optional SMS service
  private ownerEmail: string | null;
  private ownerNotificationsEnabled: boolean;
  
  constructor(realtimeService: RealtimeService, emailService?: any, smsService?: any) {
    this.realtimeService = realtimeService;
    this.emailService = emailService;
    this.smsService = smsService;
    this.ownerEmail = process.env.OWNER_EMAIL || null;
    this.ownerNotificationsEnabled = process.env.OWNER_NOTIFICATION_ENABLED !== 'false';
  }
  
  /**
   * Send payment link notification to customer
   */
  async sendPaymentLinkEmail(params: {
    customerId: string;
    customerEmail: string;
    customerName: string;
    amount: number;
    title: string;
    description?: string;
    paymentType: string;
    paymentLink: string;
    appointmentDate?: string;
    appointmentTime?: string;
    allowTipping?: boolean;
    expiresAt?: string;
  }): Promise<NotificationResult> {
    const {
      customerEmail,
      customerName,
      amount,
      title,
      description,
      paymentType,
      paymentLink,
      appointmentDate,
      appointmentTime,
      allowTipping,
      expiresAt
    } = params;
    
    try {
      // Send payment link email to customer
      const result = await emailTemplateService.sendEmail(
        'payment_link_request',
        customerEmail,
        {
          customerName,
          amount: amount.toFixed(2),
          title,
          description,
          paymentType,
          paymentLink,
          appointmentDate,
          appointmentTime,
          allowTipping,
          expiresAt
        }
      );
      
      // Send notification to owner if enabled
      if (this.ownerNotificationsEnabled && this.ownerEmail) {
        await emailTemplateService.sendEmail(
          'owner_payment_received',
          this.ownerEmail,
          {
            customerName,
            amount: amount.toFixed(2),
            paymentType,
            transactionId: 'Payment Link Sent',
            dashboardUrl: `${process.env.APP_URL}/dashboard/payments`
          }
        );
      }
      
      // Send real-time notification
      this.realtimeService.sendNotification({
        type: 'payment_link_sent',
        title: 'Payment Link Sent',
        message: `Payment link for $${amount.toFixed(2)} sent to ${customerName}`,
        metadata: {
          customerId: params.customerId,
          amount,
          paymentType
        }
      });
      
      // Log audit
      await auditService.log({
        action: 'payment_link_email_sent',
        resource: 'payment_link',
        details: {
          customerEmail,
          amount,
          paymentType,
          title
        }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error sending payment link email:', error);
      
      await auditService.log({
        action: 'payment_link_email_failed',
        resource: 'payment_link',
        details: {
          customerEmail,
          error: error.message
        }
      });
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send payment link email' 
      };
    }
  }
  
  /**
   * Send appointment confirmation (custom, in addition to Square's automatic ones)
   */
  async sendAppointmentConfirmation(
    appointment: Appointment & { customer?: Customer | null, artist?: { email: string } | null }
  ): Promise<NotificationResult> {
    if (!appointment.customer && !appointment.contactEmail) {
      return { success: false, error: 'No contact information available' };
    }
    
    const email = appointment.customer?.email || appointment.contactEmail;
    if (!email) {
      return { success: false, error: 'No email address available' };
    }
    
    const customerName = appointment.customer?.name || 'Valued Customer';
    
    // Format appointment details
    const appointmentDate = appointment.startTime ? 
      new Date(appointment.startTime).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) : 'TBD';
      
    const appointmentTime = appointment.startTime ?
      new Date(appointment.startTime).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      }) : 'TBD';
    
    try {
      const result = await emailTemplateService.sendEmail(
        'appointment_confirmation',
        email,
        {
          customerName,
          appointmentDate,
          appointmentTime,
          duration: `${appointment.duration || 60} minutes`,
          artistName: appointment.artist?.email || 'Our team',
          appointmentType: appointment.type || 'Tattoo Session'
        }
      );
      
      // Send real-time notification
      if (result.success) {
        await this.realtimeService.sendNotification({
          type: 'email_sent',
          title: 'Appointment Confirmation Sent',
          message: `Confirmation email sent to ${customerName}`,
          severity: 'info',
          metadata: {
            appointmentId: appointment.id,
            customerId: appointment.customerId
          }
        });
      }
      
      // Log communication
      await auditService.log({
        action: 'APPOINTMENT_CONFIRMATION_SENT',
        resource: 'Appointment',
        resourceId: appointment.id,
        details: { 
          to: email,
          success: result.success,
          error: result.error
        }
      });
      
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send confirmation' 
      };
    }
  }
  
  /**
   * Send custom reminder (for reminders beyond Square's automatic ones)
   */
  async sendCustomReminder(
    appointment: Appointment & { customer?: Customer | null },
    hoursBeforeAppointment: number
  ): Promise<{ email?: NotificationResult; sms?: NotificationResult }> {
    const results: { email?: NotificationResult; sms?: NotificationResult } = {};
    
    if (!appointment.customer && !appointment.contactEmail) {
      return { email: { success: false, error: 'No contact information available' } };
    }
    
    const email = appointment.customer?.email || appointment.contactEmail;
    const phone = appointment.customer?.phone || appointment.contactPhone;
    const customerName = appointment.customer?.name || 'Valued Customer';
    
    // Format reminder message
    const appointmentTime = appointment.startTime ?
      new Date(appointment.startTime).toLocaleString('en-US', { 
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric', 
        minute: '2-digit' 
      }) : 'TBD';
    
    const reminderText = hoursBeforeAppointment === 24 ? 
      'tomorrow' : `in ${hoursBeforeAppointment} hours`;
    
    // Send email reminder
    if (email && this.emailService) {
      const subject = `Reminder: Your tattoo appointment is ${reminderText}`;
      const body = `
Hi ${customerName},

This is a friendly reminder that your appointment at Bowen Island Tattoo Shop is ${reminderText}.

Appointment Time: ${appointmentTime}
Duration: ${appointment.duration || 60} minutes

Remember to:
- Eat a good meal before your appointment
- Stay hydrated
- Wear comfortable clothing
- Bring your ID
- Arrive 10 minutes early

If you need to reschedule, please contact us as soon as possible.

See you soon!

Bowen Island Tattoo Shop Team
`;

      try {
        const emailResult = await this.emailService.sendEmail({
          to: email,
          subject,
          body,
          html: this.formatEmailHTML(subject, body)
        });
        results.email = emailResult;
      } catch (error) {
        results.email = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Email send failed' 
        };
      }
    }
    
    // Send SMS reminder
    if (phone && this.smsService) {
      const smsBody = `Reminder: Your tattoo appointment is ${reminderText} at ${appointmentTime}. Reply STOP to opt out.`;
      
      try {
        const smsResult = await this.smsService.sendSMS({
          to: phone,
          body: smsBody
        });
        results.sms = smsResult;
      } catch (error) {
        results.sms = { 
          success: false, 
          error: error instanceof Error ? error.message : 'SMS send failed' 
        };
      }
    }
    
    // Log communication
    await auditService.log({
      action: 'APPOINTMENT_REMINDER_SENT',
      resource: 'Appointment',
      resourceId: appointment.id,
      userId: (appointment as any).userId || undefined,
      details: {
        hoursBeforeAppointment,
        email: results.email ? {
          success: results.email.success,
          id: (results.email as any).id || 'unknown'
        } : undefined,
        sms: results.sms ? {
          success: results.sms.success,
          id: (results.sms as any).id || 'unknown'
        } : undefined
      }
    });
    
    return results;
  }
  
  /**
   * Send aftercare instructions after appointment
   */
  async sendAftercareInstructions(
    appointment: Appointment & { customer?: Customer | null }
  ): Promise<{ email?: NotificationResult }> {
    const results: { email?: NotificationResult } = {};
    
    const email = appointment.customer?.email || appointment.contactEmail;
    const customerName = appointment.customer?.name || 'Valued Customer';
    
    if (!email || !this.emailService) {
      return { email: { success: false, error: 'Email not available' } };
    }
    
    const subject = 'Tattoo Aftercare Instructions - Bowen Island Tattoo Shop';
    const body = `
Dear ${customerName},

Thank you for choosing Bowen Island Tattoo Shop! We hope you love your new tattoo.

IMPORTANT AFTERCARE INSTRUCTIONS:

First 24 Hours:
- Keep the bandage on for 2-4 hours
- Gently wash with unscented soap and warm water
- Pat dry with a clean paper towel
- Apply a thin layer of unscented moisturizer

Days 2-14:
- Wash 2-3 times daily with unscented soap
- Apply moisturizer 3-4 times daily
- Do not pick or scratch the tattoo
- Avoid direct sunlight
- No swimming or soaking

What's Normal:
- Mild swelling and redness for 2-3 days
- Light scabbing after 3-5 days
- Itching as it heals

Contact us immediately if you experience:
- Excessive swelling or redness
- Pus or unusual discharge
- Fever or chills
- Severe pain

Your tattoo should be fully healed in 2-4 weeks. Once healed, always use sunscreen to protect your tattoo!

If you have any questions or concerns, don't hesitate to reach out.

Take care,
Bowen Island Tattoo Shop Team
`;

    try {
      const emailResult = await this.emailService.sendEmail({
        to: email,
        subject,
        body,
        html: this.formatEmailHTML(subject, body)
      });
      results.email = emailResult;
    } catch (error) {
      results.email = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Email send failed' 
      };
    }
    
    // Log communication
    await auditService.log({
      action: 'AFTERCARE_INSTRUCTIONS_SENT',
      resource: 'Appointment',
      resourceId: appointment.id,
      userId: (appointment as any).userId || undefined,
      details: {
        email: results.email ? {
          success: results.email.success,
          id: (results.email as any).id || 'unknown'
        } : undefined
      }
    });
    
    return results;
  }
  
  /**
   * Check if Square notifications are enabled for this appointment
   */
  async isSquareNotificationEnabled(appointmentId: string): Promise<boolean> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });
    
    // Square sends notifications automatically when squareId is present
    return !!appointment?.squareId;
  }
  
  /**
   * Get communication history for an appointment
   */
  async getCommunicationHistory(appointmentId: string) {
    const logs = await prisma.auditLog.findMany({
      where: {
        resourceId: appointmentId,
        action: {
          in: [
            'appointment_confirmation',
            'appointment_reminder',
            'aftercare_instructions',
            'booking_created_webhook',
            'booking_updated_webhook'
          ]
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return logs.map(log => ({
      id: log.id,
      type: log.action,
      sentAt: log.createdAt,
      details: log.details
    }));
  }
  
  /**
   * Send tattoo request confirmation email
   */
  async sendTattooRequestConfirmation(
    tattooRequest: TattooRequest & { customer?: Customer | null }
  ): Promise<NotificationResult> {
    const email = tattooRequest.customer?.email || tattooRequest.contactEmail;
    if (!email) {
      return { success: false, error: 'No email address available' };
    }
    
    const customerName = tattooRequest.customer?.name || 'Valued Customer';
    const trackingUrl = tattooRequest.trackingToken 
      ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/track-request/${tattooRequest.trackingToken}`
      : null;
    
    try {
      const result = await emailTemplateService.sendEmail(
        'tattoo_request_confirmation',
        email,
        {
          customerName,
          description: tattooRequest.description,
          placement: tattooRequest.placement || 'Not specified',
          size: tattooRequest.size || 'Not specified',
          style: tattooRequest.style || 'Not specified',
          preferredArtist: tattooRequest.preferredArtist || 'Any available artist',
          trackingToken: tattooRequest.trackingToken,
          trackingUrl
        }
      );
      
      // Send real-time notification
      if (result.success) {
        await this.realtimeService.sendNotification({
          type: 'email_sent',
          title: 'Tattoo Request Confirmation Sent',
          message: `Confirmation email sent to ${customerName}`,
          severity: 'info',
          metadata: {
            tattooRequestId: tattooRequest.id,
            customerId: tattooRequest.customerId
          }
        });
      }
      
      // Log communication
      await auditService.log({
        action: 'TATTOO_REQUEST_CONFIRMATION_SENT',
        resource: 'TattooRequest',
        resourceId: tattooRequest.id,
        details: { 
          to: email,
          success: result.success,
          error: result.error,
          hasTrackingToken: !!tattooRequest.trackingToken
        }
      });
      
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send confirmation' 
      };
    }
  }

  /**
   * Format plain text email to HTML
   */
  private formatEmailHTML(subject: string, body: string): string {
    const htmlBody = body
      .split('\n')
      .map(line => {
        if (line.trim() === '') return '<br>';
        if (line.startsWith('IMPORTANT') || line.includes(':')) {
          return `<strong>${line}</strong>`;
        }
        if (line.startsWith('- ')) {
          return `<li>${line.substring(2)}</li>`;
        }
        return `<p>${line}</p>`;
      })
      .join('\n');
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #2c3e50; }
    ul { list-style-type: none; padding-left: 20px; }
    li { margin-bottom: 5px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${subject}</h1>
    ${htmlBody}
    <div class="footer">
      <p>Bowen Island Tattoo Shop<br>
      [Your Address Here]<br>
      [Your Phone Number]</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Send notification to shop owner for new tattoo request
   */
  async sendOwnerNewRequestNotification(
    tattooRequest: TattooRequest & { customer?: Customer | null }
  ): Promise<NotificationResult> {
    if (!this.ownerNotificationsEnabled || !this.ownerEmail) {
      console.log('[CommunicationService] Owner notifications disabled or no owner email configured');
      return { success: true };
    }

    const customerName = tattooRequest.customer?.name || 'Anonymous';
    const customerEmail = tattooRequest.customer?.email || tattooRequest.contactEmail || 'Not provided';
    const customerPhone = tattooRequest.customer?.phone || tattooRequest.contactPhone || 'Not provided';
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/requests/${tattooRequest.id}`;

    try {
      const result = await emailTemplateService.sendEmail(
        'owner_new_request',
        this.ownerEmail,
        {
          customerName,
          customerEmail,
          customerPhone,
          description: tattooRequest.description,
          placement: tattooRequest.placement || 'Not specified',
          size: tattooRequest.size || 'Not specified',
          style: tattooRequest.style || 'Not specified',
          preferredArtist: tattooRequest.preferredArtist || 'Any available',
          timeframe: tattooRequest.timeframe || 'Not specified',
          additionalNotes: tattooRequest.additionalNotes || 'None',
          referenceImages: Array.isArray(tattooRequest.referenceImages) ? tattooRequest.referenceImages.length : 0,
          dashboardUrl
        }
      );

      // Log communication
      await auditService.log({
        action: 'OWNER_NOTIFICATION_SENT',
        resource: 'TattooRequest',
        resourceId: tattooRequest.id,
        details: { 
          type: 'new_request',
          to: this.ownerEmail,
          success: result.success,
          error: result.error
        }
      });

      // Trigger real-time notification for dashboard
      if (result.success) {
        await this.realtimeService.addEvent({
          type: 'email_sent',
          data: {
            message: `New tattoo request from ${customerName}`,
            notificationType: 'owner_new_request',
            requestId: tattooRequest.id,
            customerName,
            priority: 'high'
          }
        });
      }

      return result;
    } catch (error) {
      console.error('[CommunicationService] Failed to send owner notification:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send owner notification' 
      };
    }
  }

  /**
   * Send notification to shop owner for new appointment
   */
  async sendOwnerNewAppointmentNotification(
    appointment: Appointment & { customer?: Customer | null, artist?: { name: string } | null }
  ): Promise<NotificationResult> {
    if (!this.ownerNotificationsEnabled || !this.ownerEmail) {
      console.log('[CommunicationService] Owner notifications disabled or no owner email configured');
      return { success: true };
    }

    const customerName = appointment.customer?.name || 'Anonymous';
    const customerEmail = appointment.customer?.email || appointment.contactEmail || 'Not provided';
    const customerPhone = appointment.customer?.phone || appointment.contactPhone || 'Not provided';
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/appointments/${appointment.id}`;

    const appointmentDate = appointment.startTime ? 
      new Date(appointment.startTime).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) : 'TBD';
      
    const appointmentTime = appointment.startTime ?
      new Date(appointment.startTime).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      }) : 'TBD';

    try {
      const result = await emailTemplateService.sendEmail(
        'owner_new_appointment',
        this.ownerEmail,
        {
          customerName,
          customerEmail,
          customerPhone,
          appointmentDate,
          appointmentTime,
          duration: `${appointment.duration || 60} minutes`,
          appointmentType: appointment.type || 'Tattoo Session',
          artistName: appointment.artist?.name || 'Not assigned',
          priceQuote: appointment.priceQuote ? `$${appointment.priceQuote}` : 'Not set',
          notes: appointment.notes || 'None',
          dashboardUrl
        }
      );

      // Log communication
      await auditService.log({
        action: 'OWNER_NOTIFICATION_SENT',
        resource: 'Appointment',
        resourceId: appointment.id,
        details: { 
          type: 'new_appointment',
          to: this.ownerEmail,
          success: result.success,
          error: result.error
        }
      });

      // Trigger real-time notification for dashboard
      if (result.success) {
        await this.realtimeService.addEvent({
          type: 'email_sent',
          data: {
            message: `New appointment booked by ${customerName} for ${appointmentDate}`,
            notificationType: 'owner_new_appointment',
            appointmentId: appointment.id,
            customerName,
            appointmentDate,
            appointmentTime,
            priority: 'high'
          }
        });
      }

      return result;
    } catch (error) {
      console.error('[CommunicationService] Failed to send owner notification:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send owner notification' 
      };
    }
  }

  /**
   * Send notification to shop owner for payment received
   */
  async sendOwnerPaymentNotification(
    payment: {
      id: string;
      amount: number;
      customerName: string;
      paymentMethod: string;
      appointmentId?: string;
      transactionId: string;
    }
  ): Promise<NotificationResult> {
    if (!this.ownerNotificationsEnabled || !this.ownerEmail) {
      console.log('[CommunicationService] Owner notifications disabled or no owner email configured');
      return { success: true };
    }

    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/payments`;
    const paymentDate = new Date().toLocaleString('en-US');

    try {
      const result = await emailTemplateService.sendEmail(
        'owner_payment_received',
        this.ownerEmail,
        {
          customerName: payment.customerName,
          amount: payment.amount.toFixed(2),
          paymentMethod: payment.paymentMethod,
          paymentDate,
          relatedService: payment.appointmentId ? 'Tattoo Appointment' : 'General Payment',
          appointmentId: payment.appointmentId || '',
          transactionId: payment.transactionId,
          dashboardUrl
        }
      );

      // Log communication
      await auditService.log({
        action: 'OWNER_NOTIFICATION_SENT',
        resource: 'Payment',
        resourceId: payment.id,
        details: { 
          type: 'payment_received',
          to: this.ownerEmail,
          success: result.success,
          error: result.error
        }
      });

      // Trigger real-time notification for dashboard
      if (result.success) {
        await this.realtimeService.addEvent({
          type: 'email_sent',
          data: {
            message: `Payment of $${payment.amount.toFixed(2)} received from ${payment.customerName}`,
            notificationType: 'owner_payment_received',
            paymentId: payment.id,
            amount: payment.amount,
            customerName: payment.customerName,
            priority: 'medium'
          }
        });
      }

      return result;
    } catch (error) {
      console.error('[CommunicationService] Failed to send owner notification:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send owner notification' 
      };
    }
  }

  /**
   * Send notification to shop owner for appointment cancellation
   */
  async sendOwnerCancellationNotification(
    appointment: Appointment & { customer?: Customer | null, artist?: { name: string } | null },
    cancellationReason?: string
  ): Promise<NotificationResult> {
    if (!this.ownerNotificationsEnabled || !this.ownerEmail) {
      console.log('[CommunicationService] Owner notifications disabled or no owner email configured');
      return { success: true };
    }

    const customerName = appointment.customer?.name || 'Anonymous';
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/appointments`;

    const appointmentDate = appointment.startTime ? 
      new Date(appointment.startTime).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) : 'TBD';
      
    const appointmentTime = appointment.startTime ?
      new Date(appointment.startTime).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      }) : 'TBD';

    try {
      const result = await emailTemplateService.sendEmail(
        'owner_appointment_cancelled',
        this.ownerEmail,
        {
          customerName,
          appointmentDate,
          appointmentTime,
          artistName: appointment.artist?.name || 'Not assigned',
          cancellationReason: cancellationReason || 'Not provided',
          cancelledAt: new Date().toLocaleString('en-US'),
          dashboardUrl
        }
      );

      // Log communication
      await auditService.log({
        action: 'OWNER_NOTIFICATION_SENT',
        resource: 'Appointment',
        resourceId: appointment.id,
        details: { 
          type: 'appointment_cancelled',
          to: this.ownerEmail,
          success: result.success,
          error: result.error
        }
      });

      // Trigger real-time notification for dashboard
      if (result.success) {
        await this.realtimeService.addEvent({
          type: 'email_sent',
          data: {
            message: `Appointment cancelled by ${customerName} for ${appointmentDate}`,
            notificationType: 'owner_appointment_cancelled',
            appointmentId: appointment.id,
            customerName,
            appointmentDate,
            cancellationReason: cancellationReason || 'Not provided',
            priority: 'urgent'
          }
        });
      }

      return result;
    } catch (error) {
      console.error('[CommunicationService] Failed to send owner notification:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send owner notification' 
      };
    }
  }
  
}
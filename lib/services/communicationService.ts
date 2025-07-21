import { prisma } from '../prisma/prisma';
import type { Customer, Appointment } from '@prisma/client';

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
  private emailService: any; // To be implemented with SendGrid/AWS SES
  private smsService: any; // To be implemented with Twilio/AWS SNS
  
  constructor(emailService?: any, smsService?: any) {
    this.emailService = emailService;
    this.smsService = smsService;
  }
  
  /**
   * Send appointment confirmation (custom, in addition to Square's automatic ones)
   */
  async sendAppointmentConfirmation(
    appointment: Appointment & { customer?: Customer | null },
    includeSquareNote = true
  ): Promise<{ email?: NotificationResult; sms?: NotificationResult }> {
    const results: { email?: NotificationResult; sms?: NotificationResult } = {};
    
    if (!appointment.customer && !appointment.contactEmail) {
      return { email: { success: false, error: 'No contact information available' } };
    }
    
    const email = appointment.customer?.email || appointment.contactEmail;
    const phone = appointment.customer?.phone || appointment.contactPhone;
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
    
    // Send email if available
    if (email && this.emailService) {
      const subject = 'Appointment Confirmation - Bowen Island Tattoo Shop';
      const squareNote = includeSquareNote ? 
        '\n\nYou will also receive automated reminders from Square before your appointment.' : '';
      
      const body = `
Dear ${customerName},

Your appointment at Bowen Island Tattoo Shop has been confirmed!

Appointment Details:
- Date: ${appointmentDate}
- Time: ${appointmentTime}
- Duration: ${appointment.duration || 60} minutes
- Type: ${appointment.type || 'Tattoo Session'}
${appointment.notes ? `- Notes: ${appointment.notes}` : ''}

Location:
Bowen Island Tattoo Shop
[Your Address Here]

Please arrive 10 minutes early to complete any necessary paperwork.

If you need to reschedule or cancel, please contact us at least 24 hours in advance.${squareNote}

We look forward to seeing you!

Best regards,
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
    
    // Send SMS if available
    if (phone && this.smsService) {
      const smsBody = `Hi ${customerName}! Your tattoo appointment is confirmed for ${appointmentDate} at ${appointmentTime}. Reply STOP to opt out.`;
      
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
    
    // Log communication in audit log
    await this.logCommunication(
      appointment.id,
      'appointment_confirmation',
      results
    );
    
    return results;
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
    await this.logCommunication(
      appointment.id,
      'appointment_reminder',
      results,
      { hoursBeforeAppointment }
    );
    
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
    await this.logCommunication(
      appointment.id,
      'aftercare_instructions',
      results
    );
    
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
   * Log communication attempts in audit log
   */
  private async logCommunication(
    appointmentId: string,
    action: string,
    results: { email?: NotificationResult; sms?: NotificationResult },
    additionalDetails?: Record<string, any>
  ) {
    await prisma.auditLog.create({
      data: {
        action,
        resource: 'appointment',
        resourceId: appointmentId,
        resourceType: 'appointment',
        details: {
          ...results,
          ...additionalDetails,
          timestamp: new Date().toISOString()
        }
      }
    });
  }
}
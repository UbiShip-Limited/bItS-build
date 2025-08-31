/**
 * Seed Enhanced Email Templates
 * Populates the database with beautiful, branded email templates
 */

import { PrismaClient } from '@prisma/client';
import * as emailTemplateGenerator from '../lib/services/emailTemplateGenerator';

const prisma = new PrismaClient();

async function seedEnhancedTemplates() {
  console.log('🎨 Seeding enhanced email templates...');

  const templates = [
    {
      name: 'tattoo_request_confirmation',
      displayName: 'Tattoo Request Confirmation',
      subject: 'Your tattoo request has been received - Bowen Island Tattoo Shop',
      body: `Hi {{customerName}},

Thank you for submitting your tattoo request! We've received your inquiry and will review it shortly.

Request Details:
- Description: {{description}}
- Placement: {{placement}}
- Size: {{size}}
- Style: {{style}}
- Preferred Artist: {{preferredArtist}}

What happens next?
Our team will review your request and get back to you within 24-48 hours. We'll discuss your design ideas, provide a quote, and schedule a consultation if needed.

{{#if trackingToken}}
You can track your request status using this link:
{{trackingUrl}}
{{/if}}

If you have any questions in the meantime, feel free to reply to this email or call us at (604) 123-4567.

Best regards,
Bowen Island Tattoo Shop`,
      htmlBody: emailTemplateGenerator.getTattooRequestTemplate(),
      variables: {
        customerName: 'Customer name',
        description: 'Tattoo description',
        placement: 'Body placement',
        size: 'Tattoo size',
        style: 'Tattoo style',
        preferredArtist: 'Preferred artist name',
        trackingToken: 'Tracking token for anonymous requests',
        trackingUrl: 'URL to track request status'
      },
      isActive: true
    },
    {
      name: 'appointment_confirmation',
      displayName: 'Appointment Confirmation',
      subject: 'Appointment Confirmation - {{appointmentDate}} at {{appointmentTime}}',
      body: `Hi {{customerName}},

Your appointment has been confirmed!

Appointment Details:
- Date: {{appointmentDate}}
- Time: {{appointmentTime}}
- Duration: {{duration}}
- Artist: {{artistName}}
- Type: {{appointmentType}}

Location:
Bowen Island Tattoo Studio
565 Artisan Lane, Artisan Square
Bowen Island, BC V0N1G2

Important Reminders:
- Please arrive 10 minutes early
- Bring a valid ID
- Eat a good meal before your appointment
- Wear comfortable clothing

If you need to reschedule or cancel, please let us know at least 24 hours in advance.

See you soon!
Bowen Island Tattoo Shop`,
      htmlBody: emailTemplateGenerator.getAppointmentConfirmationTemplate(),
      variables: {
        customerName: 'Customer name',
        appointmentDate: 'Appointment date',
        appointmentTime: 'Appointment time',
        duration: 'Appointment duration',
        artistName: 'Artist name',
        appointmentType: 'Type of appointment'
      },
      isActive: true
    },
    {
      name: 'appointment_reminder_24h',
      displayName: '24 Hour Appointment Reminder',
      subject: 'Reminder: Your appointment is tomorrow - {{appointmentTime}}',
      body: `Hi {{customerName}},

This is a friendly reminder that you have an appointment tomorrow at Bowen Island Tattoo Shop.

Appointment Details:
- Date: {{appointmentDate}}
- Time: {{appointmentTime}}
- Duration: {{duration}}
- Artist: {{artistName}}
- Type: {{appointmentType}}

Important Reminders:
- Please arrive 10 minutes early
- Eat a good meal before your appointment
- Stay hydrated
- Wear comfortable clothing
- Bring a valid ID

If you need to reschedule or cancel, please let us know at least 24 hours in advance by calling (604) 123-4567.

We're looking forward to seeing you!

Best regards,
Bowen Island Tattoo Shop`,
      htmlBody: emailTemplateGenerator.get24HourReminderTemplate(),
      variables: {
        customerName: 'Customer name',
        appointmentDate: 'Appointment date (formatted)',
        appointmentTime: 'Appointment time',
        duration: 'Appointment duration',
        artistName: 'Artist name',
        appointmentType: 'Type of appointment'
      },
      isActive: true
    },
    {
      name: 'appointment_reminder_2h',
      displayName: '2 Hour Appointment Reminder',
      subject: 'Reminder: Your appointment is in 2 hours',
      body: `Hi {{customerName}},

Just a quick reminder that your appointment is coming up in 2 hours!

Appointment Time: {{appointmentTime}}
Artist: {{artistName}}

Don't forget:
- Arrive 10 minutes early
- Bring your ID
- Have a meal before arriving

See you soon!

Bowen Island Tattoo Shop
(604) 123-4567`,
      htmlBody: emailTemplateGenerator.get24HourReminderTemplate(), // Reuse similar template
      variables: {
        customerName: 'Customer name',
        appointmentTime: 'Appointment time',
        artistName: 'Artist name'
      },
      isActive: true
    },
    {
      name: 'aftercare_instructions',
      displayName: 'Aftercare Instructions',
      subject: 'Important: Tattoo Aftercare Instructions',
      body: `Hi {{customerName}},

Thank you for choosing Bowen Island Tattoo Shop! Your new tattoo looks amazing.

Here are your aftercare instructions:

First 24 Hours:
- Keep the bandage on for 2-4 hours
- Gently wash with unscented soap and warm water
- Pat dry with a clean paper towel
- Apply a thin layer of aftercare ointment

Days 2-14:
- Wash 2-3 times daily
- Apply aftercare ointment/lotion as needed
- Avoid swimming, hot tubs, and direct sunlight
- Do not pick or scratch

General Tips:
- Keep it clean and moisturized
- Wear loose, clean clothing
- Stay hydrated
- Avoid exercise for 48 hours

If you have any concerns or questions, don't hesitate to contact us.

Take care of your new art!
Bowen Island Tattoo Shop`,
      htmlBody: emailTemplateGenerator.getAftercareTemplate(),
      variables: {
        customerName: 'Customer name'
      },
      isActive: true
    },
    {
      name: 'owner_new_request',
      displayName: 'Owner: New Tattoo Request',
      subject: '🎨 New Tattoo Request from {{customerName}}',
      body: `New tattoo request received!

Customer Details:
- Name: {{customerName}}
- Email: {{customerEmail}}
- Phone: {{customerPhone}}

Request Details:
- Description: {{description}}
- Placement: {{placement}}
- Size: {{size}}
- Style: {{style}}
- Preferred Artist: {{preferredArtist}}
- Timeframe: {{timeframe}}
- Additional Notes: {{additionalNotes}}

{{#if referenceImages}}
Reference Images: {{referenceImages}} image(s) uploaded
{{/if}}

View in Dashboard: {{dashboardUrl}}

This notification was sent to the shop owner.`,
      htmlBody: emailTemplateGenerator.getOwnerNotificationTemplate(),
      variables: {
        customerName: 'Customer name',
        customerEmail: 'Customer email',
        customerPhone: 'Customer phone',
        description: 'Tattoo description',
        placement: 'Body placement',
        size: 'Tattoo size',
        style: 'Tattoo style',
        preferredArtist: 'Preferred artist',
        timeframe: 'Desired timeframe',
        additionalNotes: 'Additional notes',
        referenceImages: 'Number of reference images',
        dashboardUrl: 'URL to dashboard',
        timestamp: 'Timestamp of request'
      },
      isActive: true
    },
    {
      name: 'payment_link_request',
      displayName: 'Payment Link Request',
      subject: 'Payment Request from Bowen Island Tattoo Shop',
      body: 'Hi {{customerName}},\n\n' +
        'We\'ve prepared a secure payment link for your {{paymentType}}.\n\n' +
        'Payment Details:\n' +
        '- Amount: ${{amount}}\n' +
        '- Description: {{title}}\n' +
        '{{#if description}}- Details: {{description}}{{/if}}\n' +
        '{{#if appointmentDate}}- Appointment: {{appointmentDate}} at {{appointmentTime}}{{/if}}\n\n' +
        'Click here to complete your payment:\n' +
        '{{paymentLink}}\n\n' +
        'Payment Options:\n' +
        '- Credit/Debit Card\n' +
        '- Apple Pay / Google Pay\n' +
        '{{#if allowTipping}}- Option to add gratuity{{/if}}\n\n' +
        'Your payment is processed securely through Square. We never store your card information.\n\n' +
        '{{#if expiresAt}}⏰ This payment link expires on {{expiresAt}}{{/if}}\n\n' +
        'If you have any questions, please reply to this email or call us at (604) 123-4567.\n\n' +
        'Best regards,\n' +
        'Bowen Island Tattoo Shop',
      htmlBody: emailTemplateGenerator.getPaymentLinkTemplate(),
      variables: {
        customerName: 'Customer name',
        amount: 'Payment amount',
        title: 'Payment title/description',
        description: 'Additional payment details',
        paymentType: 'Type of payment (consultation, deposit, etc.)',
        paymentLink: 'Secure payment URL',
        appointmentDate: 'Related appointment date (optional)',
        appointmentTime: 'Related appointment time (optional)',
        allowTipping: 'Whether tipping is enabled',
        expiresAt: 'Link expiration date (optional)'
      },
      isActive: true
    },
    {
      name: 'owner_payment_received',
      displayName: 'Owner: Payment Received',
      subject: '💰 Payment Received from {{customerName}}',
      body: 'Payment received!\n\n' +
        'Customer: {{customerName}}\n' +
        'Amount: ${{amount}}\n' +
        'Payment Type: {{paymentType}}\n' +
        'Transaction ID: {{transactionId}}\n' +
        '{{#if appointmentId}}Appointment ID: {{appointmentId}}{{/if}}\n\n' +
        'View in Dashboard: {{dashboardUrl}}\n\n' +
        'This notification was sent to the shop owner.',
      htmlBody: emailTemplateGenerator.getOwnerNotificationTemplate(),
      variables: {
        customerName: 'Customer name',
        amount: 'Payment amount',
        paymentType: 'Type of payment',
        transactionId: 'Square transaction ID',
        appointmentId: 'Related appointment ID (optional)',
        dashboardUrl: 'URL to dashboard'
      },
      isActive: true
    },
    {
      name: 'owner_new_appointment',
      displayName: 'Owner: New Appointment',
      subject: '📅 New Appointment Booked - {{appointmentDate}}',
      body: `New appointment booked!

Customer: {{customerName}}
Email: {{customerEmail}}
Phone: {{customerPhone}}

Appointment Details:
- Date: {{appointmentDate}}
- Time: {{appointmentTime}}
- Duration: {{duration}}
- Type: {{appointmentType}}
- Artist: {{artistName}}
- Price Quote: {{priceQuote}}
- Notes: {{notes}}

View in Dashboard: {{dashboardUrl}}

This notification was sent to the shop owner.`,
      htmlBody: emailTemplateGenerator.getOwnerNotificationTemplate(),
      variables: {
        customerName: 'Customer name',
        customerEmail: 'Customer email',
        customerPhone: 'Customer phone',
        appointmentDate: 'Appointment date',
        appointmentTime: 'Appointment time',
        duration: 'Duration in minutes',
        appointmentType: 'Type of appointment',
        artistName: 'Assigned artist',
        priceQuote: 'Price quote if provided',
        notes: 'Appointment notes',
        dashboardUrl: 'URL to dashboard'
      },
      isActive: true
    }
  ];

  for (const template of templates) {
    try {
      // Check if template already exists
      const existing = await prisma.emailTemplate.findUnique({
        where: { name: template.name }
      });

      if (existing) {
        // Update existing template with enhanced version
        await prisma.emailTemplate.update({
          where: { name: template.name },
          data: {
            displayName: template.displayName,
            subject: template.subject,
            body: template.body,
            htmlBody: template.htmlBody,
            variables: template.variables,
            isActive: template.isActive,
            updatedAt: new Date()
          }
        });
        console.log(`✅ Updated template: ${template.displayName}`);
      } else {
        // Create new template
        await prisma.emailTemplate.create({
          data: template
        });
        console.log(`✅ Created template: ${template.displayName}`);
      }
    } catch (error) {
      console.error(`❌ Error processing template ${template.name}:`, error);
    }
  }

  console.log('✨ Enhanced email templates seeding complete!');
}

seedEnhancedTemplates()
  .catch((error) => {
    console.error('Error seeding templates:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
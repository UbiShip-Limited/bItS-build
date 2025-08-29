import { prisma } from '../prisma/prisma';
import { NotFoundError, ValidationError } from './errors';
import type { EmailTemplate, Prisma } from '@prisma/client';
import { auditService } from './auditService';
import { emailService } from './emailService';
import EmailStyleService from './emailStyleService';

export interface CreateEmailTemplateData {
  name: string;
  displayName: string;
  subject: string;
  body: string;
  htmlBody?: string;
  variables: Record<string, string>; // variable name -> description
  isActive?: boolean;
}

export interface UpdateEmailTemplateData {
  displayName?: string;
  subject?: string;
  body?: string;
  htmlBody?: string;
  variables?: Record<string, string>;
  isActive?: boolean;
}

export interface EmailTemplateFilters {
  isActive?: boolean;
  search?: string;
}

/**
 * Service for managing email templates
 */
export class EmailTemplateService {
  /**
   * Create a new email template
   */
  async create(data: CreateEmailTemplateData, userId?: string): Promise<EmailTemplate> {
    // Validate unique name
    const existing = await prisma.emailTemplate.findUnique({
      where: { name: data.name }
    });

    if (existing) {
      throw new ValidationError(`Email template with name '${data.name}' already exists`);
    }

    // Validate template syntax
    this.validateTemplate(data.subject, data.body, data.htmlBody, data.variables);

    const template = await prisma.emailTemplate.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        subject: data.subject,
        body: data.body,
        htmlBody: data.htmlBody,
        variables: data.variables,
        isActive: data.isActive ?? true
      }
    });

    await auditService.log({
      userId,
      action: 'CREATE',
      resource: 'EmailTemplate',
      resourceId: template.id,
      details: { name: data.name }
    });

    return template;
  }

  /**
   * Find email template by ID
   */
  async findById(id: string): Promise<EmailTemplate> {
    const template = await prisma.emailTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      throw new NotFoundError('EmailTemplate', id);
    }

    return template;
  }

  /**
   * Find email template by name
   */
  async findByName(name: string): Promise<EmailTemplate | null> {
    return prisma.emailTemplate.findUnique({
      where: { name }
    });
  }

  /**
   * Update email template
   */
  async update(id: string, data: UpdateEmailTemplateData, userId?: string): Promise<EmailTemplate> {
    const existing = await this.findById(id);

    // Validate template syntax if updating content
    if (data.subject || data.body || data.htmlBody || data.variables) {
      this.validateTemplate(
        data.subject || existing.subject,
        data.body || existing.body,
        data.htmlBody || existing.htmlBody,
        data.variables || (existing.variables as Record<string, string>)
      );
    }

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        displayName: data.displayName,
        subject: data.subject,
        body: data.body,
        htmlBody: data.htmlBody,
        variables: data.variables,
        isActive: data.isActive,
        updatedAt: new Date()
      }
    });

    await auditService.log({
      userId,
      action: 'UPDATE',
      resource: 'EmailTemplate',
      resourceId: id,
      details: { changes: Object.keys(data) }
    });

    return template;
  }

  /**
   * Delete email template
   */
  async delete(id: string, userId?: string): Promise<void> {
    const template = await this.findById(id);

    await prisma.emailTemplate.delete({
      where: { id }
    });

    await auditService.log({
      userId,
      action: 'DELETE',
      resource: 'EmailTemplate',
      resourceId: id,
      details: { name: template.name }
    });
  }

  /**
   * List email templates with filters
   */
  async list(filters: EmailTemplateFilters = {}) {
    const where: Prisma.EmailTemplateWhereInput = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { displayName: { contains: filters.search, mode: 'insensitive' } },
        { subject: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: { displayName: 'asc' }
    });

    return templates;
  }

  /**
   * Preview email template with sample data
   */
  async preview(templateId: string, sampleData: Record<string, any>): Promise<{
    subject: string;
    text: string;
    html?: string;
  }> {
    const template = await this.findById(templateId);

    // Replace variables in content
    let subject = template.subject;
    let text = template.body;
    let html = template.htmlBody || undefined;

    Object.entries(sampleData).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      text = text.replace(new RegExp(placeholder, 'g'), String(value));
      if (html) {
        html = html.replace(new RegExp(placeholder, 'g'), String(value));
      }
    });

    return { subject, text, html };
  }

  /**
   * Send test email using template
   */
  async sendTest(templateId: string, to: string, sampleData: Record<string, any>): Promise<void> {
    const template = await this.findById(templateId);

    if (!template.isActive) {
      throw new ValidationError('Cannot send test email for inactive template');
    }

    const preview = await this.preview(templateId, sampleData);

    const result = await emailService.send({
      to,
      subject: `[TEST] ${preview.subject}`,
      text: preview.text,
      html: preview.html,
      tags: [
        { name: 'type', value: 'test' },
        { name: 'template', value: template.name }
      ]
    });

    if (!result.success) {
      throw new ValidationError(`Failed to send test email: ${result.error}`);
    }
  }

  /**
   * Send email using template
   */
  async sendEmail(
    templateName: string,
    to: string | string[],
    variables: Record<string, any>,
    options?: {
      replyTo?: string;
      tags?: { name: string; value: string }[];
    }
  ): Promise<{ success: boolean; error?: string }> {
    const template = await this.findByName(templateName);

    if (!template) {
      throw new NotFoundError('EmailTemplate', templateName);
    }

    if (!template.isActive) {
      console.log(`[EmailTemplateService] Template '${templateName}' is inactive, skipping email`);
      return { success: true };
    }

    // Replace variables
    let subject = template.subject;
    let text = template.body;
    let html = template.htmlBody || undefined;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      text = text.replace(new RegExp(placeholder, 'g'), String(value));
      if (html) {
        html = html.replace(new RegExp(placeholder, 'g'), String(value));
      }
    });

    const result = await emailService.send({
      to,
      subject,
      text,
      html,
      replyTo: options?.replyTo,
      tags: [
        { name: 'template', value: template.name },
        ...(options?.tags || [])
      ]
    });

    return {
      success: result.success,
      error: result.error
    };
  }

  /**
   * Validate template syntax
   */
  private validateTemplate(
    subject: string,
    body: string,
    htmlBody?: string | null,
    variables?: Record<string, string>
  ): void {
    const allContent = subject + body + (htmlBody || '');
    const foundVariables = new Set<string>();

    // Find all variables in templates
    const variableRegex = /\{\{(\w+)\}\}/g;
    let match;
    while ((match = variableRegex.exec(allContent)) !== null) {
      foundVariables.add(match[1]);
    }

    // Check if all found variables are documented
    const documentedVariables = new Set(Object.keys(variables || {}));
    const undocumentedVars = Array.from(foundVariables).filter(v => !documentedVariables.has(v));

    if (undocumentedVars.length > 0) {
      throw new ValidationError(
        `Template contains undocumented variables: ${undocumentedVars.join(', ')}`
      );
    }

    // Validate basic template requirements
    if (!subject.trim()) {
      throw new ValidationError('Email subject cannot be empty');
    }

    if (!body.trim()) {
      throw new ValidationError('Email body cannot be empty');
    }
  }

  /**
   * Get default templates for seeding
   */
  static getDefaultTemplates(): CreateEmailTemplateData[] {
    return [
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
        htmlBody: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Tattoo Request Received</h1>
    </div>
    <div class="content">
      <p>Hi {{customerName}},</p>
      <p>Thank you for submitting your tattoo request! We've received your inquiry and will review it shortly.</p>
      
      <div class="details">
        <h3>Request Details:</h3>
        <ul>
          <li><strong>Description:</strong> {{description}}</li>
          <li><strong>Placement:</strong> {{placement}}</li>
          <li><strong>Size:</strong> {{size}}</li>
          <li><strong>Style:</strong> {{style}}</li>
          <li><strong>Preferred Artist:</strong> {{preferredArtist}}</li>
        </ul>
      </div>
      
      <h3>What happens next?</h3>
      <p>Our team will review your request and get back to you within 24-48 hours. We'll discuss your design ideas, provide a quote, and schedule a consultation if needed.</p>
      
      {{#if trackingToken}}
      <p><a href="{{trackingUrl}}" style="background-color: #1a1a1a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Track Your Request</a></p>
      {{/if}}
      
      <p>If you have any questions in the meantime, feel free to reply to this email or call us at (604) 123-4567.</p>
    </div>
    <div class="footer">
      <p>Best regards,<br>Bowen Island Tattoo Shop</p>
    </div>
  </div>
</body>
</html>`,
        variables: {
          customerName: 'Customer name',
          description: 'Tattoo description',
          placement: 'Body placement',
          size: 'Tattoo size',
          style: 'Tattoo style',
          preferredArtist: 'Preferred artist name',
          trackingToken: 'Tracking token for anonymous requests',
          trackingUrl: 'URL to track request status'
        }
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
Bowen Island Tattoo Shop
123 Main Street, Bowen Island, BC

Important Reminders:
- Please arrive 10 minutes early
- Bring a valid ID
- Eat a good meal before your appointment
- Wear comfortable clothing

If you need to reschedule or cancel, please let us know at least 24 hours in advance.

See you soon!
Bowen Island Tattoo Shop`,
        variables: {
          customerName: 'Customer name',
          appointmentDate: 'Appointment date',
          appointmentTime: 'Appointment time',
          duration: 'Appointment duration',
          artistName: 'Artist name',
          appointmentType: 'Type of appointment'
        }
      },
      {
        name: 'appointment_reminder',
        displayName: 'Appointment Reminder',
        subject: 'Reminder: Your appointment is {{timeUntil}}',
        body: `Hi {{customerName}},

This is a friendly reminder about your upcoming appointment:

Date: {{appointmentDate}}
Time: {{appointmentTime}}
Artist: {{artistName}}

Please remember to:
- Arrive 10 minutes early
- Bring a valid ID
- Eat a good meal beforehand
- Wear comfortable clothing

If you need to reschedule, please contact us as soon as possible.

See you soon!
Bowen Island Tattoo Shop`,
        variables: {
          customerName: 'Customer name',
          timeUntil: 'Time until appointment (e.g., "tomorrow", "in 1 hour")',
          appointmentDate: 'Appointment date',
          appointmentTime: 'Appointment time',
          artistName: 'Artist name'
        }
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
        variables: {
          customerName: 'Customer name'
        }
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
        htmlBody: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .reminder { background-color: #fff3cd; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #ffc107; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Appointment Reminder</h1>
    </div>
    <div class="content">
      <p>Hi {{customerName}},</p>
      <p>This is a friendly reminder that you have an appointment <strong>tomorrow</strong> at Bowen Island Tattoo Shop.</p>
      
      <div class="details">
        <h3>Appointment Details:</h3>
        <ul>
          <li><strong>Date:</strong> {{appointmentDate}}</li>
          <li><strong>Time:</strong> {{appointmentTime}}</li>
          <li><strong>Duration:</strong> {{duration}}</li>
          <li><strong>Artist:</strong> {{artistName}}</li>
          <li><strong>Type:</strong> {{appointmentType}}</li>
        </ul>
      </div>
      
      <div class="reminder">
        <h3>Important Reminders:</h3>
        <ul>
          <li>Please arrive 10 minutes early</li>
          <li>Eat a good meal before your appointment</li>
          <li>Stay hydrated</li>
          <li>Wear comfortable clothing</li>
          <li>Bring a valid ID</li>
        </ul>
      </div>
      
      <p>If you need to reschedule or cancel, please let us know at least 24 hours in advance by calling <strong>(604) 123-4567</strong>.</p>
      
      <p>We're looking forward to seeing you!</p>
    </div>
    <div class="footer">
      <p>Best regards,<br>Bowen Island Tattoo Shop</p>
    </div>
  </div>
</body>
</html>`,
        variables: {
          customerName: 'Customer name',
          appointmentDate: 'Appointment date (formatted)',
          appointmentTime: 'Appointment time',
          duration: 'Appointment duration',
          artistName: 'Artist name',
          appointmentType: 'Type of appointment'
        }
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
        variables: {
          customerName: 'Customer name',
          appointmentTime: 'Appointment time',
          artistName: 'Artist name'
        }
      },
      {
        name: 'review_request',
        displayName: 'Review Request',
        subject: 'How was your experience with us?',
        body: `Hi {{customerName}},

We hope you're loving your new tattoo! It's been a week since your {{appointmentType}} with {{artistName}}, and we'd love to hear about your experience.

Your feedback helps us improve our services and lets other clients know what to expect. Would you mind taking a moment to share your thoughts?

You can leave a review on:
- Google: [Google Review Link]
- Facebook: [Facebook Page]
- Instagram: @bowenislandtattoo

Thank you for choosing Bowen Island Tattoo Shop. We appreciate your trust in us and hope to see you again!

Best regards,
Bowen Island Tattoo Shop Team`,
        htmlBody: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .review-links { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; }
    .review-links a { display: inline-block; margin: 10px; padding: 10px 20px; background-color: #1a1a1a; color: white; text-decoration: none; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>How was your experience?</h1>
    </div>
    <div class="content">
      <p>Hi {{customerName}},</p>
      <p>We hope you're loving your new tattoo! It's been a week since your {{appointmentType}} with {{artistName}}, and we'd love to hear about your experience.</p>
      
      <p>Your feedback helps us improve our services and lets other clients know what to expect. Would you mind taking a moment to share your thoughts?</p>
      
      <div class="review-links">
        <h3>Leave a review on:</h3>
        <a href="#">Google Review</a>
        <a href="#">Facebook</a>
        <a href="#">Instagram</a>
      </div>
      
      <p>Thank you for choosing Bowen Island Tattoo Shop. We appreciate your trust in us and hope to see you again!</p>
    </div>
    <div class="footer">
      <p>Best regards,<br>Bowen Island Tattoo Shop Team</p>
    </div>
  </div>
</body>
</html>`,
        variables: {
          customerName: 'Customer name',
          appointmentType: 'Type of appointment',
          artistName: 'Artist name'
        }
      },
      {
        name: 're_engagement',
        displayName: 'Re-engagement Campaign',
        subject: 'We miss you at Bowen Island Tattoo Shop!',
        body: `Hi {{customerName}},

It's been a while since we've seen you at Bowen Island Tattoo Shop, and we wanted to check in!

Whether you're thinking about:
- Adding to your existing tattoo
- Starting a new piece
- Getting a touch-up
- Or just have questions about tattoo care

We're here to help! Our talented artists are always creating amazing new work, and we'd love to help bring your next tattoo idea to life.

What's new at the shop:
- Fresh designs and flash available
- New guest artists visiting regularly
- Updated safety protocols for your peace of mind

Ready to book your next session? Reply to this email or call us at (604) 123-4567.

We hope to see you again soon!

Best regards,
Bowen Island Tattoo Shop Team

P.S. If you no longer wish to receive emails from us, you can unsubscribe at any time.`,
        variables: {
          customerName: 'Customer name'
        }
      },
      {
        name: 'abandoned_request_recovery',
        displayName: 'Abandoned Request Recovery',
        subject: 'Still thinking about that tattoo?',
        body: `Hi {{customerName}},

We noticed you started a tattoo request with us but haven't completed it yet. We understand that getting a tattoo is a big decision, and we're here to help with any questions you might have!

Your tattoo idea: {{description}}

Common questions we can help with:
- Design refinement and customization
- Pricing and payment options
- Artist availability and scheduling
- Tattoo placement and sizing advice
- Aftercare information

Don't let your dream tattoo remain just an idea! Our artists are excited to work with you to create something truly special.

{{#if trackingUrl}}
Continue where you left off: {{trackingUrl}}
{{/if}}

Or feel free to:
- Reply to this email with any questions
- Call us at (604) 123-4567
- Visit us at the shop

We're here to help make your tattoo journey as smooth as possible!

Best regards,
Bowen Island Tattoo Shop Team`,
        variables: {
          customerName: 'Customer name',
          description: 'Tattoo request description',
          trackingUrl: 'URL to track request (if available)'
        }
      },
      // Owner/Admin Notification Templates
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
        htmlBody: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #C9A449; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    .action-button { background-color: #1a1a1a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎨 New Tattoo Request</h1>
    </div>
    <div class="content">
      <div class="details">
        <h3>Customer Details:</h3>
        <ul>
          <li><strong>Name:</strong> {{customerName}}</li>
          <li><strong>Email:</strong> {{customerEmail}}</li>
          <li><strong>Phone:</strong> {{customerPhone}}</li>
        </ul>
      </div>
      
      <div class="details">
        <h3>Request Details:</h3>
        <ul>
          <li><strong>Description:</strong> {{description}}</li>
          <li><strong>Placement:</strong> {{placement}}</li>
          <li><strong>Size:</strong> {{size}}</li>
          <li><strong>Style:</strong> {{style}}</li>
          <li><strong>Preferred Artist:</strong> {{preferredArtist}}</li>
          <li><strong>Timeframe:</strong> {{timeframe}}</li>
          <li><strong>Additional Notes:</strong> {{additionalNotes}}</li>
        </ul>
      </div>
      
      <a href="{{dashboardUrl}}" class="action-button">View in Dashboard</a>
    </div>
    <div class="footer">
      <p>This is an automated notification for shop owners.</p>
    </div>
  </div>
</body>
</html>`,
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
          dashboardUrl: 'URL to dashboard'
        }
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
        }
      },
      {
        name: 'owner_payment_received',
        displayName: 'Owner: Payment Received',
        subject: '💰 Payment Received - ${{amount}}',
        body: `Payment received!

Customer: {{customerName}}
Amount: ${{amount}}
Payment Method: {{paymentMethod}}
Date: {{paymentDate}}

Related to: {{relatedService}}
{{#if appointmentId}}
Appointment ID: {{appointmentId}}
{{/if}}

Transaction ID: {{transactionId}}

View in Dashboard: {{dashboardUrl}}

This notification was sent to the shop owner.`,
        variables: {
          customerName: 'Customer name',
          amount: 'Payment amount',
          paymentMethod: 'Payment method used',
          paymentDate: 'Date of payment',
          relatedService: 'Related service/appointment',
          appointmentId: 'Related appointment ID',
          transactionId: 'Payment transaction ID',
          dashboardUrl: 'URL to dashboard'
        }
      },
      {
        name: 'owner_appointment_cancelled',
        displayName: 'Owner: Appointment Cancelled',
        subject: '❌ Appointment Cancelled - {{appointmentDate}}',
        body: `Appointment cancelled!

Customer: {{customerName}}
Original Date: {{appointmentDate}}
Original Time: {{appointmentTime}}
Artist: {{artistName}}

Cancellation Reason: {{cancellationReason}}
Cancelled At: {{cancelledAt}}

View in Dashboard: {{dashboardUrl}}

This notification was sent to the shop owner.`,
        variables: {
          customerName: 'Customer name',
          appointmentDate: 'Original appointment date',
          appointmentTime: 'Original appointment time',
          artistName: 'Assigned artist',
          cancellationReason: 'Reason for cancellation',
          cancelledAt: 'When cancellation occurred',
          dashboardUrl: 'URL to dashboard'
        }
      }
    ];
  }
}

// Export singleton instance
export const emailTemplateService = new EmailTemplateService();
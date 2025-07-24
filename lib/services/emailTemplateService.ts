import { prisma } from '../prisma/prisma';
import { NotFoundError, ValidationError } from './errors';
import type { EmailTemplate, Prisma } from '@prisma/client';
import { auditService } from './auditService';
import { emailService } from './emailService';

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
      }
    ];
  }
}

// Export singleton instance
export const emailTemplateService = new EmailTemplateService();
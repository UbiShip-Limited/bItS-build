import { Resend } from 'resend';
import { auditService } from './auditService';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface EmailResult {
  id: string;
  success: boolean;
  error?: string;
}

/**
 * Service for sending emails using Resend
 */
export class EmailService {
  private resend: Resend | null = null;
  private from: string;
  private enabled: boolean;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.from = process.env.EMAIL_FROM || 'noreply@bowenislandtattooshop.com';
    this.enabled = process.env.EMAIL_ENABLED !== 'false' && !!apiKey;

    if (this.enabled && apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      console.warn('Email service is disabled. Set RESEND_API_KEY to enable.');
    }
  }

  /**
   * Send an email using Resend
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    const { to, subject, text, html, from = this.from, replyTo, tags } = options;

    // If email is disabled, log and return success
    if (!this.enabled || !this.resend) {
      console.log('[EmailService] Email disabled. Would send:', {
        to,
        subject,
        preview: text?.substring(0, 100)
      });
      
      await auditService.log({
        action: 'EMAIL_SKIPPED',
        resource: 'Email',
        details: {
          to: Array.isArray(to) ? to : [to],
          subject,
          reason: 'Email service disabled'
        }
      });

      return {
        id: 'mock-email-' + Date.now(),
        success: true
      };
    }

    try {
      // Send email using Resend
      const emailOptions: any = {
        from: from,
        to: Array.isArray(to) ? to : [to],
        subject,
        replyTo: replyTo,
      };

      if (html) {
        emailOptions.html = html;
      }

      if (text) {
        emailOptions.text = text;
      }

      if (tags) {
        emailOptions.tags = tags;
      }

      const result = await this.resend.emails.send(emailOptions);

      // Log successful email
      await auditService.log({
        action: 'EMAIL_SENT',
        resource: 'Email',
        resourceId: result.data?.id,
        details: {
          to: Array.isArray(to) ? to : [to],
          subject,
          provider: 'resend'
        }
      });

      return {
        id: result.data?.id || '',
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log failed email
      await auditService.log({
        action: 'EMAIL_FAILED',
        resource: 'Email',
        details: {
          to: Array.isArray(to) ? to : [to],
          subject,
          error: errorMessage,
          provider: 'resend'
        }
      });

      console.error('[EmailService] Failed to send email:', error);
      
      return {
        id: '',
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Send email with template
   */
  async sendWithTemplate(
    to: string | string[],
    subject: string,
    templateData: {
      text: string;
      html?: string;
      variables?: Record<string, any>;
    }
  ): Promise<EmailResult> {
    // Replace variables in content
    let processedText = templateData.text;
    let processedHtml = templateData.html;

    if (templateData.variables) {
      Object.entries(templateData.variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        processedText = processedText.replace(new RegExp(placeholder, 'g'), String(value));
        if (processedHtml) {
          processedHtml = processedHtml.replace(new RegExp(placeholder, 'g'), String(value));
        }
      });
    }

    return this.send({
      to,
      subject,
      text: processedText,
      html: processedHtml
    });
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      // Send a test email to verify configuration
      const result = await this.send({
        to: this.from,
        subject: 'Resend Email Service Test',
        text: 'This is a test email to verify your Resend configuration is working correctly.',
        html: '<p>This is a test email to verify your Resend configuration is working correctly.</p>'
      });

      return result.success;
    } catch (error) {
      console.error('[EmailService] Test connection failed:', error);
      return false;
    }
  }

  /**
   * Check if email service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const emailService = new EmailService();
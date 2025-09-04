/**
 * Email Template Generator
 * Generates enhanced HTML email templates with Bowen Island styling using our enhanced template system
 */

import EmailStyleService from './emailStyleService';
import { 
  generateTattooRequestConfirmation, 
  generateAppointmentConfirmation, 
  generate24HourReminder, 
  generateAftercareInstructions, 
  generateOwnerNewRequest 
} from '../email/templates/enhancedTemplates';

/**
 * Generate enhanced tattoo request confirmation template
 */
export function getTattooRequestTemplate() {
  // Use the enhanced template with firstName support
  const mockData = {
    customerName: '{{customerName}}',
    firstName: '{{firstName}}',
    contactEmail: '{{contactEmail}}',
    description: '{{description}}',
    placement: '{{placement}}',
    size: '{{size}}',
    style: '{{style}}',
    preferredArtist: '{{preferredArtist}}',
    trackingToken: '{{trackingToken}}',
    trackingUrl: '{{trackingUrl}}'
  };
  
  return generateTattooRequestConfirmation(mockData).html;
}

/**
 * Generate enhanced appointment confirmation template
 */
export function getAppointmentConfirmationTemplate() {
  // Use the enhanced template with firstName support
  const mockData = {
    customerName: '{{customerName}}',
    firstName: '{{firstName}}',
    contactEmail: '{{contactEmail}}',
    appointmentDate: '{{appointmentDate}}',
    appointmentTime: '{{appointmentTime}}',
    duration: '{{duration}}',
    artistName: '{{artistName}}',
    appointmentType: '{{appointmentType}}'
  };
  
  return generateAppointmentConfirmation(mockData).html;
}

/**
 * Generate enhanced 24-hour reminder template
 */
export function get24HourReminderTemplate() {
  // Use the enhanced template with firstName support
  const mockData = {
    customerName: '{{customerName}}',
    firstName: '{{firstName}}',
    contactEmail: '{{contactEmail}}',
    appointmentDate: '{{appointmentDate}}',
    appointmentTime: '{{appointmentTime}}',
    duration: '{{duration}}',
    artistName: '{{artistName}}',
    appointmentType: '{{appointmentType}}'
  };
  
  return generate24HourReminder(mockData).html;
}

/**
 * Generate enhanced aftercare instructions template
 */
export function getAftercareTemplate() {
  // Use the enhanced template with firstName support
  const mockData = {
    customerName: '{{customerName}}',
    firstName: '{{firstName}}',
    contactEmail: '{{contactEmail}}'
  };
  
  return generateAftercareInstructions(mockData).html;
}

/**
 * Generate enhanced owner notification template
 */
export function getOwnerNotificationTemplate() {
  // Use the enhanced template with firstName support
  const mockData = {
    customerName: '{{customerName}}',
    firstName: '{{firstName}}',
    customerEmail: '{{customerEmail}}',
    customerPhone: '{{customerPhone}}',
    description: '{{description}}',
    placement: '{{placement}}',
    size: '{{size}}',
    style: '{{style}}',
    preferredArtist: '{{preferredArtist}}',
    timeframe: '{{timeframe}}',
    additionalNotes: '{{additionalNotes}}',
    referenceImages: 0, // Will be replaced by template processor
    dashboardUrl: '{{dashboardUrl}}'
  };
  
  return generateOwnerNewRequest(mockData).html;
}

/**
 * Generate enhanced payment link template
 */
export function getPaymentLinkTemplate() {
  // For now, use a simple styled template until we create an enhanced version
  const content = `
    ${EmailStyleService.createCard('', `
      <p style="font-size: 18px; color: #FAFAF9; margin-bottom: 24px;">
        Hi <strong>{{customerName}}</strong>,
      </p>
      <p>Ready to secure your spot? Here's your payment link:</p>
    `, '💳')}

    <div style="text-align: center; margin: 32px 0;">
      ${EmailStyleService.createButton('Pay Now - $' + '{{amount}}', '{{paymentLink}}', 'primary')}
    </div>

    ${EmailStyleService.createHighlight(`
      <strong>Amount:</strong> $` + '{{amount}}' + `<br>
      <strong>For:</strong> {{title}}<br>
      {{#if description}}<strong>Details:</strong> {{description}}<br>{{/if}}
      {{#if appointmentDate}}<strong>Appointment:</strong> {{appointmentDate}} at {{appointmentTime}}{{/if}}
    `, '💡')}

    ${EmailStyleService.createCard('Payment Options', `
      <p>You can pay with:</p>
      <ul>
        <li>Credit/Debit Card</li>
        <li>Apple Pay or Google Pay</li>
        {{#if allowTipping}}<li>Add a tip if you're feeling generous 😊</li>{{/if}}
      </ul>
    `, '💳')}
  `;

  const { html } = EmailStyleService.createEmailTemplate('', content, {
    showHeader: true,
    showFooter: true
  });

  return html;
}
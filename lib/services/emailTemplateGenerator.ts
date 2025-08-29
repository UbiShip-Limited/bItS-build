/**
 * Email Template Generator
 * Generates enhanced HTML email templates with Bowen Island styling
 */

import EmailStyleService from './emailStyleService';

/**
 * Generate enhanced tattoo request confirmation template
 */
export function getTattooRequestTemplate() {
  const content = `
    ${EmailStyleService.createCard('', `
      <p style="font-size: 18px; color: #FAFAF9; margin-bottom: 24px;">
        Hi <strong>{{customerName}}</strong>,
      </p>
      <p>Thank you for submitting your tattoo request! We're excited to bring your vision to life. Our team will review your request and get back to you within 24-48 hours.</p>
    `, '🎨')}

    ${EmailStyleService.createDivider('ornamental')}

    <h2 style="font-family: 'Cinzel', serif; color: #B8956A; text-align: center; margin-bottom: 32px;">
      Your Request Details
    </h2>

    ${EmailStyleService.createCard('', `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #B8956A;">Description:</strong>
            <p style="margin: 8px 0 16px 0;">{{description}}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td width="50%">
                  <strong style="color: #B8956A;">Placement:</strong><br>
                  <span style="color: rgba(250, 250, 249, 0.7);">{{placement}}</span>
                </td>
                <td width="50%">
                  <strong style="color: #B8956A;">Size:</strong><br>
                  <span style="color: rgba(250, 250, 249, 0.7);">{{size}}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 0 8px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td width="50%">
                  <strong style="color: #B8956A;">Style:</strong><br>
                  <span style="color: rgba(250, 250, 249, 0.7);">{{style}}</span>
                </td>
                <td width="50%">
                  <strong style="color: #B8956A;">Preferred Artist:</strong><br>
                  <span style="color: rgba(250, 250, 249, 0.7);">{{preferredArtist}}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `)}

    ${EmailStyleService.createDivider('simple')}

    <h3 style="font-family: 'Cinzel', serif; color: #B8956A; margin-bottom: 16px;">
      What Happens Next?
    </h3>

    ${EmailStyleService.createList([
      'Our team will review your request and design ideas',
      'We\'ll provide a quote and discuss any refinements',
      'Schedule a consultation if needed for complex designs',
      'Book your tattoo session once everything is confirmed'
    ])}

    {{#if trackingToken}}
    <div style="text-align: center; margin: 32px 0;">
      ${EmailStyleService.createButton('Track Your Request', '{{trackingUrl}}', 'primary')}
    </div>
    {{/if}}

    ${EmailStyleService.createHighlight(`
      <strong>Questions?</strong> Reply to this email or call us at <a href="tel:6041234567" style="color: #B8956A;">(604) 123-4567</a>
    `, '💬')}
  `;

  const { html } = EmailStyleService.createEmailTemplate('', content, {
    showHeader: true,
    showFooter: true
  });

  return html;
}

/**
 * Generate enhanced appointment confirmation template
 */
export function getAppointmentConfirmationTemplate() {
  const content = `
    ${EmailStyleService.createCard('', `
      <p style="font-size: 18px; color: #FAFAF9; margin-bottom: 24px;">
        Hi <strong>{{customerName}}</strong>,
      </p>
      <p>Your appointment has been confirmed! We're looking forward to seeing you.</p>
    `, '✅')}

    ${EmailStyleService.createDivider('ornamental')}

    <div style="background: linear-gradient(135deg, rgba(184, 149, 106, 0.15), rgba(184, 149, 106, 0.05)); border: 2px solid #B8956A; border-radius: 12px; padding: 32px; margin: 32px 0; text-align: center;">
      <h2 style="font-family: 'Cinzel', serif; color: #B8956A; margin-bottom: 24px; font-size: 28px;">
        Your Appointment
      </h2>
      
      <div style="margin-bottom: 16px;">
        <span style="font-size: 24px;">📅</span>
      </div>
      
      <p style="font-size: 20px; color: #FAFAF9; margin-bottom: 8px;">
        <strong>{{appointmentDate}}</strong>
      </p>
      
      <p style="font-size: 32px; color: #B8956A; margin-bottom: 24px; font-weight: 600;">
        {{appointmentTime}}
      </p>
      
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
        <tr>
          <td width="33%" style="text-align: center; padding: 0 8px;">
            <strong style="color: #B8956A; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Duration</strong><br>
            <span style="color: rgba(250, 250, 249, 0.9); font-size: 16px;">{{duration}}</span>
          </td>
          <td width="34%" style="text-align: center; padding: 0 8px; border-left: 1px solid rgba(184, 149, 106, 0.3); border-right: 1px solid rgba(184, 149, 106, 0.3);">
            <strong style="color: #B8956A; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Artist</strong><br>
            <span style="color: rgba(250, 250, 249, 0.9); font-size: 16px;">{{artistName}}</span>
          </td>
          <td width="33%" style="text-align: center; padding: 0 8px;">
            <strong style="color: #B8956A; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Type</strong><br>
            <span style="color: rgba(250, 250, 249, 0.9); font-size: 16px;">{{appointmentType}}</span>
          </td>
        </tr>
      </table>
    </div>

    ${EmailStyleService.createDivider('simple')}

    <h3 style="font-family: 'Cinzel', serif; color: #B8956A; margin-bottom: 16px;">
      Important Reminders
    </h3>

    ${EmailStyleService.createList([
      'Please arrive 10 minutes early to complete any paperwork',
      'Bring a valid government-issued ID',
      'Eat a good meal before your appointment',
      'Wear comfortable clothing that allows easy access to the tattoo area',
      'Stay hydrated before and after your session'
    ])}

    ${EmailStyleService.createHighlight(`
      <strong>Need to reschedule?</strong> Please let us know at least 24 hours in advance by calling <a href="tel:6041234567" style="color: #B8956A;">(604) 123-4567</a>
    `, '⚠️')}
  `;

  const { html } = EmailStyleService.createEmailTemplate('', content, {
    showHeader: true,
    showFooter: true
  });

  return html;
}

/**
 * Generate 24-hour reminder template
 */
export function get24HourReminderTemplate() {
  const content = `
    ${EmailStyleService.createCard('', `
      <p style="font-size: 18px; color: #FAFAF9; margin-bottom: 24px;">
        Hi <strong>{{customerName}}</strong>,
      </p>
      <p>Just a friendly reminder that your tattoo appointment is <strong style="color: #B8956A;">tomorrow</strong>!</p>
    `, '⏰')}

    <div style="background: rgba(184, 149, 106, 0.1); border-left: 4px solid #B8956A; padding: 24px; margin: 32px 0; border-radius: 4px;">
      <h3 style="font-family: 'Cinzel', serif; color: #B8956A; margin-bottom: 16px; font-size: 20px;">
        Tomorrow's Appointment
      </h3>
      
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #B8956A;">Date:</strong> {{appointmentDate}}<br>
            <strong style="color: #B8956A;">Time:</strong> {{appointmentTime}}<br>
            <strong style="color: #B8956A;">Duration:</strong> {{duration}}<br>
            <strong style="color: #B8956A;">Artist:</strong> {{artistName}}<br>
            <strong style="color: #B8956A;">Service:</strong> {{appointmentType}}
          </td>
        </tr>
      </table>
    </div>

    ${EmailStyleService.createDivider('ornamental')}

    <h3 style="font-family: 'Cinzel', serif; color: #B8956A; margin-bottom: 16px;">
      Pre-Appointment Checklist
    </h3>

    <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(184, 149, 106, 0.2); border-radius: 12px; padding: 24px;">
      ${EmailStyleService.createList([
        '✓ Get a good night\'s sleep',
        '✓ Eat a substantial meal before coming in',
        '✓ Stay hydrated - drink plenty of water',
        '✓ Wear comfortable, loose-fitting clothing',
        '✓ Bring your ID and any reference images',
        '✓ Avoid alcohol and blood-thinning medications'
      ])}
    </div>

    ${EmailStyleService.createHighlight(`
      <strong>Running late or need to reschedule?</strong><br>
      Please call us immediately at <a href="tel:6041234567" style="color: #B8956A;">(604) 123-4567</a>
    `, '📞')}

    <div style="text-align: center; margin: 32px 0;">
      <p style="color: rgba(250, 250, 249, 0.7); font-style: italic; margin-bottom: 16px;">
        We're excited to work with you tomorrow!
      </p>
    </div>
  `;

  const { html } = EmailStyleService.createEmailTemplate('', content, {
    showHeader: true,
    showFooter: true
  });

  return html;
}

/**
 * Generate aftercare instructions template
 */
export function getAftercareTemplate() {
  const content = `
    ${EmailStyleService.createCard('', `
      <p style="font-size: 18px; color: #FAFAF9; margin-bottom: 24px;">
        Hi <strong>{{customerName}}</strong>,
      </p>
      <p>Thank you for choosing Bowen Island Tattoo Shop! Your new tattoo looks amazing, and we want to make sure it heals perfectly.</p>
    `, '🌟')}

    ${EmailStyleService.createDivider('ornamental')}

    <h2 style="font-family: 'Cinzel', serif; color: #B8956A; text-align: center; margin-bottom: 32px;">
      Aftercare Instructions
    </h2>

    ${EmailStyleService.createCard('First 24 Hours', `
      ${EmailStyleService.createList([
        'Keep the bandage on for 2-4 hours',
        'Gently wash with unscented antibacterial soap and warm water',
        'Pat dry with a clean paper towel (not cloth)',
        'Apply a thin layer of aftercare ointment',
        'Re-bandage only if recommended by your artist'
      ])}
    `, '🕐')}

    ${EmailStyleService.createCard('Days 2-14: Healing Phase', `
      ${EmailStyleService.createList([
        'Wash your tattoo 2-3 times daily with gentle soap',
        'Apply aftercare ointment/lotion sparingly after washing',
        'Keep the tattoo moisturized but not oversaturated',
        'Avoid swimming, hot tubs, and direct sunlight',
        'Do NOT pick, scratch, or peel the tattoo',
        'Wear loose, clean clothing over the area'
      ])}
    `, '📅')}

    ${EmailStyleService.createCard('General Care Tips', `
      ${EmailStyleService.createList([
        'Stay hydrated - drink plenty of water',
        'Avoid strenuous exercise for 48 hours',
        'Sleep on clean sheets and pillowcases',
        'Avoid direct sunlight for at least 2 weeks',
        'Once healed, always use sunscreen on your tattoo',
        'Be patient - full healing takes 4-6 weeks'
      ])}
    `, '💡')}

    ${EmailStyleService.createDivider('simple')}

    ${EmailStyleService.createHighlight(`
      <strong style="color: #B8956A;">Warning Signs to Watch For:</strong><br>
      <span style="font-size: 14px;">Excessive redness, swelling, pus, or fever may indicate infection. If you notice any of these symptoms, contact us immediately and consult a healthcare provider.</span>
    `, '⚠️')}

    <div style="text-align: center; margin: 32px 0;">
      <p style="color: rgba(250, 250, 249, 0.7); margin-bottom: 24px;">
        Have questions about your healing tattoo?<br>
        We're here to help!
      </p>
    </div>

    <div style="background: linear-gradient(135deg, rgba(184, 149, 106, 0.1), rgba(184, 149, 106, 0.05)); border-radius: 12px; padding: 24px; margin-top: 32px; text-align: center;">
      <p style="font-size: 18px; color: #B8956A; margin-bottom: 8px; font-family: 'Cinzel', serif;">
        Take care of your new art!
      </p>
      <p style="color: rgba(250, 250, 249, 0.7); font-style: italic;">
        Proper aftercare ensures your tattoo heals beautifully and lasts a lifetime.
      </p>
    </div>
  `;

  const { html } = EmailStyleService.createEmailTemplate('', content, {
    showHeader: true,
    showFooter: true
  });

  return html;
}

/**
 * Generate payment link request template
 */
export function getPaymentLinkTemplate() {
  const content = [
    EmailStyleService.createCard('', `
      <p style="font-size: 18px; color: #FAFAF9; margin-bottom: 24px;">
        Hi <strong>\{{customerName}}</strong>,
      </p>
      <p>We've prepared a secure payment link for your \{{paymentType}}. You can complete your payment online at your convenience.</p>
    `, '💳'),

    EmailStyleService.createDivider('ornamental'),

    '<h2 style="font-family: \'Cinzel\', serif; color: #B8956A; text-align: center; margin-bottom: 32px;">Payment Details</h2>',

    EmailStyleService.createCard('', `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 16px 0; text-align: center;">
            <div style="display: inline-block; padding: 20px; background: rgba(184, 149, 106, 0.1); border-radius: 12px; border: 1px solid rgba(184, 149, 106, 0.3);">
              <p style="margin: 0 0 8px 0; color: #B8956A; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Amount Due</p>
              <p style="margin: 0; font-size: 36px; font-weight: bold; color: #FAFAF9;">
                $\{{amount}}
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #B8956A;">Payment For:</strong><br>
            <span style="color: rgba(250, 250, 249, 0.9); font-size: 16px;">\{{title}}</span>
          </td>
        </tr>
        \{{#if description}}
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #B8956A;">Description:</strong><br>
            <span style="color: rgba(250, 250, 249, 0.7);">\{{description}}</span>
          </td>
        </tr>
        \{{/if}}
        \{{#if appointmentDate}}
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #B8956A;">Appointment:</strong><br>
            <span style="color: rgba(250, 250, 249, 0.7);">\{{appointmentDate}} at \{{appointmentTime}}</span>
          </td>
        </tr>
        \{{/if}}
      </table>
    `),

    '<div style="text-align: center; margin: 32px 0;">',
    EmailStyleService.createButton('Pay Now', '\{{paymentLink}}', 'primary'),
    '</div>',

    EmailStyleService.createHighlight(`
      <strong>Payment Options:</strong><br>
      • Credit/Debit Card<br>
      • Apple Pay / Google Pay<br>
      \{{#if allowTipping}}• Option to add gratuity\{{/if}}
    `, '✅'),

    EmailStyleService.createDivider('simple'),

    EmailStyleService.createCard('', `
      <p style="color: rgba(250, 250, 249, 0.7); font-size: 14px; text-align: center;">
        <strong>Secure Payment:</strong> Your payment is processed securely through Square.<br>
        We never store your card information.
      </p>
      \{{#if expiresAt}}
      <p style="color: #B8956A; font-size: 14px; text-align: center; margin-top: 16px;">
        ⏰ This payment link expires on \{{expiresAt}}
      </p>
      \{{/if}}
    `),

    EmailStyleService.createHighlight(`
      <strong>Questions about your payment?</strong><br>
      Reply to this email or call us at <a href="tel:6041234567" style="color: #B8956A;">(604) 123-4567</a>
    `, '💬')
  ].join('\n');

  const { html } = EmailStyleService.createEmailTemplate('', content, {
    showHeader: true,
    showFooter: true
  });

  return html;
}

/**
 * Generate owner notification template
 */
export function getOwnerNotificationTemplate() {
  const content = `
    <div style="background: linear-gradient(135deg, rgba(184, 149, 106, 0.2), rgba(184, 149, 106, 0.1)); border: 2px solid #B8956A; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h2 style="font-family: 'Cinzel', serif; color: #B8956A; margin-bottom: 8px; text-align: center;">
        New Tattoo Request Received
      </h2>
      <p style="text-align: center; color: rgba(250, 250, 249, 0.7); margin: 0;">
        {{timestamp}}
      </p>
    </div>

    ${EmailStyleService.createCard('Customer Information', `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #B8956A;">Name:</strong> {{customerName}}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #B8956A;">Email:</strong> <a href="mailto:{{customerEmail}}" style="color: #D4B896;">{{customerEmail}}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #B8956A;">Phone:</strong> <a href="tel:{{customerPhone}}" style="color: #D4B896;">{{customerPhone}}</a>
          </td>
        </tr>
      </table>
    `, '👤')}

    ${EmailStyleService.createCard('Request Details', `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #B8956A;">Description:</strong><br>
            <p style="margin: 8px 0; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px;">
              {{description}}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td width="50%" style="padding-right: 12px;">
                  <strong style="color: #B8956A;">Placement:</strong> {{placement}}<br>
                  <strong style="color: #B8956A;">Size:</strong> {{size}}<br>
                  <strong style="color: #B8956A;">Style:</strong> {{style}}
                </td>
                <td width="50%">
                  <strong style="color: #B8956A;">Preferred Artist:</strong> {{preferredArtist}}<br>
                  <strong style="color: #B8956A;">Timeframe:</strong> {{timeframe}}<br>
                  {{#if referenceImages}}<strong style="color: #B8956A;">Images:</strong> {{referenceImages}} uploaded{{/if}}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        {{#if additionalNotes}}
        <tr>
          <td style="padding: 16px 0 8px 0;">
            <strong style="color: #B8956A;">Additional Notes:</strong><br>
            <p style="margin: 8px 0; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px;">
              {{additionalNotes}}
            </p>
          </td>
        </tr>
        {{/if}}
      </table>
    `, '🎨')}

    <div style="text-align: center; margin: 32px 0;">
      ${EmailStyleService.createButton('View in Dashboard', '{{dashboardUrl}}', 'primary')}
    </div>

    ${EmailStyleService.createHighlight(`
      <strong>Quick Actions:</strong> Review the request, assign to an artist, and respond to the customer through the dashboard.
    `, '⚡')}
  `;

  const { html } = EmailStyleService.createEmailTemplate('', content, {
    showHeader: false, // Simpler for internal emails
    showFooter: false
  });

  return html;
}
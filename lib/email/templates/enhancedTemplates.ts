/**
 * Enhanced Email Templates for Bowen Island Tattoo Shop
 * Beautiful, branded email templates that match the shop's aesthetic
 */

import EmailStyleService from '../../services/emailStyleService';
import { generateDisplayName } from '../../utils/displayNames';

/**
 * Generate tattoo request confirmation email
 */
export function generateTattooRequestConfirmation(variables: {
  customerName: string;
  firstName?: string;
  contactEmail?: string;
  description: string;
  placement: string;
  size: string;
  style: string;
  preferredArtist: string;
  trackingToken?: string;
  trackingUrl?: string;
}): { subject: string; html: string; text: string } {
  const subject = 'Your tattoo request has been received - Bowen Island Tattoo Shop';
  
  // Use firstName if available, otherwise use generateDisplayName for better personalization
  const displayName = variables.firstName || generateDisplayName(
    variables.customerName,
    variables.contactEmail
  );
  
  const content = `
    ${EmailStyleService.createCard('', `
      <p style="font-size: 18px; color: #FAFAF9; margin-bottom: 24px;">
        Hi <strong>${displayName}</strong>,
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
            <p style="margin: 8px 0 16px 0;">${variables.description}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td width="50%">
                  <strong style="color: #B8956A;">Placement:</strong><br>
                  <span style="color: rgba(250, 250, 249, 0.7);">${variables.placement}</span>
                </td>
                <td width="50%">
                  <strong style="color: #B8956A;">Size:</strong><br>
                  <span style="color: rgba(250, 250, 249, 0.7);">${variables.size}</span>
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
                  <span style="color: rgba(250, 250, 249, 0.7);">${variables.style}</span>
                </td>
                <td width="50%">
                  <strong style="color: #B8956A;">Preferred Artist:</strong><br>
                  <span style="color: rgba(250, 250, 249, 0.7);">${variables.preferredArtist}</span>
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

    ${variables.trackingUrl ? `
      <div style="text-align: center; margin: 32px 0;">
        ${EmailStyleService.createButton('Track Your Request', variables.trackingUrl, 'primary')}
      </div>
    ` : ''}

    ${EmailStyleService.createHighlight(`
      <strong>Questions?</strong> Reply to this email or call us at <a href="tel:6041234567" style="color: #B8956A;">(604) 123-4567</a>
    `, '💬')}
  `;

  const { html, text } = EmailStyleService.createEmailTemplate(subject, content, {
    preheader: 'We\'ve received your tattoo request and will be in touch soon!',
    showHeader: true,
    showFooter: true
  });

  return { subject, html, text };
}

/**
 * Generate appointment confirmation email
 */
export function generateAppointmentConfirmation(variables: {
  customerName: string;
  firstName?: string;
  contactEmail?: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: string;
  artistName: string;
  appointmentType: string;
}): { subject: string; html: string; text: string } {
  const subject = `Appointment Confirmation - ${variables.appointmentDate} at ${variables.appointmentTime}`;
  
  // Use firstName if available, otherwise use generateDisplayName for better personalization
  const displayName = variables.firstName || generateDisplayName(
    variables.customerName,
    variables.contactEmail
  );
  
  const content = `
    ${EmailStyleService.createCard('', `
      <p style="font-size: 18px; color: #FAFAF9; margin-bottom: 24px;">
        Hi <strong>${displayName}</strong>,
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
        <strong>${variables.appointmentDate}</strong>
      </p>
      
      <p style="font-size: 32px; color: #B8956A; margin-bottom: 24px; font-weight: 600;">
        ${variables.appointmentTime}
      </p>
      
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
        <tr>
          <td width="33%" style="text-align: center; padding: 0 8px;">
            <strong style="color: #B8956A; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Duration</strong><br>
            <span style="color: rgba(250, 250, 249, 0.9); font-size: 16px;">${variables.duration}</span>
          </td>
          <td width="34%" style="text-align: center; padding: 0 8px; border-left: 1px solid rgba(184, 149, 106, 0.3); border-right: 1px solid rgba(184, 149, 106, 0.3);">
            <strong style="color: #B8956A; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Artist</strong><br>
            <span style="color: rgba(250, 250, 249, 0.9); font-size: 16px;">${variables.artistName}</span>
          </td>
          <td width="33%" style="text-align: center; padding: 0 8px;">
            <strong style="color: #B8956A; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Type</strong><br>
            <span style="color: rgba(250, 250, 249, 0.9); font-size: 16px;">${variables.appointmentType}</span>
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

    <div style="text-align: center; margin: 32px 0;">
      ${EmailStyleService.createButton('Add to Calendar', '#', 'secondary')}
    </div>
  `;

  const { html, text } = EmailStyleService.createEmailTemplate(subject, content, {
    preheader: `Your tattoo appointment is confirmed for ${variables.appointmentDate}`,
    showHeader: true,
    showFooter: true
  });

  return { subject, html, text };
}

/**
 * Generate 24-hour appointment reminder email
 */
export function generate24HourReminder(variables: {
  customerName: string;
  firstName?: string;
  contactEmail?: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: string;
  artistName: string;
  appointmentType: string;
}): { subject: string; html: string; text: string } {
  const subject = `Reminder: Your appointment is tomorrow - ${variables.appointmentTime}`;
  
  // Use firstName if available, otherwise use generateDisplayName for better personalization
  const displayName = variables.firstName || generateDisplayName(
    variables.customerName,
    variables.contactEmail
  );
  
  const content = `
    ${EmailStyleService.createCard('', `
      <p style="font-size: 18px; color: #FAFAF9; margin-bottom: 24px;">
        Hi <strong>${displayName}</strong>,
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
            <strong style="color: #B8956A;">Time:</strong> ${variables.appointmentTime}<br>
            <strong style="color: #B8956A;">Duration:</strong> ${variables.duration}<br>
            <strong style="color: #B8956A;">Artist:</strong> ${variables.artistName}<br>
            <strong style="color: #B8956A;">Service:</strong> ${variables.appointmentType}
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
      ${EmailStyleService.createButton('Get Directions', 'https://maps.google.com', 'primary')}
    </div>
  `;

  const { html, text } = EmailStyleService.createEmailTemplate(subject, content, {
    preheader: 'Your tattoo appointment is tomorrow - here\'s everything you need to know',
    showHeader: true,
    showFooter: true
  });

  return { subject, html, text };
}

/**
 * Generate aftercare instructions email
 */
export function generateAftercareInstructions(variables: {
  customerName: string;
  firstName?: string;
  contactEmail?: string;
}): { subject: string; html: string; text: string } {
  const subject = 'Important: Tattoo Aftercare Instructions';
  
  // Use firstName if available, otherwise use generateDisplayName for better personalization
  const displayName = variables.firstName || generateDisplayName(
    variables.customerName,
    variables.contactEmail
  );
  
  const content = `
    ${EmailStyleService.createCard('', `
      <p style="font-size: 18px; color: #FAFAF9; margin-bottom: 24px;">
        Hi <strong>${displayName}</strong>,
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
      ${EmailStyleService.createButton('Contact Us', 'tel:6041234567', 'primary')}
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

  const { html, text } = EmailStyleService.createEmailTemplate(subject, content, {
    preheader: 'Essential aftercare instructions for your new tattoo',
    showHeader: true,
    showFooter: true
  });

  return { subject, html, text };
}

/**
 * Generate review request email
 */
export function generateReviewRequest(variables: {
  customerName: string;
  firstName?: string;
  contactEmail?: string;
  appointmentType: string;
  artistName: string;
}): { subject: string; html: string; text: string } {
  const subject = 'How was your experience with us?';
  
  // Use firstName if available, otherwise use generateDisplayName for better personalization
  const displayName = variables.firstName || generateDisplayName(
    variables.customerName,
    variables.contactEmail
  );
  
  const content = `
    ${EmailStyleService.createCard('', `
      <p style="font-size: 18px; color: #FAFAF9; margin-bottom: 24px;">
        Hi <strong>${displayName}</strong>,
      </p>
      <p>We hope you're loving your new tattoo! It's been a week since your ${variables.appointmentType} with ${variables.artistName}, and we'd love to hear about your experience.</p>
    `, '💭')}

    ${EmailStyleService.createDivider('ornamental')}

    <div style="text-align: center; margin: 32px 0;">
      <h2 style="font-family: 'Cinzel', serif; color: #B8956A; margin-bottom: 16px;">
        Share Your Experience
      </h2>
      <p style="color: rgba(250, 250, 249, 0.7); margin-bottom: 32px;">
        Your feedback helps us improve and lets others know what to expect
      </p>
      
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
        <tr>
          <td style="padding: 8px;">
            ${EmailStyleService.createButton('Review on Google', '#', 'primary')}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px;">
            ${EmailStyleService.createButton('Review on Facebook', '#', 'secondary')}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px;">
            ${EmailStyleService.createButton('Share on Instagram', '#', 'secondary')}
          </td>
        </tr>
      </table>
    </div>

    ${EmailStyleService.createDivider('simple')}

    ${EmailStyleService.createCard('', `
      <div style="text-align: center;">
        <p style="font-size: 48px; margin-bottom: 16px;">📸</p>
        <h3 style="font-family: 'Cinzel', serif; color: #B8956A; margin-bottom: 16px;">
          Show Off Your New Ink!
        </h3>
        <p style="color: rgba(250, 250, 249, 0.7);">
          Tag us <strong style="color: #B8956A;">@bowenislandtattoo</strong> in your photos.<br>
          We love seeing our work in the wild and might feature you!
        </p>
      </div>
    `)}

    <div style="background: linear-gradient(135deg, rgba(184, 149, 106, 0.1), rgba(184, 149, 106, 0.05)); border-radius: 12px; padding: 24px; margin-top: 32px; text-align: center;">
      <p style="color: #B8956A; font-weight: 600; margin-bottom: 8px;">
        Thank you for choosing Bowen Island Tattoo Shop
      </p>
      <p style="color: rgba(250, 250, 249, 0.7); font-style: italic;">
        We appreciate your trust in us and hope to see you again!
      </p>
    </div>
  `;

  const { html, text } = EmailStyleService.createEmailTemplate(subject, content, {
    preheader: 'We\'d love to hear about your tattoo experience',
    showHeader: true,
    showFooter: true
  });

  return { subject, html, text };
}

/**
 * Generate owner notification for new tattoo request
 */
export function generateOwnerNewRequest(variables: {
  customerName: string;
  firstName?: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  placement: string;
  size: string;
  style: string;
  preferredArtist: string;
  timeframe: string;
  additionalNotes: string;
  referenceImages?: number;
  dashboardUrl: string;
}): { subject: string; html: string; text: string } {
  // Use firstName if available, otherwise use generateDisplayName for better display
  const displayName = variables.firstName || generateDisplayName(
    variables.customerName,
    variables.customerEmail
  );
  
  const subject = `🎨 New Tattoo Request from ${displayName}`;
  
  const content = `
    <div style="background: linear-gradient(135deg, rgba(184, 149, 106, 0.2), rgba(184, 149, 106, 0.1)); border: 2px solid #B8956A; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h2 style="font-family: 'Cinzel', serif; color: #B8956A; margin-bottom: 8px; text-align: center;">
        New Tattoo Request Received
      </h2>
      <p style="text-align: center; color: rgba(250, 250, 249, 0.7); margin: 0;">
        ${new Date().toLocaleString()}
      </p>
    </div>

    ${EmailStyleService.createCard('Customer Information', `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #B8956A;">Name:</strong> ${displayName}${variables.firstName && variables.customerName !== variables.firstName ? ` (${variables.customerName})` : ''}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #B8956A;">Email:</strong> <a href="mailto:${variables.customerEmail}" style="color: #D4B896;">${variables.customerEmail}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #B8956A;">Phone:</strong> <a href="tel:${variables.customerPhone}" style="color: #D4B896;">${variables.customerPhone}</a>
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
              ${variables.description}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td width="50%" style="padding-right: 12px;">
                  <strong style="color: #B8956A;">Placement:</strong> ${variables.placement}<br>
                  <strong style="color: #B8956A;">Size:</strong> ${variables.size}<br>
                  <strong style="color: #B8956A;">Style:</strong> ${variables.style}
                </td>
                <td width="50%">
                  <strong style="color: #B8956A;">Preferred Artist:</strong> ${variables.preferredArtist}<br>
                  <strong style="color: #B8956A;">Timeframe:</strong> ${variables.timeframe}<br>
                  ${variables.referenceImages ? `<strong style="color: #B8956A;">Images:</strong> ${variables.referenceImages} uploaded` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ${variables.additionalNotes ? `
        <tr>
          <td style="padding: 16px 0 8px 0;">
            <strong style="color: #B8956A;">Additional Notes:</strong><br>
            <p style="margin: 8px 0; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px;">
              ${variables.additionalNotes}
            </p>
          </td>
        </tr>
        ` : ''}
      </table>
    `, '🎨')}

    <div style="text-align: center; margin: 32px 0;">
      ${EmailStyleService.createButton('View in Dashboard', variables.dashboardUrl, 'primary')}
    </div>

    ${EmailStyleService.createHighlight(`
      <strong>Quick Actions:</strong> Review the request, assign to an artist, and respond to the customer through the dashboard.
    `, '⚡')}
  `;

  const { html, text } = EmailStyleService.createEmailTemplate(subject, content, {
    preheader: `New tattoo request from ${variables.customerName}`,
    showHeader: false, // Simpler header for internal emails
    showFooter: false
  });

  return { subject, html, text };
}
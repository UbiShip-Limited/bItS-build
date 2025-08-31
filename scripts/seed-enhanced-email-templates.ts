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
      subject: 'Hey {{customerName}}! We got your tattoo request 🎨',
      body: `Hey {{customerName}}! 

Thanks for choosing Bowen Island Tattoo - we're stoked about your {{style}} piece!

Love what you're going for with "{{description}}". {{placement}} is a great spot for this, especially at {{size}} size. 
{{#if preferredArtist}}
{{preferredArtist}} is going to be pumped to work on this with you!
{{else}}
Our artists are already excited about bringing this to life!
{{/if}}

Here's what we've got from you:
✓ {{style}} style - excellent choice
✓ {{placement}} placement 
✓ {{size}} size
{{#if additionalNotes}}
✓ Your notes: "{{additionalNotes}}" - super helpful!
{{/if}}
{{#if referenceImages}}
✓ {{referenceImages}} reference image(s) - perfect for visualization!
{{/if}}

What's next? We'll review everything and get back to you within 24-48 hours with ideas and pricing. {{#if timeframe}}We see you're looking to get this done {{timeframe}} - we'll keep that in mind!{{/if}}

{{#if trackingToken}}
Track your request anytime: {{trackingUrl}}
{{/if}}

Questions? Just hit reply or give us a shout at (604) 123-4567.

Talk soon!
The Bowen Island crew`,
      htmlBody: emailTemplateGenerator.getTattooRequestTemplate(),
      variables: {
        customerName: 'Customer name',
        description: 'Tattoo description',
        placement: 'Body placement',
        size: 'Tattoo size',
        style: 'Tattoo style',
        preferredArtist: 'Preferred artist name',
        trackingToken: 'Tracking token for anonymous requests',
        trackingUrl: 'URL to track request status',
        timeframe: 'Desired timeframe for the tattoo',
        additionalNotes: 'Additional notes from customer',
        referenceImages: 'Number of reference images uploaded'
      },
      isActive: true
    },
    {
      name: 'appointment_confirmation',
      displayName: 'Appointment Confirmation',
      subject: '✅ You\'re all set with {{artistName}} on {{appointmentDate}}!',
      body: `Hey {{customerName}}! 

You're all set with {{artistName}} on {{appointmentDate}} at {{appointmentTime}}! 

We've blocked off {{duration}} just for you - can't wait to get started on your {{appointmentType}}.

Quick reminder about where we are:
📍 565 Artisan Lane, Artisan Square
   Bowen Island, BC V0N1G2

A few tips for your session:
• Grab a good meal beforehand (trust us on this one!)
• Wear something comfy{{#if placement}} that gives easy access to your {{placement}}{{/if}}
• Bring your ID 
• Show up about 10 mins early so we can get paperwork done

{{#if depositAmount}}
Your deposit of \${{depositAmount}} has been applied to this appointment.
{{/if}}

Need to change plans? No worries - just give us 24 hours notice by calling (604) 123-4567.

See you {{appointmentDate}}!
{{artistName}} & the team`,
      htmlBody: emailTemplateGenerator.getAppointmentConfirmationTemplate(),
      variables: {
        customerName: 'Customer name',
        appointmentDate: 'Appointment date',
        appointmentTime: 'Appointment time',
        duration: 'Appointment duration',
        artistName: 'Artist name',
        appointmentType: 'Type of appointment',
        placement: 'Tattoo placement (optional)',
        depositAmount: 'Deposit amount paid (optional)'
      },
      isActive: true
    },
    {
      name: 'appointment_reminder_24h',
      displayName: '24 Hour Appointment Reminder',
      subject: 'Hey {{customerName}}! See you tomorrow at {{appointmentTime}} 🎨',
      body: `Hey {{customerName}}! 

Just a heads up - you're seeing {{artistName}} tomorrow at {{appointmentTime}}! 

Getting excited? We are! Your {{appointmentType}} is going to be awesome.{{#if placement}} Can't wait to work on that {{placement}} piece!{{/if}}

Quick reminders for tomorrow:
• Eat something substantial before you come (seriously, it helps!)
• Stay hydrated today and tomorrow
• Wear comfy clothes{{#if placement}} that work with your {{placement}} area{{/if}}
• Bring your ID
• Come 10 mins early for paperwork

{{#if depositAmount}}
✓ Your deposit of \${{depositAmount}} is all set
{{/if}}

Need to reschedule last minute? Call us ASAP at (604) 123-4567 - we get it, life happens!

Can't wait to see you tomorrow!
{{artistName}} & the crew`,
      htmlBody: emailTemplateGenerator.get24HourReminderTemplate(),
      variables: {
        customerName: 'Customer name',
        appointmentDate: 'Appointment date (formatted)',
        appointmentTime: 'Appointment time',
        duration: 'Appointment duration',
        artistName: 'Artist name',
        appointmentType: 'Type of appointment',
        placement: 'Tattoo placement (optional)',
        depositAmount: 'Deposit amount paid (optional)'
      },
      isActive: true
    },
    {
      name: 'appointment_reminder_2h',
      displayName: '2 Hour Appointment Reminder',
      subject: 'Almost time, {{customerName}}! See you at {{appointmentTime}} ⏰',
      body: `Hey {{customerName}}!

Quick reminder - {{artistName}} is ready for you in just 2 hours!

⏰ {{appointmentTime}} - we're all set up and ready
{{#if appointmentType}}
🎨 Your {{appointmentType}} session
{{/if}}

Last minute checklist:
✓ Had something to eat? (super important!)
✓ Got your ID?
✓ Feeling good? 

If something's come up, give us a quick call: (604) 123-4567

Otherwise, see you soon! 
The Bowen Island team`,
      htmlBody: emailTemplateGenerator.get24HourReminderTemplate(), // Reuse similar template
      variables: {
        customerName: 'Customer name',
        appointmentTime: 'Appointment time',
        artistName: 'Artist name',
        appointmentType: 'Type of appointment (optional)'
      },
      isActive: true
    },
    {
      name: 'aftercare_instructions',
      displayName: 'Aftercare Instructions',
      subject: '{{customerName}}, your new ink looks AMAZING! Here\'s how to keep it that way 💫',
      body: `{{customerName}}, your new ink looks AMAZING! 

{{#if artistName}}{{artistName}} did such a great job - we hope you love it as much as we do!{{else}}We hope you're loving your new piece as much as we are!{{/if}}

Let's keep it looking fresh:

**Tonight:**
• Keep that bandage on for 2-4 more hours
• Then gently wash with unscented soap (be nice to it!)
• Pat dry - don't rub! 
• Thin layer of aftercare ointment

**Next 2 weeks - this is where the magic happens:**
• Wash it 2-3 times daily (morning, night, and maybe midday)
• Keep it moisturized but not drowning in lotion
• No swimming or hot tubs (I know, tough on Bowen Island!)
• Don't pick at it - let it do its thing naturally
• Avoid direct sun - your tattoo is basically a vampire right now

{{#if artistName}}
**Pro tips from {{artistName}}:**
{{else}}
**Pro tips from the team:**
{{/if}}
• Loose clothes are your friend right now
• Drink lots of water (helps healing!)
• Skip the gym for 48 hours (perfect excuse, right?)
• If it's itchy, that's normal - just pat it gently

Something doesn't look right? Questions? Just reply to this email or call us at (604) 123-4567. We're here to help!

Enjoy your new art!
The Bowen Island team`,
      htmlBody: emailTemplateGenerator.getAftercareTemplate(),
      variables: {
        customerName: 'Customer name',
        artistName: 'Artist who did the tattoo (optional)'
      },
      isActive: true
    },
    {
      name: 'owner_new_request',
      displayName: 'Owner: New Tattoo Request',
      subject: '🎨 Hey! New request from {{customerName}} - {{style}} piece',
      body: `Hey team!

Just got a new request from {{customerName}}! Looks like a cool {{style}} piece.

**The customer:**
• {{customerName}}
• {{customerEmail}}
• {{customerPhone}}

**What they want:**
• {{description}}
• Placement: {{placement}} 
• Size: {{size}}
• Style: {{style}}
{{#if preferredArtist}}
• They want to work with: {{preferredArtist}}
{{/if}}
{{#if timeframe}}
• Timeline: {{timeframe}}
{{/if}}

{{#if additionalNotes}}
**Their notes:** "{{additionalNotes}}"
{{/if}}

{{#if referenceImages}}
📸 They uploaded {{referenceImages}} reference image(s)
{{/if}}

👉 Check it out in the dashboard: {{dashboardUrl}}

Let's make this happen!`,
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
      subject: 'Hey {{customerName}}! Ready to lock in your {{paymentType}}? 💳',
      body: `Hey {{customerName}}!

Ready to lock in your {{paymentType}}? {{#if artistName}}{{artistName}} is excited to get started!{{/if}} Here's your secure payment link:

{{paymentLink}}

Quick details:
• Amount: \${{amount}}
• For: {{title}}
{{#if description}}• Details: {{description}}{{/if}}
{{#if appointmentDate}}• Your appointment: {{appointmentDate}} at {{appointmentTime}}{{/if}}

You can pay with:
✓ Credit/Debit Card
✓ Apple Pay or Google Pay
{{#if allowTipping}}✓ Option to add a tip if you're feeling generous 😊{{/if}}

Everything's secure through Square - we never see or store your card info!

{{#if expiresAt}}
⏰ Heads up: This link expires {{expiresAt}}, so don't wait too long!
{{/if}}

Questions about the payment? Just reply here or call (604) 123-4567.

Thanks!
The Bowen Island team`,
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
        expiresAt: 'Link expiration date (optional)',
        artistName: 'Artist name (optional)'
      },
      isActive: true
    },
    {
      name: 'owner_payment_received',
      displayName: 'Owner: Payment Received',
      subject: '💰 Cha-ching! {{customerName}} just paid \${{amount}}',
      body: `Nice! Payment just came through:

• From: {{customerName}}
• Amount: \${{amount}}
• Type: {{paymentType}}
• Transaction: {{transactionId}}
{{#if appointmentId}}
• For appointment: {{appointmentId}}
{{/if}}
{{#if tipAmount}}
• They tipped: \${{tipAmount}} 🎉
{{/if}}

💳 Check the details: {{dashboardUrl}}

Keep up the great work!`,
      htmlBody: emailTemplateGenerator.getOwnerNotificationTemplate(),
      variables: {
        customerName: 'Customer name',
        amount: 'Payment amount',
        paymentType: 'Type of payment',
        tipAmount: 'Tip amount (optional)',
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
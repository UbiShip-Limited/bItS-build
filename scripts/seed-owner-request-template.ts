#!/usr/bin/env tsx

/**
 * Seeds the missing owner_new_request email template
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { prisma } from '../lib/prisma/prisma';

async function seedOwnerRequestTemplate() {
  console.log('🌱 Creating owner_new_request template...\n');

  try {
    // Check if template already exists
    const existing = await prisma.emailTemplate.findFirst({
      where: { name: 'owner_new_request' }
    });

    if (existing) {
      console.log('✅ Template already exists');
      return;
    }

    // Create the template
    const template = await prisma.emailTemplate.create({
      data: {
        name: 'owner_new_request',
        displayName: 'Owner: New Tattoo Request Notification',
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
- Reference Images: {{referenceImages}}

View in Dashboard: {{dashboardUrl}}

This notification was sent to the shop owner.`,
        htmlBody: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #080808; color: #ffffff; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #C9A449; color: #080808; padding: 20px; text-align: center; }
    .content { background-color: #111111; padding: 20px; }
    .detail-row { padding: 10px 0; border-bottom: 1px solid #333; }
    .label { font-weight: bold; color: #C9A449; }
    .button { background-color: #C9A449; color: #080808; padding: 10px 20px; text-decoration: none; display: inline-block; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎨 New Tattoo Request</h1>
    </div>
    <div class="content">
      <h2>Customer Information</h2>
      <div class="detail-row">
        <span class="label">Name:</span> {{customerName}}
      </div>
      <div class="detail-row">
        <span class="label">Email:</span> {{customerEmail}}
      </div>
      <div class="detail-row">
        <span class="label">Phone:</span> {{customerPhone}}
      </div>
      
      <h2>Request Details</h2>
      <div class="detail-row">
        <span class="label">Description:</span> {{description}}
      </div>
      <div class="detail-row">
        <span class="label">Placement:</span> {{placement}}
      </div>
      <div class="detail-row">
        <span class="label">Size:</span> {{size}}
      </div>
      <div class="detail-row">
        <span class="label">Style:</span> {{style}}
      </div>
      <div class="detail-row">
        <span class="label">Preferred Artist:</span> {{preferredArtist}}
      </div>
      <div class="detail-row">
        <span class="label">Timeframe:</span> {{timeframe}}
      </div>
      <div class="detail-row">
        <span class="label">Additional Notes:</span> {{additionalNotes}}
      </div>
      <div class="detail-row">
        <span class="label">Reference Images:</span> {{referenceImages}} attached
      </div>
      
      <a href="{{dashboardUrl}}" class="button">View in Dashboard</a>
    </div>
    <div class="footer">
      <p>This is an automated notification for shop owners.</p>
    </div>
  </div>
</body>
</html>`,
        variables: {
          customerName: 'string',
          customerEmail: 'string',
          customerPhone: 'string',
          description: 'string',
          placement: 'string',
          size: 'string',
          style: 'string',
          preferredArtist: 'string',
          timeframe: 'string',
          additionalNotes: 'string',
          referenceImages: 'number',
          dashboardUrl: 'string'
        },
        isActive: true
      }
    });

    console.log('✅ Template created successfully:', template.displayName);
  } catch (error) {
    console.error('❌ Error creating template:', error);
    process.exit(1);
  }
}

// Run the seeder
seedOwnerRequestTemplate()
  .then(() => {
    console.log('\n✅ Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
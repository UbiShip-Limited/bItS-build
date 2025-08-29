#!/usr/bin/env tsx
/**
 * Script to seed owner notification email templates
 * Run with: npx tsx scripts/seed-owner-templates.ts
 */

import { prisma } from '../lib/prisma/prisma';

async function seedOwnerTemplates() {
  console.log('🌱 Seeding owner notification templates...\n');
  
  const ownerTemplates = [
    {
      name: 'owner_new_appointment',
      displayName: 'Owner: New Appointment Notification',
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

Notes: {{notes}}

Log into the dashboard to manage this appointment.`,
      variables: {
        customerName: 'Customer name',
        customerEmail: 'Customer email',
        customerPhone: 'Customer phone',
        appointmentDate: 'Appointment date',
        appointmentTime: 'Appointment time',
        duration: 'Duration in minutes',
        appointmentType: 'Type of appointment',
        artistName: 'Artist name',
        priceQuote: 'Price quote',
        notes: 'Appointment notes'
      }
    },
    {
      name: 'owner_new_tattoo_request',
      displayName: 'Owner: New Tattoo Request',
      subject: '🎨 New Tattoo Request from {{customerName}}',
      body: `New tattoo request received!

Customer: {{customerName}}
Email: {{customerEmail}}
Phone: {{customerPhone}}

Request Details:
- Description: {{description}}
- Placement: {{placement}}
- Size: {{size}}
- Style: {{style}}
- Budget: {{budget}}
- Availability: {{availability}}

Review in dashboard: {{dashboardUrl}}`,
      variables: {
        customerName: 'Customer name',
        customerEmail: 'Customer email',
        customerPhone: 'Customer phone',
        description: 'Tattoo description',
        placement: 'Body placement',
        size: 'Tattoo size',
        style: 'Tattoo style',
        budget: 'Customer budget',
        availability: 'Customer availability',
        dashboardUrl: 'Dashboard URL'
      }
    },
    {
      name: 'owner_appointment_cancelled',
      displayName: 'Owner: Appointment Cancelled',
      subject: '❌ Appointment Cancelled - {{customerName}}',
      body: `An appointment has been cancelled.

Customer: {{customerName}}
Original Date: {{appointmentDate}}
Original Time: {{appointmentTime}}
Cancellation Reason: {{reason}}

The time slot is now available for rebooking.`,
      variables: {
        customerName: 'Customer name',
        appointmentDate: 'Original appointment date',
        appointmentTime: 'Original appointment time',
        reason: 'Cancellation reason'
      }
    },
    {
      name: 'owner_payment_received',
      displayName: 'Owner: Payment Received',
      subject: '💰 Payment Received - {{amount}}',
      body: `Payment received!

Customer: {{customerName}}
Amount: {{amount}}
Payment Method: {{paymentMethod}}
Reference: {{reference}}

Associated with: {{associatedWith}}
Date: {{paymentDate}}

View details in Square Dashboard.`,
      variables: {
        customerName: 'Customer name',
        amount: 'Payment amount',
        paymentMethod: 'Payment method',
        reference: 'Payment reference',
        associatedWith: 'Associated appointment/request',
        paymentDate: 'Payment date'
      }
    }
  ];
  
  for (const template of ownerTemplates) {
    try {
      // Check if template already exists
      const existing = await prisma.emailTemplate.findUnique({
        where: { name: template.name }
      });
      
      if (existing) {
        console.log(`✓ Template '${template.displayName}' already exists`);
        continue;
      }
      
      // Create template
      await prisma.emailTemplate.create({
        data: {
          ...template,
          isActive: true
        }
      });
      
      console.log(`✅ Created template: ${template.displayName}`);
    } catch (error) {
      console.error(`❌ Failed to create template '${template.displayName}':`, error.message);
    }
  }
  
  console.log('\n✨ Owner templates seeding completed!');
  
  // Show all templates
  console.log('\n📧 All Email Templates:');
  const allTemplates = await prisma.emailTemplate.findMany({
    select: {
      name: true,
      displayName: true,
      isActive: true
    },
    orderBy: { name: 'asc' }
  });
  
  allTemplates.forEach(t => {
    const status = t.isActive ? '✅' : '❌';
    const isOwner = t.name.startsWith('owner_') ? '👤' : '📧';
    console.log(`  ${isOwner} ${status} ${t.name} - ${t.displayName}`);
  });
}

// Run the seed script
seedOwnerTemplates()
  .catch((error) => {
    console.error('Failed to seed owner templates:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
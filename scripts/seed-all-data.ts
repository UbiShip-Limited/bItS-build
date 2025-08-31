import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Seed Users
    console.log('Creating users...');
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@bowenislandtattoo.com' },
      update: {},
      create: {
        email: 'admin@bowenislandtattoo.com',
        password: 'admin123', // Note: In production, this should be hashed
        role: 'owner'
      }
    });

    const artistUser = await prisma.user.upsert({
      where: { email: 'artist@bowenislandtattoo.com' },
      update: {},
      create: {
        email: 'artist@bowenislandtattoo.com',
        password: 'artist123', // Note: In production, this should be hashed
        role: 'artist'
      }
    });
    console.log('✅ Users created\n');

    // 2. Seed Business Hours
    console.log('Setting up business hours...');
    const businessHours = [
      { dayOfWeek: 0, openTime: 'Closed', closeTime: 'Closed', isOpen: false }, // Sunday
      { dayOfWeek: 1, openTime: '10:00', closeTime: '18:00', isOpen: true },   // Monday
      { dayOfWeek: 2, openTime: '10:00', closeTime: '18:00', isOpen: true },   // Tuesday
      { dayOfWeek: 3, openTime: '10:00', closeTime: '18:00', isOpen: true },   // Wednesday
      { dayOfWeek: 4, openTime: '10:00', closeTime: '20:00', isOpen: true },   // Thursday
      { dayOfWeek: 5, openTime: '10:00', closeTime: '20:00', isOpen: true },   // Friday
      { dayOfWeek: 6, openTime: '11:00', closeTime: '17:00', isOpen: true },   // Saturday
    ];

    for (const hours of businessHours) {
      await prisma.businessHours.upsert({
        where: { dayOfWeek: hours.dayOfWeek },
        update: hours,
        create: hours
      });
    }
    console.log('✅ Business hours configured\n');

    // 3. Seed Email Templates
    console.log('Creating email templates...');
    const emailTemplates = [
      {
        name: 'appointment_confirmation',
        displayName: 'Appointment Confirmation',
        subject: 'Your Tattoo Appointment is Confirmed',
        body: `Hi {{customerName}},

Your tattoo appointment has been confirmed!

📅 Date: {{appointmentDate}}
⏰ Time: {{appointmentTime}}
🎨 Artist: {{artistName}}
💰 Quote: ${{priceQuote}}

Location: Bowen Island Tattoo Shop
Address: 123 Main Street, Bowen Island, BC

Please arrive 10 minutes early to complete any necessary paperwork.

If you need to reschedule or cancel, please let us know at least 48 hours in advance.

See you soon!
Bowen Island Tattoo Shop`,
        htmlBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #D4AF37;">Your Tattoo Appointment is Confirmed!</h2>
          <p>Hi {{customerName}},</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>📅 Date:</strong> {{appointmentDate}}</p>
            <p><strong>⏰ Time:</strong> {{appointmentTime}}</p>
            <p><strong>🎨 Artist:</strong> {{artistName}}</p>
            <p><strong>💰 Quote:</strong> ${{priceQuote}}</p>
          </div>
          <p><strong>Location:</strong> Bowen Island Tattoo Shop<br>
          <strong>Address:</strong> 123 Main Street, Bowen Island, BC</p>
          <p style="color: #666;">Please arrive 10 minutes early to complete any necessary paperwork.</p>
          <p style="color: #D4AF37;">If you need to reschedule or cancel, please let us know at least 48 hours in advance.</p>
          <p>See you soon!<br>
          <strong>Bowen Island Tattoo Shop</strong></p>
        </div>`,
        variables: ['customerName', 'appointmentDate', 'appointmentTime', 'artistName', 'priceQuote'],
        isActive: true
      },
      {
        name: 'appointment_reminder',
        displayName: 'Appointment Reminder',
        subject: 'Reminder: Your Tattoo Appointment Tomorrow',
        body: `Hi {{customerName}},

This is a friendly reminder about your tattoo appointment tomorrow!

📅 Date: {{appointmentDate}}
⏰ Time: {{appointmentTime}}
🎨 Artist: {{artistName}}

Please remember to:
- Get a good night's sleep
- Eat a meal before your appointment
- Stay hydrated
- Wear comfortable clothing
- Bring valid ID

If you need to reschedule, please contact us immediately.

See you tomorrow!
Bowen Island Tattoo Shop`,
        htmlBody: null,
        variables: ['customerName', 'appointmentDate', 'appointmentTime', 'artistName'],
        isActive: true
      },
      {
        name: 'tattoo_request_confirmation',
        displayName: 'Tattoo Request Received',
        subject: 'We Received Your Tattoo Request!',
        body: `Hi {{customerName}},

Thank you for submitting your tattoo request!

We've received your request for:
Style: {{style}}
Placement: {{placement}}
Size: {{size}}

Our team will review your request and get back to you within 48 hours with:
- Artist recommendations
- Price quote
- Available appointment times

Your request ID is: {{requestId}}

If you have any questions, feel free to reply to this email.

Best regards,
Bowen Island Tattoo Shop`,
        htmlBody: null,
        variables: ['customerName', 'style', 'placement', 'size', 'requestId'],
        isActive: true
      },
      {
        name: 'tattoo_request_approved',
        displayName: 'Tattoo Request Approved',
        subject: 'Your Tattoo Request Has Been Approved!',
        body: `Hi {{customerName}},

Great news! Your tattoo request has been approved.

Artist: {{artistName}}
Estimated Price: ${{priceQuote}}
Estimated Duration: {{duration}}

Next steps:
1. Book your appointment online
2. Pay your deposit to secure your slot
3. Prepare for your tattoo session

Ready to book? Click here: {{bookingLink}}

Questions? Reply to this email or call us.

Best regards,
Bowen Island Tattoo Shop`,
        htmlBody: null,
        variables: ['customerName', 'artistName', 'priceQuote', 'duration', 'bookingLink'],
        isActive: true
      },
      {
        name: 'payment_receipt',
        displayName: 'Payment Receipt',
        subject: 'Payment Receipt - Bowen Island Tattoo Shop',
        body: `Hi {{customerName}},

Thank you for your payment!

Payment Details:
Amount: ${{amount}}
Date: {{paymentDate}}
Payment Method: {{paymentMethod}}
Reference: {{referenceNumber}}

This payment is for: {{description}}

Thank you for choosing Bowen Island Tattoo Shop!`,
        htmlBody: null,
        variables: ['customerName', 'amount', 'paymentDate', 'paymentMethod', 'referenceNumber', 'description'],
        isActive: true
      },
      {
        name: 'aftercare_instructions',
        displayName: 'Tattoo Aftercare Instructions',
        subject: 'Important: Your Tattoo Aftercare Instructions',
        body: `Hi {{customerName}},

Your new tattoo looks amazing! Here are your aftercare instructions:

First 24 Hours:
- Keep the bandage on for 2-4 hours
- Gently wash with unscented soap
- Pat dry with clean paper towel
- Apply thin layer of aftercare ointment

Days 2-14:
- Wash 2-3 times daily
- Apply moisturizer regularly
- Don't pick or scratch
- Avoid direct sunlight
- No swimming or soaking

Signs to watch for:
- Excessive redness or swelling
- Discharge or bad odor
- Fever

If you have any concerns, contact us immediately.

Enjoy your new tattoo!
Bowen Island Tattoo Shop`,
        htmlBody: null,
        variables: ['customerName'],
        isActive: true
      }
    ];

    for (const template of emailTemplates) {
      await prisma.emailTemplate.upsert({
        where: { name: template.name },
        update: template,
        create: template
      });
    }
    console.log('✅ Email templates created\n');

    // 4. Seed Email Automation Settings
    console.log('Configuring email automation settings...');
    const automationSettings = [
      {
        emailType: 'appointment_confirmation',
        enabled: true,
        timingHours: 0,
        timingMinutes: 0,
        businessHoursOnly: false
      },
      {
        emailType: 'appointment_reminder_24h',
        enabled: true,
        timingHours: -24,
        timingMinutes: 0,
        businessHoursOnly: true
      },
      {
        emailType: 'appointment_reminder_1h',
        enabled: true,
        timingHours: -1,
        timingMinutes: 0,
        businessHoursOnly: false
      },
      {
        emailType: 'aftercare_instructions',
        enabled: true,
        timingHours: 1,
        timingMinutes: 0,
        businessHoursOnly: false
      },
      {
        emailType: 'follow_up_check',
        enabled: true,
        timingHours: 72,
        timingMinutes: 0,
        businessHoursOnly: true
      },
      {
        emailType: 'tattoo_request_confirmation',
        enabled: true,
        timingHours: 0,
        timingMinutes: 0,
        businessHoursOnly: false
      }
    ];

    for (const setting of automationSettings) {
      await prisma.emailAutomationSetting.upsert({
        where: { emailType: setting.emailType },
        update: setting,
        create: setting
      });
    }
    console.log('✅ Email automation configured\n');

    // 5. Seed Sample Customers
    console.log('Creating sample customers...');
    const customers = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '604-555-0101',
        notes: 'Prefers black and grey tattoos'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '604-555-0102',
        notes: 'Allergic to red ink'
      },
      {
        name: 'Mike Johnson',
        email: 'mike.j@example.com',
        phone: '604-555-0103',
        notes: 'Regular customer, has sleeve in progress'
      }
    ];

    const createdCustomers = [];
    for (const customer of customers) {
      const created = await prisma.customer.upsert({
        where: { email: customer.email! },
        update: {},
        create: customer
      });
      createdCustomers.push(created);
    }
    console.log('✅ Sample customers created\n');

    // 6. Seed Sample Tattoo Requests
    console.log('Creating sample tattoo requests...');
    const tattooRequests = [
      {
        customerId: createdCustomers[0].id,
        description: 'Dragon sleeve design',
        placement: 'Right arm',
        size: 'Large (full sleeve)',
        colorPreference: 'Black and grey',
        style: 'Japanese traditional',
        status: 'new',
        contactEmail: 'john.doe@example.com',
        contactPhone: '604-555-0101',
        timeframe: 'Within 3 months',
        preferredArtist: 'Any artist',
        additionalNotes: 'Want it to wrap around the entire arm'
      },
      {
        customerId: createdCustomers[1].id,
        description: 'Small butterfly',
        placement: 'Ankle',
        size: 'Small (2-3 inches)',
        colorPreference: 'Colorful',
        style: 'Watercolor',
        status: 'new',
        contactEmail: 'jane.smith@example.com',
        contactPhone: '604-555-0102',
        timeframe: 'As soon as possible',
        preferredArtist: 'Any artist'
      }
    ];

    for (const request of tattooRequests) {
      await prisma.tattooRequest.create({
        data: request
      });
    }
    console.log('✅ Sample tattoo requests created\n');

    // 7. Seed Sample Appointments
    console.log('Creating sample appointments...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(10, 0, 0, 0);

    await prisma.appointment.create({
      data: {
        customerId: createdCustomers[0].id,
        artistId: artistUser.id,
        startTime: tomorrow,
        duration: 180, // 3 hours
        status: 'CONFIRMED',
        type: 'Tattoo Session',
        priceQuote: 450,
        notes: 'Dragon sleeve - session 1',
        contactEmail: 'john.doe@example.com',
        contactPhone: '604-555-0101'
      }
    });

    await prisma.appointment.create({
      data: {
        customerId: createdCustomers[1].id,
        artistId: artistUser.id,
        startTime: nextWeek,
        duration: 60, // 1 hour
        status: 'PENDING',
        type: 'Consultation',
        priceQuote: 150,
        notes: 'Butterfly tattoo consultation',
        contactEmail: 'jane.smith@example.com',
        contactPhone: '604-555-0102'
      }
    });
    console.log('✅ Sample appointments created\n');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Admin: admin@bowenislandtattoo.com / admin123');
    console.log('   Artist: artist@bowenislandtattoo.com / artist123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedDatabase()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
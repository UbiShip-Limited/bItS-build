import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeEmailAutomationSettings() {
  console.log('Initializing email automation settings...');

  const emailTypes = [
    {
      emailType: 'appointment_reminder_24h',
      enabled: true,
      timingHours: 24,
      timingMinutes: 0,
      businessHoursOnly: true
    },
    {
      emailType: 'appointment_reminder_2h',
      enabled: true,
      timingHours: 2,
      timingMinutes: 0,
      businessHoursOnly: true
    },
    {
      emailType: 'aftercare_instructions',
      enabled: true,
      timingHours: 2,
      timingMinutes: 0,
      businessHoursOnly: false
    },
    {
      emailType: 'review_request',
      enabled: true,
      timingHours: 168, // 7 days
      timingMinutes: 0,
      businessHoursOnly: true
    },
    {
      emailType: 're_engagement',
      enabled: false,
      timingHours: 2160, // 90 days
      timingMinutes: 0,
      businessHoursOnly: true
    },
    {
      emailType: 'abandoned_request_recovery',
      enabled: true,
      timingHours: 48,
      timingMinutes: 0,
      businessHoursOnly: true
    }
  ];

  for (const setting of emailTypes) {
    try {
      await prisma.emailAutomationSetting.upsert({
        where: { emailType: setting.emailType },
        update: {},
        create: setting
      });
      console.log(`✓ Created/Updated setting for ${setting.emailType}`);
    } catch (error) {
      console.error(`✗ Failed to create setting for ${setting.emailType}:`, error);
    }
  }

  console.log('Email automation settings initialization complete!');
}

initializeEmailAutomationSettings()
  .catch((error) => {
    console.error('Error initializing email automation settings:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
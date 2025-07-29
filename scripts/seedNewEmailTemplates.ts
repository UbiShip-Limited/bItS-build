import { prisma } from '../lib/prisma/prisma';
import { EmailTemplateService } from '../lib/services/emailTemplateService';

async function seedNewEmailTemplates() {
  console.log('🌱 Seeding new email automation templates...');
  
  const defaultTemplates = EmailTemplateService.getDefaultTemplates();
  
  // Filter only the new templates we want to add
  const newTemplates = defaultTemplates.filter(template => 
    [
      'appointment_reminder_24h',
      'appointment_reminder_2h',
      'review_request',
      're_engagement',
      'abandoned_request_recovery'
    ].includes(template.name)
  );
  
  for (const template of newTemplates) {
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
          name: template.name,
          displayName: template.displayName,
          subject: template.subject,
          body: template.body,
          htmlBody: template.htmlBody,
          variables: template.variables,
          isActive: true
        }
      });
      
      console.log(`✅ Created template: ${template.displayName}`);
    } catch (error) {
      console.error(`❌ Failed to create template '${template.displayName}':`, error);
    }
  }
  
  console.log('✨ New email templates seeding completed!');
}

// Run the seed script
seedNewEmailTemplates()
  .catch((error) => {
    console.error('Failed to seed new email templates:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
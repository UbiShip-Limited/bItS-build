import { prisma } from '../lib/prisma/prisma';
import { EmailTemplateService } from '../lib/services/emailTemplateService';

async function seedEmailTemplates() {
  console.log('🌱 Seeding email templates...');
  
  const defaultTemplates = EmailTemplateService.getDefaultTemplates();
  
  for (const template of defaultTemplates) {
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
  
  console.log('✨ Email templates seeding completed!');
}

// Run the seed script
seedEmailTemplates()
  .catch((error) => {
    console.error('Failed to seed email templates:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
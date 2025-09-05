#!/usr/bin/env tsx
/**
 * Seed email templates into the database
 * Run with: npx tsx scripts/seed-email-templates.ts
 */

import '../lib/config/envLoader';
import { prisma } from '../lib/prisma/prisma';
import { EmailTemplateService } from '../lib/services/emailTemplateService';

async function seedEmailTemplates() {
  console.log('📧 Seeding Email Templates\n');
  console.log('=' .repeat(50));
  
  try {
    const templates = EmailTemplateService.getDefaultTemplates();
    
    console.log(`📝 Found ${templates.length} default templates to seed`);
    
    for (const template of templates) {
      try {
        // Check if template already exists
        const existing = await prisma.emailTemplate.findUnique({
          where: { name: template.name }
        });
        
        if (existing) {
          console.log(`⏭️  ${template.name} - Already exists, skipping`);
          continue;
        }
        
        // Create the template
        await prisma.emailTemplate.create({
          data: {
            name: template.name,
            displayName: template.displayName,
            subject: template.subject,
            body: template.body,
            htmlBody: template.htmlBody,
            variables: template.variables,
            isActive: template.isActive ?? true
          }
        });
        
        console.log(`✅ ${template.name} - Created successfully`);
      } catch (error) {
        console.log(`❌ ${template.name} - Failed to create:`, error.message);
      }
    }
    
    // Check final status
    console.log('\n📊 Final Template Status:');
    console.log('-' .repeat(30));
    
    const allTemplates = await prisma.emailTemplate.findMany({
      select: {
        name: true,
        displayName: true,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });
    
    allTemplates.forEach(t => {
      console.log(`${t.isActive ? '✅' : '❌'} ${t.name} - ${t.displayName}`);
    });
    
    console.log(`\n🎉 Seeding complete! ${allTemplates.length} templates in database`);
    
  } catch (error) {
    console.error('❌ Failed to seed templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
seedEmailTemplates()
  .catch(error => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
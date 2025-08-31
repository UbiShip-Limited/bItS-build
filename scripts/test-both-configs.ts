#!/usr/bin/env tsx
import { Resend } from 'resend';

async function testBothConfigs() {
  console.log('🔍 Testing Email Configurations\n');
  
  // Test configurations
  const configs = [
    {
      name: 'Onboarding Domain (Always Works)',
      from: 'onboarding@resend.dev',
      apiKey: 're_MojNRjdr_Dx9jPC3S3xBGKuN3TZinUFiB'
    },
    {
      name: 'Verified Domain',
      from: 'noreply@send.bowenislandtattoo.com',
      apiKey: 're_MojNRjdr_Dx9jPC3S3xBGKuN3TZinUFiB'
    }
  ];

  const testEmail = 'support@ubiship.io';

  for (const config of configs) {
    console.log(`📧 Testing: ${config.name}`);
    console.log(`   FROM: ${config.from}`);
    console.log(`   TO: ${testEmail}`);
    
    const resend = new Resend(config.apiKey);
    
    try {
      const result = await resend.emails.send({
        from: config.from,
        to: testEmail,
        subject: `Test - ${config.name}`,
        html: `<p>Testing email from ${config.from}</p>`
      });
      
      if (result.data?.id) {
        console.log(`   ✅ SUCCESS! Email ID: ${result.data.id}`);
      } else if (result.error) {
        console.log(`   ❌ FAILED: ${JSON.stringify(result.error)}`);
      }
    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('📝 Next Steps:');
  console.log('1. If onboarding@resend.dev fails: You\'re still in test mode');
  console.log('2. If send.bowenislandtattoo.com fails: Domain not properly linked to this API key');
  console.log('3. Check Resend dashboard for the API key that has the verified domain');
}

testBothConfigs().catch(console.error);
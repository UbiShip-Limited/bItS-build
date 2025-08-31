import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPaymentLinksSchema() {
  console.log('Checking database tables...');
  
  try {
    // First, check if the payment_links table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'payment_links'
      ) as exists
    `;
    
    console.log('Table exists result:', tableExists);
    
    if (!(tableExists as any)[0]?.exists) {
      console.log('payment_links table does not exist. Creating it...');
      
      // Create the payment_links table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "payment_links" (
          "id" TEXT NOT NULL,
          "square_order_id" TEXT,
          "customer_id" TEXT NOT NULL,
          "appointment_id" TEXT,
          "amount" DOUBLE PRECISION NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'active',
          "url" TEXT NOT NULL,
          "metadata" JSONB,
          "enable_reminders" BOOLEAN DEFAULT true,
          "last_reminder_sent" TIMESTAMP(3),
          "reminder_count" INTEGER DEFAULT 0,
          "reminder_schedule" JSONB DEFAULT '[2, 7, 14]'::jsonb,
          "expires_at" TIMESTAMP(3),
          "deleted_at" TIMESTAMP(3),
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "payment_links_pkey" PRIMARY KEY ("id")
        )
      `);
      
      console.log('✓ Table created successfully');
      
      // Add foreign key constraints
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "payment_links" 
        ADD CONSTRAINT "payment_links_customer_id_fkey" 
        FOREIGN KEY ("customer_id") 
        REFERENCES "customers"("id") 
        ON DELETE RESTRICT ON UPDATE CASCADE
      `);
      
      console.log('✓ Foreign key constraints added');
    } else {
      console.log('payment_links table exists. Adding missing columns...');
    }
    
    // Add missing columns to payment_links table
    const queries = [
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "enable_reminders" BOOLEAN DEFAULT true`,
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "last_reminder_sent" TIMESTAMP(3)`,
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "reminder_count" INTEGER DEFAULT 0`,
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3)`,
      `ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "reminder_schedule" JSONB DEFAULT '[2, 7, 14]'::jsonb`,
    ];

    for (const query of queries) {
      console.log(`Executing: ${query.substring(0, 50)}...`);
      await prisma.$executeRawUnsafe(query);
      console.log('✓ Success');
    }

    // Create indexes
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS "payment_links_reminder_status_idx" ON "payment_links"("status", "enable_reminders", "reminder_count")`,
      `CREATE INDEX IF NOT EXISTS "payment_links_expires_idx" ON "payment_links"("expires_at")`,
    ];

    for (const query of indexQueries) {
      console.log(`Creating index: ${query.substring(0, 50)}...`);
      await prisma.$executeRawUnsafe(query);
      console.log('✓ Index created');
    }

    console.log('\n✅ Schema fixed successfully!');
    
    // Test the fix by querying payment_links
    const count = await prisma.paymentLink.count();
    console.log(`\nFound ${count} payment links in the database.`);
    
  } catch (error) {
    console.error('Error fixing schema:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixPaymentLinksSchema();
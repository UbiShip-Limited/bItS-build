import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { SquareClient, SquareEnvironment } from 'square';
import { addDays, subDays } from 'date-fns';

const prisma = new PrismaClient();

// Initialize Square client
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' 
    ? SquareEnvironment.Production 
    : SquareEnvironment.Sandbox,
});

interface ImportOptions {
  startDate?: Date;
  endDate?: Date;
  importCustomers?: boolean;
  importPayments?: boolean;
  importAppointments?: boolean;
  dryRun?: boolean;
}

async function importSquareData(options: ImportOptions = {}) {
  const {
    startDate = subDays(new Date(), 365), // Default: last year
    endDate = new Date(),
    importCustomers = true,
    importPayments = true,
    importAppointments = true,
    dryRun = false
  } = options;

  console.log('🚀 Starting Square data import...');
  console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
  console.log(`🔧 Mode: ${dryRun ? 'DRY RUN' : 'LIVE IMPORT'}`);
  
  const results = {
    customers: { imported: 0, skipped: 0, errors: 0 },
    payments: { imported: 0, skipped: 0, errors: 0 },
    appointments: { imported: 0, skipped: 0, errors: 0 }
  };

  try {
    // Import Customers
    if (importCustomers) {
      console.log('\n📋 Importing customers...');
      const customersResult = await importSquareCustomers(dryRun);
      results.customers = customersResult;
    }

    // Import Payments
    if (importPayments) {
      console.log('\n💳 Importing payments...');
      const paymentsResult = await importSquarePayments(startDate, endDate, dryRun);
      results.payments = paymentsResult;
    }

    // Import Appointments/Bookings
    if (importAppointments) {
      console.log('\n📅 Importing appointments...');
      const appointmentsResult = await importSquareBookings(startDate, endDate, dryRun);
      results.appointments = appointmentsResult;
    }

    console.log('\n✅ Import completed!');
    console.log('📊 Results:', JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function importSquareCustomers(dryRun: boolean) {
  const stats = { imported: 0, skipped: 0, errors: 0 };
  
  try {
    const response = await squareClient.customers.list({}) as any;
    const customers = response.data || [];
    
    console.log(`Found ${customers.length} customers in Square`);

    for (const squareCustomer of customers) {
      try {
        // Check if customer already exists
        const existing = await prisma.customer.findFirst({
          where: {
            OR: [
              { squareId: squareCustomer.id },
              { email: squareCustomer.emailAddress }
            ]
          }
        });

        if (existing) {
          stats.skipped++;
          console.log(`⏭️  Skipping existing customer: ${squareCustomer.emailAddress}`);
          continue;
        }

        if (!dryRun) {
          await prisma.customer.create({
            data: {
              name: `${squareCustomer.givenName || ''} ${squareCustomer.familyName || ''}`.trim() || 'Unknown',
              email: squareCustomer.emailAddress,
              phone: squareCustomer.phoneNumber,
              squareId: squareCustomer.id,
              notes: squareCustomer.note,
              createdAt: new Date(squareCustomer.createdAt!),
              updatedAt: new Date(squareCustomer.updatedAt!)
            }
          });
        }
        
        stats.imported++;
        console.log(`✅ Imported customer: ${squareCustomer.emailAddress}`);
        
      } catch (error) {
        stats.errors++;
        console.error(`❌ Error importing customer ${squareCustomer.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to fetch customers from Square:', error);
  }

  return stats;
}

async function importSquarePayments(startDate: Date, endDate: Date, dryRun: boolean) {
  const stats = { imported: 0, skipped: 0, errors: 0 };
  
  try {
    const response = await squareClient.payments.list({
      beginTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      locationId: process.env.SQUARE_LOCATION_ID
    }) as any;
    
    const payments = response.data || [];
    console.log(`Found ${payments.length} payments in Square`);

    for (const squarePayment of payments) {
      try {
        // Check if payment already exists
        const existing = await prisma.payment.findUnique({
          where: { squareId: squarePayment.id }
        });

        if (existing) {
          stats.skipped++;
          continue;
        }

        // Try to find linked customer
        let customerId: string | null = null;
        if (squarePayment.customerId) {
          const customer = await prisma.customer.findUnique({
            where: { squareId: squarePayment.customerId }
          });
          customerId = customer?.id || null;
        }

        if (!dryRun) {
          await prisma.payment.create({
            data: {
              amount: squarePayment.amountMoney ? Number(squarePayment.amountMoney.amount) / 100 : 0,
              status: mapSquarePaymentStatus(squarePayment.status!),
              paymentMethod: squarePayment.sourceType || 'unknown',
              squareId: squarePayment.id,
              customerId,
              paymentDetails: squarePayment as any,
              createdAt: new Date(squarePayment.createdAt!),
              updatedAt: new Date(squarePayment.updatedAt!)
            }
          });
        }
        
        stats.imported++;
        console.log(`✅ Imported payment: $${Number(squarePayment.amountMoney?.amount || 0) / 100}`);
        
      } catch (error) {
        stats.errors++;
        console.error(`❌ Error importing payment ${squarePayment.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to fetch payments from Square:', error);
  }

  return stats;
}

async function importSquareBookings(startDate: Date, endDate: Date, dryRun: boolean) {
  const stats = { imported: 0, skipped: 0, errors: 0 };
  
  try {
    // Square's booking API requires team member IDs
    const teamMembersResponse = await squareClient.bookingsApi.listTeamMemberBookingProfiles();
    const teamMembers = teamMembersResponse.result.teamMemberBookingProfiles || [];
    
    if (teamMembers.length === 0) {
      console.log('No team members found, skipping bookings import');
      return stats;
    }

    // Search for bookings
    const bookingsResponse = await squareClient.bookingsApi.searchAvailability({
      query: {
        filter: {
          startAtRange: {
            startAt: startDate.toISOString(),
            endAt: endDate.toISOString()
          },
          locationId: process.env.SQUARE_LOCATION_ID!,
          teamMemberIdFilter: {
            any: teamMembers.map(tm => tm.teamMemberId!)
          }
        }
      }
    });

    // Note: searchAvailability returns available slots, not booked appointments
    // To get actual bookings, we need to use listBookings which requires booking IDs
    // This is a limitation of Square's API
    
    console.log('⚠️  Note: Square API does not provide a way to list all historical bookings');
    console.log('Only bookings created through your system will be available');
    
  } catch (error) {
    console.error('Failed to fetch bookings from Square:', error);
  }

  return stats;
}

function mapSquarePaymentStatus(squareStatus: string): string {
  const statusMap: Record<string, string> = {
    'APPROVED': 'completed',
    'COMPLETED': 'completed',
    'PENDING': 'pending',
    'CANCELED': 'cancelled',
    'FAILED': 'failed'
  };
  
  return statusMap[squareStatus] || 'pending';
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: ImportOptions = {
  dryRun: args.includes('--dry-run'),
  importCustomers: !args.includes('--no-customers'),
  importPayments: !args.includes('--no-payments'),
  importAppointments: !args.includes('--no-appointments')
};

// Date range from arguments
const startDateArg = args.find(arg => arg.startsWith('--start='));
const endDateArg = args.find(arg => arg.startsWith('--end='));

if (startDateArg) {
  options.startDate = new Date(startDateArg.split('=')[1]);
}
if (endDateArg) {
  options.endDate = new Date(endDateArg.split('=')[1]);
}

// Run the import
importSquareData(options);

/*
Usage:
  npm run import:square                    # Import everything from last year
  npm run import:square -- --dry-run       # Test run without importing
  npm run import:square -- --start=2023-01-01 --end=2023-12-31  # Specific date range
  npm run import:square -- --no-payments   # Skip payments import
*/
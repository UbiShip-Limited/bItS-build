import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { SquareClient, SquareEnvironment, ApiError } from 'square';
import { addDays, subDays, format } from 'date-fns';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

const prisma = new PrismaClient();

// Check if required environment variables are set
const requiredEnvVars = ['SQUARE_ACCESS_TOKEN', 'SQUARE_LOCATION_ID', 'SQUARE_ENVIRONMENT'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(chalk.red('❌ Missing required environment variables:'));
  missingVars.forEach(varName => console.error(chalk.red(`   - ${varName}`)));
  console.error(chalk.yellow('\n💡 Please set these variables in your .env file'));
  process.exit(1);
}

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
  batchSize?: number;
  resumeFromFile?: string;
}

interface ImportProgress {
  lastProcessedCustomerId?: string;
  lastProcessedPaymentId?: string;
  lastProcessedAppointmentId?: string;
  processedCustomers: string[];
  processedPayments: string[];
  processedAppointments: string[];
}

interface ImportStats {
  imported: number;
  skipped: number;
  errors: number;
  details: {
    [key: string]: any;
  }[];
}

interface ImportReport {
  startTime: Date;
  endTime?: Date;
  options: ImportOptions;
  results: {
    customers: ImportStats;
    payments: ImportStats;
    appointments: ImportStats;
  };
  errors: Array<{
    type: string;
    id: string;
    error: string;
  }>;
}

class SquareDataImporter {
  private progress: ImportProgress = {
    processedCustomers: [],
    processedPayments: [],
    processedAppointments: []
  };
  
  private report: ImportReport;
  private progressFile: string;
  
  constructor(private options: ImportOptions) {
    this.report = {
      startTime: new Date(),
      options,
      results: {
        customers: { imported: 0, skipped: 0, errors: 0, details: [] },
        payments: { imported: 0, skipped: 0, errors: 0, details: [] },
        appointments: { imported: 0, skipped: 0, errors: 0, details: [] }
      },
      errors: []
    };
    
    this.progressFile = path.join(
      process.cwd(), 
      'import-progress', 
      `square-import-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`
    );
  }
  
  async run() {
    const {
      startDate = subDays(new Date(), 365),
      endDate = new Date(),
      importCustomers = true,
      importPayments = true,
      importAppointments = true,
      dryRun = false,
      resumeFromFile
    } = this.options;

    console.log(chalk.blue('🚀 Starting Square data import...'));
    console.log(chalk.gray(`📅 Date range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`));
    console.log(chalk.yellow(`🔧 Mode: ${dryRun ? 'DRY RUN' : 'LIVE IMPORT'}`));
    console.log(chalk.gray(`🏪 Environment: ${process.env.SQUARE_ENVIRONMENT}`));
    
    // Load progress if resuming
    if (resumeFromFile) {
      await this.loadProgress(resumeFromFile);
      console.log(chalk.green('📂 Resuming from previous import...'));
    }
    
    try {
      // Create progress directory
      await fs.mkdir(path.dirname(this.progressFile), { recursive: true });
      
      // Import Customers
      if (importCustomers) {
        console.log(chalk.cyan('\n📋 Importing customers...'));
        await this.importCustomers(dryRun);
      }

      // Import Payments
      if (importPayments) {
        console.log(chalk.cyan('\n💳 Importing payments...'));
        await this.importPayments(startDate, endDate, dryRun);
      }

      // Import Appointments
      if (importAppointments) {
        console.log(chalk.cyan('\n📅 Checking for appointments...'));
        await this.importAppointments(startDate, endDate, dryRun);
      }

      this.report.endTime = new Date();
      
      // Generate and save report
      await this.generateReport();
      
      console.log(chalk.green('\n✅ Import completed successfully!'));
      this.printSummary();

    } catch (error) {
      console.error(chalk.red('❌ Import failed:'), error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
  
  private async saveProgress() {
    try {
      await fs.writeFile(
        this.progressFile,
        JSON.stringify(this.progress, null, 2)
      );
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not save progress:'), error);
    }
  }
  
  private async loadProgress(file: string) {
    try {
      const data = await fs.readFile(file, 'utf-8');
      this.progress = JSON.parse(data);
    } catch (error) {
      console.error(chalk.red('Could not load progress file:'), error);
      throw error;
    }
  }
  
  private async importCustomers(dryRun: boolean) {
    const stats = this.report.results.customers;
    let cursor: string | undefined;
    let totalProcessed = 0;
    
    try {
      do {
        const response = await squareClient.customers.list({ cursor }) as any;
        const customers = response.data || [];
        cursor = response.cursor;
        
        if (totalProcessed === 0) {
          console.log(chalk.gray(`Found ${customers.length}+ customers in Square`));
        }
        
        for (const squareCustomer of customers) {
          // Skip if already processed in previous run
          if (this.progress.processedCustomers.includes(squareCustomer.id!)) {
            continue;
          }
          
          totalProcessed++;
          
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
              console.log(chalk.gray(`⏭️  Skipping existing customer: ${squareCustomer.emailAddress || squareCustomer.id}`));
              continue;
            }

            const customerData = {
              name: `${squareCustomer.givenName || ''} ${squareCustomer.familyName || ''}`.trim() || 'Unknown',
              email: squareCustomer.emailAddress,
              phone: squareCustomer.phoneNumber,
              squareId: squareCustomer.id,
              notes: squareCustomer.note,
              createdAt: new Date(squareCustomer.createdAt!),
              updatedAt: new Date(squareCustomer.updatedAt!)
            };

            if (!dryRun) {
              await prisma.customer.create({ data: customerData });
            }
            
            stats.imported++;
            stats.details.push({
              id: squareCustomer.id,
              email: squareCustomer.emailAddress,
              name: customerData.name
            });
            
            console.log(chalk.green(`✅ Imported customer: ${squareCustomer.emailAddress || customerData.name}`));
            
            // Mark as processed
            this.progress.processedCustomers.push(squareCustomer.id!);
            
            // Save progress every 10 customers
            if (stats.imported % 10 === 0) {
              await this.saveProgress();
            }
            
          } catch (error) {
            stats.errors++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(chalk.red(`❌ Error importing customer ${squareCustomer.id}:`), errorMessage);
            
            this.report.errors.push({
              type: 'customer',
              id: squareCustomer.id!,
              error: errorMessage
            });
          }
        }
        
        // Log progress
        if (cursor) {
          console.log(chalk.gray(`Processed ${totalProcessed} customers so far...`));
        }
        
      } while (cursor);
      
    } catch (error) {
      console.error(chalk.red('Failed to fetch customers from Square:'), error);
      if (error && typeof error === 'object' && 'result' in error) {
        console.error(chalk.red('Square API Error:'), (error as any).result);
      }
    }
    
    await this.saveProgress();
  }
  
  private async importPayments(startDate: Date, endDate: Date, dryRun: boolean) {
    const stats = this.report.results.payments;
    let cursor: string | undefined;
    let totalProcessed = 0;
    
    try {
      do {
        const response = await squareClient.payments.list({
          beginTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          cursor,
          locationId: process.env.SQUARE_LOCATION_ID
        }) as any;
        
        const payments = response.data || [];
        cursor = response.cursor;
        
        if (totalProcessed === 0) {
          console.log(chalk.gray(`Found ${payments.length}+ payments in Square for date range`));
        }
        
        for (const squarePayment of payments) {
          // Skip if already processed
          if (this.progress.processedPayments.includes(squarePayment.id!)) {
            continue;
          }
          
          totalProcessed++;
          
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

            const paymentData = {
              amount: squarePayment.amountMoney ? Number(squarePayment.amountMoney.amount) / 100 : 0,
              status: this.mapSquarePaymentStatus(squarePayment.status!),
              paymentMethod: squarePayment.sourceType || 'unknown',
              paymentType: 'payment',
              squareId: squarePayment.id,
              customerId,
              paymentDetails: squarePayment as any,
              createdAt: new Date(squarePayment.createdAt!),
              updatedAt: new Date(squarePayment.updatedAt!)
            };

            if (!dryRun) {
              await prisma.payment.create({ data: paymentData });
            }
            
            stats.imported++;
            stats.details.push({
              id: squarePayment.id,
              amount: paymentData.amount,
              status: paymentData.status,
              customerId: squarePayment.customerId,
              createdAt: paymentData.createdAt
            });
            
            console.log(chalk.green(`✅ Imported payment: $${paymentData.amount.toFixed(2)} - ${format(paymentData.createdAt, 'yyyy-MM-dd HH:mm')}`));
            
            // Mark as processed
            this.progress.processedPayments.push(squarePayment.id!);
            
            // Save progress every 20 payments
            if (stats.imported % 20 === 0) {
              await this.saveProgress();
            }
            
          } catch (error) {
            stats.errors++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(chalk.red(`❌ Error importing payment ${squarePayment.id}:`), errorMessage);
            
            this.report.errors.push({
              type: 'payment',
              id: squarePayment.id!,
              error: errorMessage
            });
          }
        }
        
        // Log progress
        if (cursor) {
          console.log(chalk.gray(`Processed ${totalProcessed} payments so far...`));
        }
        
      } while (cursor);
      
    } catch (error) {
      console.error(chalk.red('Failed to fetch payments from Square:'), error);
      if (error && typeof error === 'object' && 'result' in error) {
        console.error(chalk.red('Square API Error:'), (error as any).result);
      }
    }
    
    await this.saveProgress();
  }
  
  private async importAppointments(startDate: Date, endDate: Date, dryRun: boolean) {
    const stats = this.report.results.appointments;
    
    try {
      console.log(chalk.yellow('⚠️  Note: Square API limitations:'));
      console.log(chalk.yellow('   - Cannot list historical bookings directly'));
      console.log(chalk.yellow('   - Only bookings created through your app are accessible'));
      console.log(chalk.yellow('   - Consider manual data entry for historical appointments'));
      
      // We can at least check if the Bookings API is configured
      try {
        const teamMembersResponse = await squareClient.bookingsApi.listTeamMemberBookingProfiles();
        const teamMembers = teamMembersResponse.result.teamMemberBookingProfiles || [];
        
        if (teamMembers.length > 0) {
          console.log(chalk.gray(`Found ${teamMembers.length} team members configured for bookings`));
        } else {
          console.log(chalk.yellow('No team members configured for Square Bookings'));
        }
      } catch (error) {
        console.log(chalk.yellow('Square Bookings API not configured or accessible'));
      }
      
    } catch (error) {
      console.error(chalk.red('Failed to check bookings:'), error);
    }
  }
  
  private mapSquarePaymentStatus(squareStatus: string): string {
    const statusMap: Record<string, string> = {
      'APPROVED': 'completed',
      'COMPLETED': 'completed',
      'PENDING': 'pending',
      'CANCELED': 'cancelled',
      'FAILED': 'failed'
    };
    
    return statusMap[squareStatus] || 'pending';
  }
  
  private async generateReport() {
    const reportPath = path.join(
      process.cwd(),
      'import-reports',
      `square-import-report-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`
    );
    
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(this.report, null, 2));
    
    // Also generate a human-readable summary
    const summaryPath = reportPath.replace('.json', '.txt');
    const summary = this.generateSummaryText();
    await fs.writeFile(summaryPath, summary);
    
    console.log(chalk.gray(`\n📄 Report saved to: ${reportPath}`));
    console.log(chalk.gray(`📄 Summary saved to: ${summaryPath}`));
  }
  
  private generateSummaryText(): string {
    const { customers, payments, appointments } = this.report.results;
    const duration = this.report.endTime 
      ? ((this.report.endTime.getTime() - this.report.startTime.getTime()) / 1000).toFixed(1)
      : 'N/A';
    
    let summary = `Square Data Import Report
========================
Date: ${format(this.report.startTime, 'yyyy-MM-dd HH:mm:ss')}
Duration: ${duration} seconds
Mode: ${this.options.dryRun ? 'DRY RUN' : 'LIVE IMPORT'}
Date Range: ${format(this.options.startDate || subDays(new Date(), 365), 'yyyy-MM-dd')} to ${format(this.options.endDate || new Date(), 'yyyy-MM-dd')}

Results Summary
==============

Customers:
  - Imported: ${customers.imported}
  - Skipped (existing): ${customers.skipped}
  - Errors: ${customers.errors}
  - Total processed: ${customers.imported + customers.skipped + customers.errors}

Payments:
  - Imported: ${payments.imported}
  - Skipped (existing): ${payments.skipped}
  - Errors: ${payments.errors}
  - Total processed: ${payments.imported + payments.skipped + payments.errors}
  - Total value: $${payments.details.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}

Appointments:
  - Note: Square API does not support historical booking imports

Errors Summary
=============
Total errors: ${this.report.errors.length}
`;

    if (this.report.errors.length > 0) {
      summary += '\nError Details:\n';
      this.report.errors.forEach((error, index) => {
        summary += `${index + 1}. ${error.type} (${error.id}): ${error.error}\n`;
      });
    }
    
    return summary;
  }
  
  private printSummary() {
    const { customers, payments } = this.report.results;
    
    console.log(chalk.blue('\n📊 Import Summary:'));
    console.log(chalk.white('═══════════════════'));
    
    console.log(chalk.cyan('\nCustomers:'));
    console.log(`  ${chalk.green('✓')} Imported: ${chalk.bold(customers.imported)}`);
    console.log(`  ${chalk.yellow('⏭')} Skipped: ${chalk.bold(customers.skipped)}`);
    console.log(`  ${chalk.red('✗')} Errors: ${chalk.bold(customers.errors)}`);
    
    console.log(chalk.cyan('\nPayments:'));
    console.log(`  ${chalk.green('✓')} Imported: ${chalk.bold(payments.imported)}`);
    console.log(`  ${chalk.yellow('⏭')} Skipped: ${chalk.bold(payments.skipped)}`);
    console.log(`  ${chalk.red('✗')} Errors: ${chalk.bold(payments.errors)}`);
    console.log(`  ${chalk.blue('💰')} Total value: ${chalk.bold('$' + payments.details.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2))}`);
    
    if (this.report.errors.length > 0) {
      console.log(chalk.red(`\n⚠️  ${this.report.errors.length} errors occurred during import`));
      console.log(chalk.gray('Check the report file for details'));
    }
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options: ImportOptions = {
    dryRun: args.includes('--dry-run'),
    importCustomers: !args.includes('--no-customers'),
    importPayments: !args.includes('--no-payments'),
    importAppointments: !args.includes('--no-appointments'),
    batchSize: 100
  };

  // Date range from arguments
  const startDateArg = args.find(arg => arg.startsWith('--start='));
  const endDateArg = args.find(arg => arg.startsWith('--end='));
  const resumeArg = args.find(arg => arg.startsWith('--resume='));
  const batchArg = args.find(arg => arg.startsWith('--batch='));

  if (startDateArg) {
    options.startDate = new Date(startDateArg.split('=')[1]);
  }
  if (endDateArg) {
    options.endDate = new Date(endDateArg.split('=')[1]);
  }
  if (resumeArg) {
    options.resumeFromFile = resumeArg.split('=')[1];
  }
  if (batchArg) {
    options.batchSize = parseInt(batchArg.split('=')[1], 10);
  }
  
  // Help text
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Square Data Import Script
========================

Usage: npm run import:square:enhanced [options]

Options:
  --dry-run              Test run without importing data
  --start=YYYY-MM-DD     Start date for payment import (default: 1 year ago)
  --end=YYYY-MM-DD       End date for payment import (default: today)
  --no-customers         Skip customer import
  --no-payments          Skip payment import
  --no-appointments      Skip appointment import
  --batch=NUMBER         Batch size for processing (default: 100)
  --resume=FILE          Resume from a previous import progress file
  --help, -h             Show this help message

Examples:
  npm run import:square:enhanced                                    # Import everything from last year
  npm run import:square:enhanced -- --dry-run                       # Test run without importing
  npm run import:square:enhanced -- --start=2023-01-01 --end=2023-12-31  # Specific date range
  npm run import:square:enhanced -- --no-payments                   # Skip payments import
  npm run import:square:enhanced -- --resume=import-progress/square-import-2024-01-15-143022.json

Reports:
  Import reports are saved to: ./import-reports/
  Progress files are saved to: ./import-progress/
`);
    process.exit(0);
  }
  
  return options;
}

// Main execution
async function main() {
  const options = parseArgs();
  const importer = new SquareDataImporter(options);
  
  try {
    await importer.run();
  } catch (error) {
    console.error(chalk.red('\n💥 Fatal error:'), error);
    process.exit(1);
  }
}

// Run the script
main();
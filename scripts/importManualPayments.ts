import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import chalk from 'chalk';
import { z } from 'zod';

const prisma = new PrismaClient();

// Payment data schema for validation
const PaymentImportSchema = z.object({
  amount: z.union([z.string(), z.number()]).transform(val => {
    const num = typeof val === 'string' ? parseFloat(val.replace(/[$,]/g, '')) : val;
    if (isNaN(num)) throw new Error('Invalid amount');
    return num;
  }),
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
  paymentMethod: z.string().default('cash'),
  status: z.enum(['completed', 'pending', 'cancelled', 'failed']).default('completed'),
  notes: z.string().optional(),
  referenceId: z.string().optional(),
  date: z.string().transform(str => new Date(str)),
});

type PaymentImportData = z.infer<typeof PaymentImportSchema>;

interface ImportOptions {
  file: string;
  format: 'csv' | 'json';
  dryRun?: boolean;
  skipDuplicates?: boolean;
  createMissingCustomers?: boolean;
}

class ManualPaymentImporter {
  private report = {
    startTime: new Date(),
    imported: 0,
    skipped: 0,
    errors: 0,
    totalAmount: 0,
    details: [] as any[],
    errors: [] as any[]
  };

  constructor(private options: ImportOptions) {}

  async run() {
    console.log(chalk.blue('💰 Starting manual payment import...'));
    console.log(chalk.gray(`📄 File: ${this.options.file}`));
    console.log(chalk.gray(`📋 Format: ${this.options.format}`));
    console.log(chalk.yellow(`🔧 Mode: ${this.options.dryRun ? 'DRY RUN' : 'LIVE IMPORT'}`));

    try {
      // Read and parse the file
      const data = await this.loadData();
      console.log(chalk.gray(`📊 Found ${data.length} payment records to import`));

      // Process each payment
      for (const [index, record] of data.entries()) {
        await this.processPayment(record, index + 1);
      }

      // Generate report
      await this.generateReport();
      
      console.log(chalk.green('\n✅ Import completed!'));
      this.printSummary();

    } catch (error) {
      console.error(chalk.red('❌ Import failed:'), error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  private async loadData(): Promise<any[]> {
    const fileContent = await fs.readFile(this.options.file, 'utf-8');

    if (this.options.format === 'csv') {
      return parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } else {
      return JSON.parse(fileContent);
    }
  }

  private async processPayment(record: any, lineNumber: number) {
    try {
      // Validate and transform the data
      const paymentData = PaymentImportSchema.parse(record);

      // Check for duplicate based on referenceId if provided
      if (paymentData.referenceId && this.options.skipDuplicates) {
        const existing = await prisma.payment.findFirst({
          where: { referenceId: paymentData.referenceId }
        });

        if (existing) {
          this.report.skipped++;
          console.log(chalk.gray(`⏭️  Skipping duplicate payment: ${paymentData.referenceId}`));
          return;
        }
      }

      // Find or create customer
      let customerId: string | null = null;
      if (paymentData.customerEmail || paymentData.customerName) {
        const customer = await this.findOrCreateCustomer(
          paymentData.customerEmail,
          paymentData.customerName
        );
        customerId = customer?.id || null;
      }

      // Create the payment record
      if (!this.options.dryRun) {
        await prisma.payment.create({
          data: {
            amount: paymentData.amount,
            status: paymentData.status,
            paymentMethod: paymentData.paymentMethod,
            paymentType: 'payment',
            notes: paymentData.notes,
            referenceId: paymentData.referenceId,
            customerId,
            createdAt: paymentData.date,
            updatedAt: new Date()
          }
        });
      }

      this.report.imported++;
      this.report.totalAmount += paymentData.amount;
      this.report.details.push({
        line: lineNumber,
        amount: paymentData.amount,
        customer: paymentData.customerEmail || paymentData.customerName,
        date: paymentData.date,
        status: paymentData.status
      });

      console.log(chalk.green(
        `✅ Imported payment: $${paymentData.amount.toFixed(2)} - ` +
        `${paymentData.customerEmail || paymentData.customerName || 'Anonymous'}`
      ));

    } catch (error) {
      this.report.errors++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.report.errors.push({
        line: lineNumber,
        record,
        error: errorMessage
      });

      console.error(chalk.red(`❌ Error on line ${lineNumber}:`), errorMessage);
    }
  }

  private async findOrCreateCustomer(email?: string, name?: string) {
    if (!email && !name) return null;

    // Try to find existing customer
    const existing = await prisma.customer.findFirst({
      where: email ? { email } : { name }
    });

    if (existing) return existing;

    // Create new customer if option is enabled
    if (this.options.createMissingCustomers && !this.options.dryRun) {
      return await prisma.customer.create({
        data: {
          email: email || undefined,
          name: name || email || 'Unknown',
          createdAt: new Date()
        }
      });
    }

    return null;
  }

  private async generateReport() {
    const reportDir = path.join(process.cwd(), 'import-reports');
    await fs.mkdir(reportDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `manual-payment-import-${timestamp}.json`);
    
    await fs.writeFile(reportPath, JSON.stringify(this.report, null, 2));
    console.log(chalk.gray(`\n📄 Report saved to: ${reportPath}`));
  }

  private printSummary() {
    console.log(chalk.blue('\n📊 Import Summary:'));
    console.log(chalk.white('═══════════════════'));
    console.log(`  ${chalk.green('✓')} Imported: ${chalk.bold(this.report.imported)}`);
    console.log(`  ${chalk.yellow('⏭')} Skipped: ${chalk.bold(this.report.skipped)}`);
    console.log(`  ${chalk.red('✗')} Errors: ${chalk.bold(this.report.errors)}`);
    console.log(`  ${chalk.blue('💰')} Total value: ${chalk.bold('$' + this.report.totalAmount.toFixed(2))}`);
  }
}

// Example CSV template generator
async function generateCsvTemplate() {
  const template = `amount,customerEmail,customerName,paymentMethod,status,notes,referenceId,date
100.00,john@example.com,John Doe,credit_card,completed,Tattoo deposit,REF-001,2024-01-15
250.00,jane@example.com,Jane Smith,cash,completed,Full sleeve session 1,REF-002,2024-01-20
75.50,,Walk-in Customer,square,completed,Small tattoo,REF-003,2024-01-22
`;

  const templatePath = path.join(process.cwd(), 'import-templates', 'payment-import-template.csv');
  await fs.mkdir(path.dirname(templatePath), { recursive: true });
  await fs.writeFile(templatePath, template);
  
  console.log(chalk.green(`✅ CSV template created at: ${templatePath}`));
}

// Example JSON template generator
async function generateJsonTemplate() {
  const template = [
    {
      amount: 100.00,
      customerEmail: "john@example.com",
      customerName: "John Doe",
      paymentMethod: "credit_card",
      status: "completed",
      notes: "Tattoo deposit",
      referenceId: "REF-001",
      date: "2024-01-15"
    },
    {
      amount: 250.00,
      customerEmail: "jane@example.com",
      customerName: "Jane Smith",
      paymentMethod: "cash",
      status: "completed",
      notes: "Full sleeve session 1",
      referenceId: "REF-002",
      date: "2024-01-20"
    }
  ];

  const templatePath = path.join(process.cwd(), 'import-templates', 'payment-import-template.json');
  await fs.mkdir(path.dirname(templatePath), { recursive: true });
  await fs.writeFile(templatePath, JSON.stringify(template, null, 2));
  
  console.log(chalk.green(`✅ JSON template created at: ${templatePath}`));
}

// Parse command line arguments
async function main() {
  const args = process.argv.slice(2);
  
  // Generate template if requested
  if (args.includes('--generate-template')) {
    const format = args.includes('--json') ? 'json' : 'csv';
    if (format === 'json') {
      await generateJsonTemplate();
    } else {
      await generateCsvTemplate();
    }
    return;
  }

  // Show help
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
Manual Payment Import Script
===========================

Import payment data from CSV or JSON files into the database.

Usage: npm run import:payments:manual -- --file=<path> [options]

Options:
  --file=PATH              Path to the import file (required)
  --format=csv|json        File format (default: auto-detect from extension)
  --dry-run                Test run without importing data
  --skip-duplicates        Skip payments with existing referenceId
  --create-customers       Create missing customers during import
  --generate-template      Generate a template file
  --json                   Generate JSON template (default: CSV)
  --help, -h               Show this help message

Examples:
  npm run import:payments:manual -- --file=payments.csv --dry-run
  npm run import:payments:manual -- --file=payments.json --create-customers
  npm run import:payments:manual -- --generate-template
  npm run import:payments:manual -- --generate-template --json

CSV Format:
  Required columns: amount, date
  Optional columns: customerEmail, customerName, paymentMethod, status, notes, referenceId

JSON Format:
  Array of objects with the same fields as CSV columns
`);
    process.exit(0);
  }

  // Parse options
  const fileArg = args.find(arg => arg.startsWith('--file='));
  if (!fileArg) {
    console.error(chalk.red('❌ Error: --file parameter is required'));
    console.log(chalk.yellow('Run with --help for usage information'));
    process.exit(1);
  }

  const filePath = fileArg.split('=')[1];
  const formatArg = args.find(arg => arg.startsWith('--format='));
  const format = formatArg 
    ? formatArg.split('=')[1] as 'csv' | 'json'
    : filePath.endsWith('.json') ? 'json' : 'csv';

  const options: ImportOptions = {
    file: filePath,
    format,
    dryRun: args.includes('--dry-run'),
    skipDuplicates: args.includes('--skip-duplicates'),
    createMissingCustomers: args.includes('--create-customers')
  };

  // Check if file exists
  try {
    await fs.access(filePath);
  } catch {
    console.error(chalk.red(`❌ Error: File not found: ${filePath}`));
    process.exit(1);
  }

  // Run the import
  const importer = new ManualPaymentImporter(options);
  try {
    await importer.run();
  } catch (error) {
    console.error(chalk.red('\n💥 Fatal error:'), error);
    process.exit(1);
  }
}

// Install csv-parse if needed
try {
  require('csv-parse/sync');
} catch {
  console.log(chalk.yellow('Installing required dependency: csv-parse...'));
  require('child_process').execSync('npm install csv-parse', { stdio: 'inherit' });
}

// Run the script
main();
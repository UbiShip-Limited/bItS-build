# Payment Import Guide

This guide explains how to import existing payment data into the Bowen Island Tattoo Shop application.

## Overview

The application provides three methods for importing payment data:

1. **Square API Import** - Import payments directly from your Square account
2. **Enhanced Square Import** - Advanced import with progress tracking and detailed reporting
3. **Manual Import** - Import payments from CSV or JSON files

## Prerequisites

Before importing payments, ensure you have:

1. Set up the database with `npx prisma migrate dev`
2. Configured environment variables (see `.env.example`)
3. For Square imports: Valid Square credentials in your `.env` file

## Method 1: Basic Square Import

The basic Square import script fetches payments from your Square account.

### Usage

```bash
# Import all data from the last year
npm run import:square

# Dry run (test without importing)
npm run import:square -- --dry-run

# Specific date range
npm run import:square -- --start=2024-01-01 --end=2024-12-31

# Skip certain data types
npm run import:square -- --no-payments    # Skip payments
npm run import:square -- --no-customers   # Skip customers
```

### Features
- Imports customers and payments from Square
- Automatically links payments to customers
- Prevents duplicate imports using Square IDs
- Converts Square amounts (cents) to dollars

## Method 2: Enhanced Square Import

The enhanced import script provides additional features for production use.

### Usage

```bash
# Basic usage with enhanced features
npm run import:square:enhanced

# Dry run with specific dates
npm run import:square:enhanced -- --dry-run --start=2024-01-01 --end=2025-07-22

# Resume a previous import
npm run import:square:enhanced -- --resume=import-progress/square-import-2024-01-15-143022.json

# Show help
npm run import:square:enhanced -- --help
```

### Enhanced Features

1. **Progress Tracking**
   - Saves progress to `import-progress/` directory
   - Can resume interrupted imports
   - Tracks processed records to avoid re-processing

2. **Detailed Reporting**
   - Generates JSON and text reports in `import-reports/`
   - Includes summary statistics
   - Lists all errors with details

3. **Better Error Handling**
   - Validates Square environment variables
   - Handles API errors gracefully
   - Continues processing after individual errors

4. **Visual Feedback**
   - Color-coded console output
   - Progress indicators
   - Clear error messages

### Report Files

After each import, you'll find:
- `import-reports/square-import-report-[timestamp].json` - Full detailed report
- `import-reports/square-import-report-[timestamp].txt` - Human-readable summary

## Method 3: Manual Payment Import

For importing payment data from other sources or manual records.

### Generate Templates

First, generate a template file to understand the required format:

```bash
# Generate CSV template
npm run import:payments:manual -- --generate-template

# Generate JSON template
npm run import:payments:manual -- --generate-template --json
```

Templates are saved to `import-templates/` directory.

### CSV Format

Required columns:
- `amount` - Payment amount (can include $ and commas)
- `date` - Payment date (YYYY-MM-DD format)

Optional columns:
- `customerEmail` - Customer's email address
- `customerName` - Customer's name
- `paymentMethod` - Payment method (cash, credit_card, square, etc.)
- `status` - Payment status (completed, pending, cancelled, failed)
- `notes` - Additional notes
- `referenceId` - Unique reference ID to prevent duplicates

Example CSV:
```csv
amount,customerEmail,customerName,paymentMethod,status,notes,referenceId,date
100.00,john@example.com,John Doe,credit_card,completed,Tattoo deposit,REF-001,2024-01-15
250.00,jane@example.com,Jane Smith,cash,completed,Full sleeve session 1,REF-002,2024-01-20
```

### JSON Format

Array of objects with the same fields as CSV:

```json
[
  {
    "amount": 100.00,
    "customerEmail": "john@example.com",
    "customerName": "John Doe",
    "paymentMethod": "credit_card",
    "status": "completed",
    "notes": "Tattoo deposit",
    "referenceId": "REF-001",
    "date": "2024-01-15"
  }
]
```

### Import Usage

```bash
# Import from CSV
npm run import:payments:manual -- --file=payments.csv

# Import from JSON
npm run import:payments:manual -- --file=payments.json

# Dry run
npm run import:payments:manual -- --file=payments.csv --dry-run

# Skip duplicates (based on referenceId)
npm run import:payments:manual -- --file=payments.csv --skip-duplicates

# Create missing customers
npm run import:payments:manual -- --file=payments.csv --create-customers
```

### Import Options

- `--file=PATH` - Path to import file (required)
- `--format=csv|json` - File format (auto-detected from extension)
- `--dry-run` - Test without importing
- `--skip-duplicates` - Skip payments with existing referenceId
- `--create-customers` - Create customers if they don't exist

## Best Practices

1. **Always run a dry-run first**
   ```bash
   npm run import:square:enhanced -- --dry-run
   ```

2. **Backup your database before importing**
   ```bash
   pg_dump your_database > backup.sql
   ```

3. **Start with a small date range**
   - Test with a week or month of data first
   - Verify the import worked correctly
   - Then import larger ranges

4. **Check the reports**
   - Review import reports for any errors
   - Verify amounts and counts match expectations
   - Look for any skipped records

5. **Handle missing customers**
   - Square import will link to existing customers by email
   - Manual import can create missing customers with `--create-customers`
   - Or pre-import customers separately

## Troubleshooting

### Square Import Issues

1. **Missing environment variables**
   - Check `.env` has all required Square variables
   - Verify `SQUARE_ENVIRONMENT` matches your tokens

2. **API timeout errors**
   - Try smaller date ranges
   - Use the enhanced import with resume capability

3. **Duplicate imports**
   - The system prevents duplicates using Square IDs
   - For manual imports, use `referenceId` field

### Manual Import Issues

1. **Date format errors**
   - Use YYYY-MM-DD format
   - Ensure dates are valid

2. **Amount parsing errors**
   - Remove currency symbols if causing issues
   - Use decimal points, not commas for decimals

3. **Customer linking**
   - Import customers first, or
   - Use `--create-customers` flag

## Square API Limitations

- **Bookings/Appointments**: Square API doesn't support listing historical bookings
- **Customer Data**: Limited to basic information (name, email, phone)
- **Payment Details**: Some payment details may be limited based on payment type

For appointments, consider:
1. Manual entry through the app
2. Import from your previous system using manual import
3. Going forward, create appointments through the app to maintain sync

## Support

If you encounter issues:

1. Check the error messages and logs
2. Review the generated reports
3. Verify your environment configuration
4. Try with a smaller data set
5. Use dry-run mode to test without making changes
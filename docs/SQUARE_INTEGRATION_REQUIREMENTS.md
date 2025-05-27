# Square Integration Requirements for Bowen Island Tattoo Shop

## Overview
This document outlines what the tattoo shop owner needs to provide to enable Square integration for appointment bookings and payment processing.

## Required Information from Shop Owner

### 1. Square Account Setup
- **Square Business Account**: You need an active Square account for your business
- **Business Verification**: Square account must be verified with your business information
- **Location Setup**: At least one location must be configured in Square

### 2. Square API Credentials
To connect your booking system with Square, you'll need to provide:

#### For Testing (Sandbox Environment)
1. **Sandbox Access Token**
   - Get from: https://developer.squareup.com/apps
   - Used for testing without real transactions
   
2. **Sandbox Application ID**
   - Found in your Square Developer Dashboard
   - Specific to your test application
   
3. **Sandbox Location ID**
   - Test location ID from Square Sandbox
   - Can be found in the Sandbox test accounts

#### For Production (Live Environment)
1. **Production Access Token**
   - OAuth token or Personal Access Token
   - Has permissions to create bookings and process payments
   
2. **Production Application ID**
   - Your live Square application ID
   
3. **Production Location ID**
   - The specific location ID for Bowen Island Tattoo Shop
   - Found in Square Dashboard > Locations

### 3. Square Catalog Setup (Optional but Recommended)
Configure your services in Square Catalog:

#### Service Types to Create:
- **Consultation** (30-60 minutes)
- **Small Tattoo** (1-2 hours)
- **Medium Tattoo** (2-4 hours)
- **Large Tattoo** (4+ hours)
- **Touch-up Session** (30-60 minutes)
- **Design Session** (1-2 hours)

#### For Each Service:
- Service name
- Duration
- Base price (can be variable)
- Description
- Any variations (e.g., different artists, complexity levels)

### 4. Team Member Setup
Configure your artists/staff in Square:

#### For Each Team Member:
- Full name
- Email address
- Phone number (optional)
- Working hours/availability
- Services they can perform
- Commission/payment split (if applicable)

### 5. Business Policies to Define

#### Booking Policies:
- **Advance Booking**: How far in advance can customers book?
- **Cancellation Policy**: How many hours before appointment?
- **No-show Policy**: Fees or restrictions for no-shows
- **Deposit Requirements**: Amount and when required

#### Payment Policies:
- **Accepted Payment Methods**: Card types, cash, etc.
- **Deposit Amount**: Percentage or fixed amount
- **Refund Policy**: Under what conditions
- **Tipping**: Enable/disable in Square

### 6. Integration Features to Enable

#### Required Permissions:
Your Square access token needs these permissions:
- `APPOINTMENTS_WRITE` - Create and manage bookings
- `APPOINTMENTS_READ` - View booking information
- `CUSTOMERS_WRITE` - Create customer profiles
- `CUSTOMERS_READ` - View customer information
- `PAYMENTS_WRITE` - Process payments
- `PAYMENTS_READ` - View payment history

#### Optional Features:
- **Square Messages**: For appointment reminders
- **Square Marketing**: For promotional emails
- **Square Loyalty**: For repeat customer rewards

## Setup Process

### Step 1: Create Square Developer Account
1. Go to https://developer.squareup.com
2. Sign up with your Square account
3. Create a new application

### Step 2: Get Sandbox Credentials
1. In Developer Dashboard, select your application
2. Go to "Sandbox" tab
3. Copy:
   - Sandbox Access Token
   - Sandbox Application ID
   - Default Test Account Location ID

### Step 3: Test the Integration
1. Provide sandbox credentials to your developer
2. Test creating bookings, customers, and payments
3. Verify everything works as expected

### Step 4: Go Live
1. In Developer Dashboard, go to "Production" tab
2. Generate production access token
3. Get your live location ID from Square Dashboard
4. Replace sandbox credentials with production ones

## Information Checklist

Please provide the following to your developer:

- [ ] Square account email
- [ ] Business name as registered with Square
- [ ] Preferred Square location for bookings
- [ ] List of services with durations and prices
- [ ] List of team members/artists
- [ ] Booking policies (advance booking, cancellation, etc.)
- [ ] Payment policies (deposits, refunds, etc.)
- [ ] Sandbox credentials for testing
- [ ] Production credentials when ready to go live

## Security Notes

⚠️ **Important**: 
- Never share your access tokens publicly
- Store credentials securely
- Use environment variables for configuration
- Rotate access tokens periodically
- Monitor Square Dashboard for unusual activity

## Support Resources

- **Square Developer Documentation**: https://developer.squareup.com/docs
- **Square Appointments API**: https://developer.squareup.com/docs/appointments-api
- **Square Support**: https://squareup.com/help

## Questions to Consider

1. **Multi-Artist Scheduling**: Do different artists have different availability?
2. **Service Variations**: Do prices vary by artist or complexity?
3. **Deposit Handling**: When and how much deposit is required?
4. **Booking Restrictions**: Any blackout dates or special hours?
5. **Customer Communication**: How should confirmations/reminders be sent?

---

*This document should be reviewed with your Square account representative to ensure all business requirements are properly configured.* 
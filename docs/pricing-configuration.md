# Pricing Configuration Guide

## Overview
The tattoo shop pricing system is now centralized and configurable via environment variables. This replaces the previous hardcoded values and supports different pricing for dev/test/prod environments.

## Environment Variables

Add these to your `.env` file to customize pricing:

```bash
# Payment Pricing Configuration (CAD)
PRICE_CONSULTATION_MIN=35
PRICE_DRAWING_CONSULTATION_MIN=50  
PRICE_TATTOO_DEPOSIT_MIN=75
PRICE_TATTOO_FINAL_MIN=100
PAYMENT_CURRENCY=CAD
```

## How to Change Prices

### Option 1: Environment Variables (Recommended)
1. Update your `.env` file with new prices
2. Restart your application
3. Prices will automatically update

### Option 2: Different Environments
```bash
# Development
PRICE_CONSULTATION_MIN=25
PRICE_DRAWING_CONSULTATION_MIN=35

# Production  
PRICE_CONSULTATION_MIN=45
PRICE_DRAWING_CONSULTATION_MIN=65
```

### Option 3: Quick Changes (For Testing)
Temporarily modify `lib/config/pricing.ts` default values.

## Current Pricing Structure

| Service Type | Minimum Amount | Description |
|--------------|----------------|-------------|
| Consultation | $35 CAD | Initial design discussion |
| Drawing Consultation | $50 CAD | Detailed design work |
| Tattoo Deposit | $75 CAD | Session booking deposit |
| Final Payment | $100 CAD | Final session payment |

## Testing Price Changes

```typescript
import { getMinimumAmount, PaymentType } from '../lib/config/pricing';

// Check current pricing
console.log('Consultation:', getMinimumAmount(PaymentType.CONSULTATION));
console.log('Deposit:', getMinimumAmount(PaymentType.TATTOO_DEPOSIT));
```

## Implementation Notes

- ✅ Centralized configuration (no code duplication)
- ✅ Environment-aware (dev/test/prod support)
- ✅ Type-safe with validation
- ✅ Automatic fallbacks if env vars missing
- ✅ Development logging for debugging

## Migration

The old hardcoded values have been removed from:
- `lib/services/paymentService.ts`
- `src/lib/api/services/paymentService.ts`

All pricing now comes from `lib/config/pricing.ts`. 
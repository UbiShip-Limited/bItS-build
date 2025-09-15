// Centralized pricing configuration for frontend
// This file manages all payment-related pricing for the tattoo shop

export enum PaymentType {
  CONSULTATION = 'consultation',
  DRAWING_CONSULTATION = 'drawing_consultation',
  TATTOO_DEPOSIT = 'tattoo_deposit',
  TATTOO_FINAL = 'tattoo_final'
}

export interface PricingConfig {
  minimumAmounts: Record<PaymentType, number>;
  currency: string;
  environment: string;
}

// Default pricing (fallback values)
const DEFAULT_PRICING: PricingConfig = {
  minimumAmounts: {
    [PaymentType.CONSULTATION]: 35,
    [PaymentType.DRAWING_CONSULTATION]: 50,
    [PaymentType.TATTOO_DEPOSIT]: 75,
    [PaymentType.TATTOO_FINAL]: 100
  },
  currency: 'CAD',
  environment: process.env.NODE_ENV || 'development'
};

// Load pricing from environment variables with fallbacks
function loadPricingConfig(): PricingConfig {
  const config: PricingConfig = {
    minimumAmounts: {
      [PaymentType.CONSULTATION]:
        parseFloat(process.env.NEXT_PUBLIC_PRICE_CONSULTATION_MIN || '35'),
      [PaymentType.DRAWING_CONSULTATION]:
        parseFloat(process.env.NEXT_PUBLIC_PRICE_DRAWING_CONSULTATION_MIN || '50'),
      [PaymentType.TATTOO_DEPOSIT]:
        parseFloat(process.env.NEXT_PUBLIC_PRICE_TATTOO_DEPOSIT_MIN || '75'),
      [PaymentType.TATTOO_FINAL]:
        parseFloat(process.env.NEXT_PUBLIC_PRICE_TATTOO_FINAL_MIN || '100')
    },
    currency: process.env.NEXT_PUBLIC_PAYMENT_CURRENCY || 'CAD',
    environment: process.env.NODE_ENV || 'development'
  };

  // Validate that all prices are positive numbers
  Object.entries(config.minimumAmounts).forEach(([type, amount]) => {
    if (isNaN(amount) || amount < 0) {
      console.warn(`Invalid price for ${type}: ${amount}, using default`);
      config.minimumAmounts[type as PaymentType] = DEFAULT_PRICING.minimumAmounts[type as PaymentType];
    }
  });

  return config;
}

// Export singleton instance
export const pricingConfig = loadPricingConfig();

// Helper functions
export function getMinimumAmount(paymentType: PaymentType): number {
  return pricingConfig.minimumAmounts[paymentType] || 0;
}

export function formatPaymentType(type: PaymentType): string {
  const typeMap = {
    [PaymentType.CONSULTATION]: 'Consultation',
    [PaymentType.DRAWING_CONSULTATION]: 'Drawing Consultation',
    [PaymentType.TATTOO_DEPOSIT]: 'Tattoo Deposit',
    [PaymentType.TATTOO_FINAL]: 'Final Payment'
  };
  return typeMap[type] || type;
}

export function formatPrice(amount: number, currency: string = pricingConfig.currency): string {
  return `$${amount.toFixed(2)} ${currency}`;
}

// Development helper to log current pricing
export function logCurrentPricing(): void {
  if (pricingConfig.environment === 'development') {
    console.log('💰 Current Pricing Configuration:');
    Object.entries(pricingConfig.minimumAmounts).forEach(([type, amount]) => {
      console.log(`  ${formatPaymentType(type as PaymentType)}: ${formatPrice(amount)}`);
    });
  }
}
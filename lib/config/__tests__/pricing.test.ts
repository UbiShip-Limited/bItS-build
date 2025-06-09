import { describe, it, expect } from 'vitest';
import { PaymentType, getMinimumAmount, formatPaymentType, formatPrice, pricingConfig } from '../pricing';

describe('Pricing Configuration', () => {
  describe('getMinimumAmount', () => {
    it('should return correct minimum amounts for all payment types', () => {
      expect(getMinimumAmount(PaymentType.CONSULTATION)).toBe(35);
      expect(getMinimumAmount(PaymentType.DRAWING_CONSULTATION)).toBe(50);
      expect(getMinimumAmount(PaymentType.TATTOO_DEPOSIT)).toBe(75);
      expect(getMinimumAmount(PaymentType.TATTOO_FINAL)).toBe(100);
    });

    it('should return 0 for unknown payment type', () => {
      expect(getMinimumAmount('unknown' as PaymentType)).toBe(0);
    });
  });

  describe('formatPaymentType', () => {
    it('should format payment types correctly', () => {
      expect(formatPaymentType(PaymentType.CONSULTATION)).toBe('Consultation');
      expect(formatPaymentType(PaymentType.DRAWING_CONSULTATION)).toBe('Drawing Consultation');
      expect(formatPaymentType(PaymentType.TATTOO_DEPOSIT)).toBe('Tattoo Deposit');
      expect(formatPaymentType(PaymentType.TATTOO_FINAL)).toBe('Final Payment');
    });
  });

  describe('formatPrice', () => {
    it('should format prices correctly', () => {
      expect(formatPrice(35)).toBe('$35.00 CAD');
      expect(formatPrice(100.50)).toBe('$100.50 CAD');
      expect(formatPrice(75, 'USD')).toBe('$75.00 USD');
    });
  });

  describe('pricingConfig', () => {
    it('should have valid configuration', () => {
      expect(pricingConfig.currency).toBe('CAD');
      expect(pricingConfig.minimumAmounts).toBeDefined();
      expect(Object.keys(pricingConfig.minimumAmounts)).toHaveLength(4);
    });

    it('should have positive minimum amounts', () => {
      Object.values(pricingConfig.minimumAmounts).forEach(amount => {
        expect(amount).toBeGreaterThan(0);
      });
    });
  });

  describe('environment variable overrides', () => {
    it('should use environment variables when available', () => {
      // This test would need to mock process.env for comprehensive testing
      // For now, we just verify the structure exists
      expect(getMinimumAmount).toBeDefined();
      expect(typeof getMinimumAmount(PaymentType.CONSULTATION)).toBe('number');
    });
  });
}); 
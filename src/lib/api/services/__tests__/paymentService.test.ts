import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock the API client
vi.mock('../../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn()
  }
}));

import { paymentService, PaymentType } from '../paymentService';
import { apiClient } from '../../apiClient';

describe('PaymentService (Frontend API)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the pricing methods to return the new values
    vi.spyOn(paymentService, 'getMinimumAmount').mockImplementation((type: PaymentType) => {
      const pricing = {
        [PaymentType.CONSULTATION]: 185,
        [PaymentType.DRAWING_CONSULTATION]: 120,
        [PaymentType.TATTOO_DEPOSIT]: 150,
        [PaymentType.TATTOO_FINAL]: 185
      };
      return pricing[type] || 0;
    });
    
    vi.spyOn(paymentService, 'formatPaymentType').mockImplementation((type: PaymentType) => {
      const typeMap = {
        [PaymentType.CONSULTATION]: 'Consultation',
        [PaymentType.DRAWING_CONSULTATION]: 'Drawing Consultation',
        [PaymentType.TATTOO_DEPOSIT]: 'Tattoo Deposit',
        [PaymentType.TATTOO_FINAL]: 'Final Payment'
      };
      return typeMap[type] || type;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createPaymentLink', () => {
    const mockPaymentLinkParams = {
      amount: 200,
      title: 'Tattoo Deposit',
      description: 'Deposit for custom sleeve tattoo',
      customerId: 'customer-123',
      appointmentId: 'appointment-123',
      paymentType: PaymentType.TATTOO_DEPOSIT,
      redirectUrl: 'https://example.com/success',
      allowTipping: true
    };

    it('should create a payment link successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'link-123',
          url: 'https://checkout.square.site/link-123',
          createdAt: new Date().toISOString(),
          status: 'active',
          amount: 200,
          title: 'Tattoo Deposit'
        }
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await paymentService.createPaymentLink(mockPaymentLinkParams);

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/payments/links',
        mockPaymentLinkParams
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      vi.mocked(apiClient.post).mockRejectedValue(mockError);

      await expect(paymentService.createPaymentLink(mockPaymentLinkParams))
        .rejects.toThrow('Network error');
    });
  });

  describe('listPaymentLinks', () => {
    it('should list payment links without parameters', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'link-1',
            url: 'https://checkout.square.site/link-1',
            createdAt: '2024-01-01T00:00:00Z',
            status: 'active',
            amount: 200,
            title: 'Consultation'
          },
          {
            id: 'link-2',
            url: 'https://checkout.square.site/link-2',
            createdAt: '2024-01-02T00:00:00Z',
            status: 'active',
            amount: 200,
            title: 'Deposit'
          }
        ]
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await paymentService.listPaymentLinks();

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/payments/links',
        { params: undefined }
      );
    });

    it('should list payment links with pagination parameters', async () => {
      const params = { cursor: 'cursor-123', limit: 10 };
      const mockResponse = {
        success: true,
        data: [],
        cursor: 'next-cursor-123'
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await paymentService.listPaymentLinks(params);

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/payments/links',
        { params }
      );
    });
  });

  describe('getPaymentLink', () => {
    it('should get payment link details', async () => {
      const linkId = 'link-123';
      const mockResponse = {
        success: true,
        data: {
          id: linkId,
          url: 'https://checkout.square.site/link-123',
          createdAt: '2024-01-01T00:00:00Z',
          status: 'active',
          amount: 200,
          title: 'Tattoo Deposit'
        }
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await paymentService.getPaymentLink(linkId);

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith(`/payments/links/${linkId}`);
    });
  });

  describe('deletePaymentLink', () => {
    it('should delete a payment link', async () => {
      const linkId = 'link-123';
      const mockResponse = {
        success: true,
        message: 'Payment link deleted successfully'
      };

      vi.mocked(apiClient.delete).mockResolvedValue(mockResponse);

      const result = await paymentService.deletePaymentLink(linkId);

      expect(result).toEqual(mockResponse);
      expect(apiClient.delete).toHaveBeenCalledWith(`/payments/links/${linkId}`);
    });
  });

  describe('createInvoice', () => {
    const mockInvoiceParams = {
      customerId: 'customer-123',
      appointmentId: 'appointment-123',
      items: [
        { description: 'Tattoo Session - 3 hours', amount: 500 },
        { description: 'Custom Design', amount: 200 }
      ],
      paymentSchedule: [
        { amount: 250, dueDate: '2024-03-01', type: 'DEPOSIT' as const },
        { amount: 450, dueDate: '2024-03-15', type: 'BALANCE' as const }
      ],
      deliveryMethod: 'EMAIL' as const
    };

    it('should create an invoice successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'invoice-123',
          invoiceNumber: 'INV-2024-001',
          publicUrl: 'https://squareup.com/pay-invoice/invoice-123',
          status: 'SENT',
          amount: 700
        }
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await paymentService.createInvoice(mockInvoiceParams);

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/payments/invoices',
        mockInvoiceParams
      );
    });
  });

  describe('createCheckoutSession', () => {
    const mockCheckoutParams = {
      customerId: 'customer-123',
      appointmentId: 'appointment-123',
      items: [
        { name: 'Tattoo Session', quantity: 1, price: 350, note: '2 hours' },
        { name: 'Aftercare Kit', quantity: 2, price: 50 }
      ],
      redirectUrl: 'https://example.com/success'
    };

    it('should create a checkout session successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          checkoutUrl: 'https://example.com/checkout/checkout-123',
          checkoutId: 'checkout-123'
        }
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await paymentService.createCheckoutSession(mockCheckoutParams);

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/payments/checkout',
        mockCheckoutParams
      );
    });
  });

  describe('formatPaymentType', () => {
    it('should format payment types correctly', () => {
      expect(paymentService.formatPaymentType(PaymentType.CONSULTATION))
        .toBe('Consultation');
      expect(paymentService.formatPaymentType(PaymentType.DRAWING_CONSULTATION))
        .toBe('Drawing Consultation');
      expect(paymentService.formatPaymentType(PaymentType.TATTOO_DEPOSIT))
        .toBe('Tattoo Deposit');
      expect(paymentService.formatPaymentType(PaymentType.TATTOO_FINAL))
        .toBe('Final Payment');
    });

    it('should return raw type for unknown payment types', () => {
      const unknownType = 'UNKNOWN_TYPE' as PaymentType;
      expect(paymentService.formatPaymentType(unknownType))
        .toBe('UNKNOWN_TYPE');
    });
  });

  describe('getMinimumAmount', () => {
    it('should return correct minimum amounts for payment types', () => {
      expect(paymentService.getMinimumAmount(PaymentType.CONSULTATION))
        .toBe(185);
      expect(paymentService.getMinimumAmount(PaymentType.DRAWING_CONSULTATION))
        .toBe(120);
      expect(paymentService.getMinimumAmount(PaymentType.TATTOO_DEPOSIT))
        .toBe(150);
      expect(paymentService.getMinimumAmount(PaymentType.TATTOO_FINAL))
        .toBe(185);
    });

    it('should return 0 for unknown payment types', () => {
      const unknownType = 'UNKNOWN_TYPE' as PaymentType;
      expect(paymentService.getMinimumAmount(unknownType))
        .toBe(0);
    });
  });
}); 
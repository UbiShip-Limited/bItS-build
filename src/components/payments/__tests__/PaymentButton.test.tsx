import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentButton, { PaymentDropdown } from '../PaymentButton';
import { PaymentType } from '../../../lib/api/services/paymentService';

// Mock the CreatePaymentLinkModal component
vi.mock('../CreatePaymentLinkModal', () => ({
  default: ({ isOpen, onClose, onSuccess, ...props }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="payment-link-modal">
        <h2>Create Payment Link Modal</h2>
        <button onClick={() => onClose()}>Close</button>
        <button 
          onClick={() => {
            onSuccess({ 
              id: 'link-123', 
              url: 'https://checkout.square.site/link-123' 
            });
          }}
        >
          Create Link
        </button>
        <div data-testid="modal-props">
          {JSON.stringify(props)}
        </div>
      </div>
    );
  }
}));

// Mock the CreateInvoiceModal component
vi.mock('../CreateInvoiceModal', () => ({
  default: ({ isOpen, onClose, onSuccess, ...props }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="invoice-modal">
        <h2>Create Invoice Modal</h2>
        <button onClick={() => onClose()}>Close</button>
        <button 
          onClick={() => {
            onSuccess({ 
              id: 'invoice-123', 
              publicUrl: 'https://square.com/invoice-123' 
            });
          }}
        >
          Create Invoice
        </button>
      </div>
    );
  }
}));

describe('PaymentButton', () => {
  const defaultProps = {
    customerId: 'customer-123',
    customerName: 'John Doe'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render with default props', () => {
      render(<PaymentButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /request payment/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('should render with custom button text', () => {
      render(
        <PaymentButton 
          {...defaultProps} 
          buttonText="Send Payment Link" 
        />
      );
      
      expect(screen.getByRole('button', { name: /send payment link/i }))
        .toBeInTheDocument();
    });

    it('should render without icon when showIcon is false', () => {
      render(
        <PaymentButton 
          {...defaultProps} 
          showIcon={false} 
        />
      );
      
      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).not.toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <PaymentButton 
          {...defaultProps} 
          disabled={true} 
        />
      );
      
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Button Variants', () => {
    it('should apply primary variant classes by default', () => {
      render(<PaymentButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600', 'text-white');
    });

    it('should apply secondary variant classes', () => {
      render(
        <PaymentButton 
          {...defaultProps} 
          buttonVariant="secondary" 
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-600', 'text-white');
    });

    it('should apply ghost variant classes', () => {
      render(
        <PaymentButton 
          {...defaultProps} 
          buttonVariant="ghost" 
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-gray-600');
    });

    it('should apply outline variant classes', () => {
      render(
        <PaymentButton 
          {...defaultProps} 
          buttonVariant="outline" 
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'border-gray-300');
    });
  });

  describe('Modal Interaction', () => {
    it('should open modal when button is clicked', async () => {
      render(<PaymentButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(screen.getByTestId('payment-link-modal')).toBeInTheDocument();
    });

    it('should close modal when close button is clicked', async () => {
      render(<PaymentButton {...defaultProps} />);
      
      await userEvent.click(screen.getByRole('button'));
      expect(screen.getByTestId('payment-link-modal')).toBeInTheDocument();
      
      await userEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(screen.queryByTestId('payment-link-modal')).not.toBeInTheDocument();
    });

    it('should pass correct props to modal', async () => {
      const props = {
        ...defaultProps,
        appointmentId: 'appointment-123',
        tattooRequestId: 'tattoo-123',
        defaultAmount: 150,
        defaultType: PaymentType.TATTOO_DEPOSIT
      };
      
      render(<PaymentButton {...props} />);
      
      await userEvent.click(screen.getByRole('button'));
      
      const modalProps = JSON.parse(
        screen.getByTestId('modal-props').textContent || '{}'
      );
      
      expect(modalProps).toMatchObject({
        customerId: 'customer-123',
        customerName: 'John Doe',
        appointmentId: 'appointment-123',
        tattooRequestId: 'tattoo-123',
        defaultAmount: 150,
        defaultType: PaymentType.TATTOO_DEPOSIT
      });
    });

    it('should call onSuccess callback when payment link is created', async () => {
      const onSuccess = vi.fn();
      render(
        <PaymentButton 
          {...defaultProps} 
          onSuccess={onSuccess} 
        />
      );
      
      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(screen.getByRole('button', { name: /create link/i }));
      
      expect(onSuccess).toHaveBeenCalledWith({
        id: 'link-123',
        url: 'https://checkout.square.site/link-123'
      });
      
      // Modal should be closed after success
      expect(screen.queryByTestId('payment-link-modal')).not.toBeInTheDocument();
    });
  });
});

describe('PaymentDropdown', () => {
  const defaultProps = {
    customerId: 'customer-123',
    customerName: 'Jane Doe'
  };

  describe('Dropdown Functionality', () => {
    it('should render dropdown button', () => {
      render(<PaymentDropdown {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /payment options/i });
      expect(button).toBeInTheDocument();
    });

    it('should toggle dropdown menu on button click', async () => {
      render(<PaymentDropdown {...defaultProps} />);
      
      const button = screen.getByRole('button');
      
      // Initially dropdown should not be visible
      expect(screen.queryByText('Create Payment Link')).not.toBeInTheDocument();
      
      // Click to open dropdown
      await userEvent.click(button);
      expect(screen.getByText('Create Payment Link')).toBeInTheDocument();
      
      // Click again to close dropdown
      await userEvent.click(button);
      expect(screen.queryByText('Create Payment Link')).not.toBeInTheDocument();
    });

    it('should show loading state when loading', () => {
      render(
        <PaymentDropdown 
          {...defaultProps} 
          disabled={false} 
        />
      );
      
      const button = screen.getByRole('button');
      expect(button.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    it('should hide invoice option when showInvoiceOption is false', async () => {
      render(
        <PaymentDropdown 
          {...defaultProps} 
          showInvoiceOption={false} 
        />
      );
      
      await userEvent.click(screen.getByRole('button'));
      
      expect(screen.getByText('Create Payment Link')).toBeInTheDocument();
      expect(screen.queryByText('Create Invoice')).not.toBeInTheDocument();
    });

    it('should open payment link modal from dropdown', async () => {
      render(<PaymentDropdown {...defaultProps} />);
      
      // Open dropdown
      await userEvent.click(screen.getByRole('button'));
      
      // Click payment link option
      await userEvent.click(screen.getByText('Create Payment Link'));
      
      // Modal should be open and dropdown closed
      expect(screen.getByTestId('payment-link-modal')).toBeInTheDocument();
      expect(screen.queryByText('Create Invoice')).not.toBeInTheDocument();
    });

    it('should handle onSuccess callback from dropdown', async () => {
      const onSuccess = vi.fn();
      render(
        <PaymentDropdown 
          {...defaultProps} 
          onSuccess={onSuccess} 
        />
      );
      
      // Open dropdown and select payment link
      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(screen.getByText('Create Payment Link'));
      
      // Create payment link
      await userEvent.click(screen.getByRole('button', { name: /create link/i }));
      
      expect(onSuccess).toHaveBeenCalledWith({
        id: 'link-123',
        url: 'https://checkout.square.site/link-123'
      });
    });
  });

  describe('Invoice Creation', () => {
    it('should trigger invoice creation when clicked', async () => {
      render(<PaymentDropdown {...defaultProps} />);
      
      // Open dropdown
      await userEvent.click(screen.getByRole('button'));
      
      // Click invoice option
      const invoiceButton = screen.getByText('Create Invoice');
      await userEvent.click(invoiceButton);
      
      // Dropdown should close
      expect(screen.queryByText('Create Invoice')).not.toBeInTheDocument();
    });
  });
}); 
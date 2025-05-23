import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TattooRequestForm from '../../components/forms/TattooRequestForm';
import useTattooRequestForm from '../../hooks/useTattooRequestForm';

// Mock the custom hook
jest.mock('../../hooks/useTattooRequestForm');

describe('TattooRequestForm Component', () => {
  // Default mock implementation
  const mockHook = {
    formData: {
      contactEmail: '',
      contactPhone: '',
      description: '',
      placement: '',
      size: '',
      colorPreference: '',
      style: '',
      referenceImages: [],
      purpose: '',
      preferredArtist: '',
      timeframe: '',
      contactPreference: 'email',
      additionalNotes: ''
    },
    isLoading: false,
    isUploading: false,
    error: null,
    success: false,
    response: null,
    validationErrors: null,
    handleInputChange: jest.fn(),
    uploadImages: jest.fn(),
    submitRequest: jest.fn(),
    resetForm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTattooRequestForm as jest.Mock).mockReturnValue(mockHook);
  });

  it('renders the form with initial step', () => {
    render(<TattooRequestForm />);
    
    // Check that the form title is rendered
    expect(screen.getByText('Tattoo Request Form')).toBeInTheDocument();
    
    // Check that initial step content is visible
    expect(screen.getByText(/fill out the form below/i)).toBeInTheDocument();
  });

  it('shows next button in the first step', () => {
    render(<TattooRequestForm />);
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeInTheDocument();
  });

  it('navigates to second step when Next is clicked and validation passes', () => {
    // Mock data to pass validation for first step
    const validFirstStepMock = {
      ...mockHook,
      formData: {
        ...mockHook.formData,
        purpose: 'First tattoo',
        contactEmail: 'test@example.com'
      }
    };
    (useTattooRequestForm as jest.Mock).mockReturnValue(validFirstStepMock);
    
    render(<TattooRequestForm />);
    
    // Click Next button
    fireEvent.click(screen.getByText('Next'));
    
    // Should show second step content
    expect(screen.getByText(/Describe your tattoo idea/i)).toBeInTheDocument();
  });

  it('stays on first step if validation fails', () => {
    // Default mock with empty fields won't pass validation
    render(<TattooRequestForm />);
    
    // Click Next button
    fireEvent.click(screen.getByText('Next'));
    
    // Should still be on first step
    expect(screen.getByText(/What is the purpose of this tattoo?/i)).toBeInTheDocument();
  });

  it('submits the form on the final step', async () => {
    // Mock successful form data
    const validFormMock = {
      ...mockHook,
      formData: {
        ...mockHook.formData,
        purpose: 'First tattoo',
        contactEmail: 'test@example.com',
        description: 'Test description',
        placement: 'Arm',
        size: 'Medium',
      }
    };
    (useTattooRequestForm as jest.Mock).mockReturnValue(validFormMock);
    
    render(<TattooRequestForm />);
    
    // Navigate to second step
    fireEvent.click(screen.getByText('Next'));
    
    // Navigate to final step
    fireEvent.click(screen.getByText('Next'));
    
    // Now we should see the submit button
    const submitButton = screen.getByText('Submit Request');
    expect(submitButton).toBeInTheDocument();
    
    // Click submit
    fireEvent.click(submitButton);
    
    // Check if submitRequest was called
    expect(mockHook.submitRequest).toHaveBeenCalled();
  });

  it('shows loading state during submission', () => {
    // Mock loading state
    const loadingMock = {
      ...mockHook,
      isLoading: true,
      formData: {
        ...mockHook.formData,
        purpose: 'First tattoo',
        contactEmail: 'test@example.com',
        description: 'Test description',
        placement: 'Arm',
        size: 'Medium',
      }
    };
    (useTattooRequestForm as jest.Mock).mockReturnValue(loadingMock);
    
    render(<TattooRequestForm />);
    
    // Navigate to final step
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    
    // Should show loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows success page after successful submission', () => {
    // Mock success state
    const successMock = {
      ...mockHook,
      success: true,
      response: {
        id: 'test-123',
        description: 'Test tattoo',
        trackingToken: 'ABC123'
      }
    };
    (useTattooRequestForm as jest.Mock).mockReturnValue(successMock);
    
    render(<TattooRequestForm />);
    
    // Should show success message
    expect(screen.getByText(/Thank you for your tattoo request!/i)).toBeInTheDocument();
  });

  it('shows error message when there is an error', () => {
    // Mock error state
    const errorMock = {
      ...mockHook,
      error: 'Something went wrong'
    };
    (useTattooRequestForm as jest.Mock).mockReturnValue(errorMock);
    
    render(<TattooRequestForm />);
    
    // Should show error message
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
import { renderHook, act } from '@testing-library/react-hooks';
import useTattooRequestForm from '../../hooks/useTattooRequestForm';

// Mock global fetch
global.fetch = jest.fn();

describe('useTattooRequestForm Hook', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useTattooRequestForm());
    
    expect(result.current.formData).toEqual({
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
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(false);
  });

  it('should update form data when handleInputChange is called', () => {
    const { result } = renderHook(() => useTattooRequestForm());
    
    act(() => {
      result.current.handleInputChange({
        target: { name: 'contactEmail', value: 'test@example.com' }
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    expect(result.current.formData.contactEmail).toBe('test@example.com');
  });

  it('should validate form and set validation errors', () => {
    const { result } = renderHook(() => useTattooRequestForm());
    
    // Try to submit an empty form
    act(() => {
      result.current.submitRequest();
    });
    
    // Check that validation errors were set
    expect(result.current.validationErrors).not.toBeNull();
    expect(result.current.validationErrors?.contactEmail).toBeDefined();
    expect(result.current.validationErrors?.description).toBeDefined();
  });

  it('should upload images successfully', async () => {
    // Mock successful fetch response for image upload
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        images: [
          { url: 'https://example.com/image.jpg', publicId: 'test123', originalName: 'test.jpg' }
        ] 
      })
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useTattooRequestForm());
    
    const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    act(() => {
      result.current.uploadImages([testFile]);
    });
    
    expect(result.current.isUploading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.isUploading).toBe(false);
    expect(result.current.formData.referenceImages.length).toBe(1);
    expect(result.current.formData.referenceImages[0].url).toBe('https://example.com/image.jpg');
    
    // Verify correct endpoint was called
    expect(global.fetch).toHaveBeenCalledWith('/tattoo-requests/upload-images', expect.any(Object));
  });

  it('should handle image upload errors', async () => {
    // Mock failed fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Upload failed' })
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useTattooRequestForm());
    
    const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    act(() => {
      result.current.uploadImages([testFile]);
    });
    
    await waitForNextUpdate();
    
    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBe('Failed to upload images');
  });

  it('should submit form data successfully', async () => {
    // Fill in required form fields
    const { result } = renderHook(() => useTattooRequestForm());
    
    act(() => {
      result.current.handleInputChange({ target: { name: 'contactEmail', value: 'test@example.com' } } as any);
      result.current.handleInputChange({ target: { name: 'description', value: 'Test description that is long enough' } } as any);
      result.current.handleInputChange({ target: { name: 'placement', value: 'Arm' } } as any);
      result.current.handleInputChange({ target: { name: 'size', value: 'Medium' } } as any);
      result.current.handleInputChange({ target: { name: 'purpose', value: 'First tattoo' } } as any);
    });
    
    // Mock successful submission
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        id: 'test-123', 
        description: 'Test description that is long enough',
        trackingToken: 'ABC123' 
      })
    });
    
    act(() => {
      result.current.submitRequest();
    });
    
    expect(result.current.isLoading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.success).toBe(true);
    expect(result.current.response).toEqual(expect.objectContaining({
      id: 'test-123',
      trackingToken: 'ABC123'
    }));
    
    // Verify correct endpoint and data
    expect(global.fetch).toHaveBeenCalledWith('/tattoo-requests', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json'
      })
    }));
  });

  it('should handle submission errors', async () => {
    // Fill in required form fields
    const { result } = renderHook(() => useTattooRequestForm());
    
    act(() => {
      result.current.handleInputChange({ target: { name: 'contactEmail', value: 'test@example.com' } } as any);
      result.current.handleInputChange({ target: { name: 'description', value: 'Test description that is long enough' } } as any);
      result.current.handleInputChange({ target: { name: 'placement', value: 'Arm' } } as any);
      result.current.handleInputChange({ target: { name: 'size', value: 'Medium' } } as any);
      result.current.handleInputChange({ target: { name: 'purpose', value: 'First tattoo' } } as any);
    });
    
    // Mock error response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' })
    });
    
    act(() => {
      result.current.submitRequest();
    });
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe('Server error');
  });
});
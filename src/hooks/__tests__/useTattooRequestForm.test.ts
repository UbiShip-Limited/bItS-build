import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock all dependencies before importing the hook using vi.hoisted()
const mockTattooRequestClient = vi.hoisted(() => ({
  create: vi.fn()
}));

const mockApiClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
}));

const mockUploadToCloudinary = vi.hoisted(() => vi.fn());

// Mock the API client
vi.mock('../../lib/api/apiClient', () => ({
  apiClient: mockApiClient
}));

// Mock the TattooRequestApiClient
vi.mock('../../lib/api/services/tattooRequestApiClient', () => ({
  TattooRequestApiClient: vi.fn().mockImplementation(() => mockTattooRequestClient)
}));

// Mock the ImageUploadService
const mockImageUploadService = vi.hoisted(() => ({
  uploadImage: vi.fn()
}));

vi.mock('../../lib/api/services/ImageUploadService', () => ({
  ImageUploadService: vi.fn().mockImplementation(() => mockImageUploadService)
}));

// Mock useCloudinaryUpload hook (kept for backward compatibility if still used somewhere)
vi.mock('../useCloudinaryUpload', () => ({
  useCloudinaryUpload: () => ({
    uploadToCloudinary: mockUploadToCloudinary,
    isUploading: false
  })
}));

// Import the hook after mocks are set up
import useTattooRequestForm from '../useTattooRequestForm';

describe('useTattooRequestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockTattooRequestClient.create.mockResolvedValue({
      id: 'test-request-123',
      contactEmail: 'test@example.com',
      description: 'Test description',
      status: 'new',
      trackingToken: 'track-123'
    });

    // Mock individual image upload responses
    mockImageUploadService.uploadImage.mockResolvedValue({
      url: 'http://example.com/image.jpg',
      publicId: 'test-public-id'
    });
    
    mockUploadToCloudinary.mockResolvedValue([
      {
        url: 'http://example.com/image.jpg',
        publicId: 'test-public-id'
      }
    ]);
  });

  it('should initialize with empty form data', () => {
    const { result } = renderHook(() => useTattooRequestForm());

    expect(result.current.formData).toEqual({
      firstName: '',
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
    expect(result.current.error).toBe(null);
    expect(result.current.success).toBe(false);
  });

  it('should handle input changes correctly', () => {
    const { result } = renderHook(() => useTattooRequestForm());

    act(() => {
      result.current.handleInputChange({
        target: {
          name: 'contactEmail',
          value: 'test@example.com'
        }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.contactEmail).toBe('test@example.com');
  });

  it('should validate form data before submission', async () => {
    const { result } = renderHook(() => useTattooRequestForm());

    // Try to submit with empty required fields
    await act(async () => {
      await result.current.submitRequest();
    });

    expect(result.current.validationErrors).toBeDefined();
    expect(result.current.validationErrors?.contactEmail).toBeTruthy();
    expect(result.current.validationErrors?.description).toBeTruthy();
    expect(result.current.validationErrors?.placement).toBeTruthy();
    expect(result.current.validationErrors?.size).toBeTruthy();
    expect(result.current.validationErrors?.purpose).toBeTruthy();
  });

  it('should submit successfully with valid data', async () => {
    const { result } = renderHook(() => useTattooRequestForm());

    // Fill in valid form data
    act(() => {
      result.current.handleInputChange({
        target: { name: 'contactEmail', value: 'test@example.com' }
      } as React.ChangeEvent<HTMLInputElement>);

      result.current.handleInputChange({
        target: { name: 'description', value: 'This is a valid description that is long enough' }
      } as React.ChangeEvent<HTMLInputElement>);

      result.current.handleInputChange({
        target: { name: 'placement', value: 'arm' }
      } as React.ChangeEvent<HTMLInputElement>);

      result.current.handleInputChange({
        target: { name: 'size', value: 'medium' }
      } as React.ChangeEvent<HTMLInputElement>);

      result.current.handleInputChange({
        target: { name: 'purpose', value: 'personal' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Submit the form
    await act(async () => {
      await result.current.submitRequest();
    });

    await waitFor(() => {
      expect(result.current.success).toBe(true);
      expect(result.current.response).toBeDefined();
      expect(result.current.response?.id).toBe('test-request-123');
      expect(result.current.error).toBe(null);
    });

    expect(mockTattooRequestClient.create).toHaveBeenCalledWith(
      expect.objectContaining({
        contactEmail: 'test@example.com',
        description: 'This is a valid description that is long enough',
        placement: 'arm',
        size: 'medium',
        purpose: 'personal'
      })
    );
  });

  it('should handle submission errors', async () => {
    const { result } = renderHook(() => useTattooRequestForm());

    // Mock API error
    mockTattooRequestClient.create.mockRejectedValueOnce(new Error('API Error'));

    // Fill in valid form data
    act(() => {
      result.current.handleInputChange({
        target: { name: 'contactEmail', value: 'test@example.com' }
      } as React.ChangeEvent<HTMLInputElement>);

      result.current.handleInputChange({
        target: { name: 'description', value: 'This is a valid description that is long enough' }
      } as React.ChangeEvent<HTMLInputElement>);

      result.current.handleInputChange({
        target: { name: 'placement', value: 'arm' }
      } as React.ChangeEvent<HTMLInputElement>);

      result.current.handleInputChange({
        target: { name: 'size', value: 'medium' }
      } as React.ChangeEvent<HTMLInputElement>);

      result.current.handleInputChange({
        target: { name: 'purpose', value: 'personal' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Submit the form
    await act(async () => {
      await result.current.submitRequest();
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.success).toBe(false);
    });
  });

  it('should upload images correctly', async () => {
    const { result } = renderHook(() => useTattooRequestForm());

    const mockFiles = [
      new File([''], 'test1.jpg', { type: 'image/jpeg' }),
      new File([''], 'test2.jpg', { type: 'image/jpeg' })
    ];

    // Mock multiple successful uploads
    mockImageUploadService.uploadImage
      .mockResolvedValueOnce({
        url: 'http://example.com/image1.jpg',
        publicId: 'test-public-id-1'
      })
      .mockResolvedValueOnce({
        url: 'http://example.com/image2.jpg',
        publicId: 'test-public-id-2'
      });

    await act(async () => {
      await result.current.uploadImages(mockFiles);
    });

    await waitFor(() => {
      expect(result.current.formData.referenceImages).toHaveLength(2);
      expect(result.current.formData.referenceImages[0]).toEqual({
        url: 'http://example.com/image1.jpg',
        file: mockFiles[0],
        publicId: 'test-public-id-1'
      });
      expect(result.current.formData.referenceImages[1]).toEqual({
        url: 'http://example.com/image2.jpg',
        file: mockFiles[1],
        publicId: 'test-public-id-2'
      });
    });

    // Should call uploadImage once for each file
    expect(mockImageUploadService.uploadImage).toHaveBeenCalledTimes(2);
    expect(mockImageUploadService.uploadImage).toHaveBeenCalledWith(mockFiles[0]);
    expect(mockImageUploadService.uploadImage).toHaveBeenCalledWith(mockFiles[1]);
  });

  it('should reset form correctly', () => {
    const { result } = renderHook(() => useTattooRequestForm());

    // Modify form data
    act(() => {
      result.current.handleInputChange({
        target: { name: 'contactEmail', value: 'test@example.com' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.contactEmail).toBe('test@example.com');

    // Reset form
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData.contactEmail).toBe('');
    expect(result.current.formData.firstName).toBe('');
    expect(result.current.error).toBe(null);
    expect(result.current.success).toBe(false);
    expect(result.current.validationErrors).toBe(null);
  });

  it('should clear validation errors when editing fields', async () => {
    const { result } = renderHook(() => useTattooRequestForm());

    // Trigger validation errors by submitting empty form
    await act(async () => {
      await result.current.submitRequest();
    });

    expect(result.current.validationErrors?.contactEmail).toBeTruthy();

    // Edit the field that had an error
    act(() => {
      result.current.handleInputChange({
        target: { name: 'contactEmail', value: 'test@example.com' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.validationErrors?.contactEmail).toBeFalsy();
  });

  it('should validate email format', async () => {
    const { result } = renderHook(() => useTattooRequestForm());

    // Fill in form with invalid email
    act(() => {
      result.current.handleInputChange({
        target: { name: 'contactEmail', value: 'invalid-email' }
      } as React.ChangeEvent<HTMLInputElement>);

      result.current.handleInputChange({
        target: { name: 'description', value: 'This is a valid description that is long enough' }
      } as React.ChangeEvent<HTMLInputElement>);

      result.current.handleInputChange({
        target: { name: 'placement', value: 'arm' }
      } as React.ChangeEvent<HTMLInputElement>);

      result.current.handleInputChange({
        target: { name: 'size', value: 'medium' }
      } as React.ChangeEvent<HTMLInputElement>);

      result.current.handleInputChange({
        target: { name: 'purpose', value: 'personal' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.submitRequest();
    });

    expect(result.current.validationErrors?.contactEmail).toBeTruthy();
    expect(result.current.validationErrors?.contactEmail).toContain('valid email');
  });

  it('should validate description length', async () => {
    const { result } = renderHook(() => useTattooRequestForm());

    // Fill in form with short description
    act(() => {
      result.current.handleInputChange({
        target: { name: 'contactEmail', value: 'test@example.com' }
      } as React.ChangeEvent<HTMLInputElement>);

      result.current.handleInputChange({
        target: { name: 'description', value: 'short' }
      } as React.ChangeEvent<HTMLInputElement>);

      result.current.handleInputChange({
        target: { name: 'placement', value: 'arm' }
      } as React.ChangeEvent<HTMLInputElement>);

      result.current.handleInputChange({
        target: { name: 'size', value: 'medium' }
      } as React.ChangeEvent<HTMLInputElement>);

      result.current.handleInputChange({
        target: { name: 'purpose', value: 'personal' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.submitRequest();
    });

    expect(result.current.validationErrors?.description).toBeTruthy();
    expect(result.current.validationErrors?.description).toContain('10 characters');
  });
}); 
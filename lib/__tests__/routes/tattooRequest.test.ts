import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { renderHook, act } from '@testing-library/react-hooks';
import useTattooRequestForm from '../../../src/hooks/useTattooRequestForm';

// Setup mock server
const server = setupServer(
  // Mock the upload endpoint
  rest.post('/tattoo-requests/upload-images', (req, res, ctx) => {
    return res(
      ctx.json({
        images: [
          {
            url: 'https://example.com/uploaded-image.jpg',
            publicId: 'test123',
            originalName: 'test-image.jpg'
          }
        ]
      })
    );
  }),
  
  // Mock the tattoo request submission endpoint
  rest.post('/tattoo-requests', (req, res, ctx) => {
    const requestBody = req.body as any;
    
    // Validate request
    if (!requestBody.contactEmail || !requestBody.description) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Missing required fields' })
      );
    }
    
    return res(
      ctx.json({
        id: '12345',
        description: requestBody.description,
        trackingToken: 'TRACK123',
        status: 'new',
        createdAt: new Date().toISOString()
      })
    );
  })
);

// Start server before all tests
beforeAll(() => server.listen());
// Reset after each test
afterEach(() => server.resetHandlers());
// Close server after all tests
afterAll(() => server.close());

describe('TattooRequest Integration Tests', () => {
  it('successfully uploads images to the backend', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useTattooRequestForm());
    
    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    
    act(() => {
      result.current.uploadImages([file]);
    });
    
    // Wait for upload to complete
    await waitForNextUpdate();
    
    expect(result.current.isUploading).toBe(false);
    expect(result.current.formData.referenceImages.length).toBe(1);
    expect(result.current.formData.referenceImages[0].url).toBe('https://example.com/uploaded-image.jpg');
    expect(result.current.formData.referenceImages[0].publicId).toBe('test123');
  });
  
  it('successfully submits the tattoo request form', async () => {
    const { result } = renderHook(() => useTattooRequestForm());
    
    // Fill out form with valid data
    act(() => {
      result.current.handleInputChange({ target: { name: 'contactEmail', value: 'test@example.com' } } as any);
      result.current.handleInputChange({ target: { name: 'description', value: 'Test tattoo description' } } as any);
      result.current.handleInputChange({ target: { name: 'placement', value: 'Arm' } } as any);
      result.current.handleInputChange({ target: { name: 'size', value: 'Medium' } } as any);
      result.current.handleInputChange({ target: { name: 'purpose', value: 'First tattoo' } } as any);
    });
    
    // Submit the form
    act(() => {
      result.current.submitRequest();
    });
    
    // Wait for submission to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.success).toBe(true);
    expect(result.current.response?.id).toBe('12345');
    expect(result.current.response?.trackingToken).toBe('TRACK123');
  });
  
  it('handles backend validation errors', async () => {
    // Override the handler to simulate validation error
    server.use(
      rest.post('/tattoo-requests', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({ error: 'Invalid email format' })
        );
      })
    );
    
    const { result } = renderHook(() => useTattooRequestForm());
    
    // Fill out form with valid data according to frontend but invalid for backend
    act(() => {
      result.current.handleInputChange({ target: { name: 'contactEmail', value: 'test@example.com' } } as any);
      result.current.handleInputChange({ target: { name: 'description', value: 'Test tattoo description' } } as any);
      result.current.handleInputChange({ target: { name: 'placement', value: 'Arm' } } as any);
      result.current.handleInputChange({ target: { name: 'size', value: 'Medium' } } as any);
      result.current.handleInputChange({ target: { name: 'purpose', value: 'First tattoo' } } as any);
    });
    
    // Submit the form
    act(() => {
      result.current.submitRequest();
    });
    
    // Wait for submission to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe('Invalid email format');
  });
  
  it('handles network errors during submission', async () => {
    // Override the handler to simulate network error
    server.use(
      rest.post('/tattoo-requests', (req, res, ctx) => {
        return res.networkError('Failed to connect');
      })
    );
    
    const { result } = renderHook(() => useTattooRequestForm());
    
    // Fill out form with valid data
    act(() => {
      result.current.handleInputChange({ target: { name: 'contactEmail', value: 'test@example.com' } } as any);
      result.current.handleInputChange({ target: { name: 'description', value: 'Test tattoo description' } } as any);
      result.current.handleInputChange({ target: { name: 'placement', value: 'Arm' } } as any);
      result.current.handleInputChange({ target: { name: 'size', value: 'Medium' } } as any);
      result.current.handleInputChange({ target: { name: 'purpose', value: 'First tattoo' } } as any);
    });
    
    // Submit the form
    act(() => {
      result.current.submitRequest();
    });
    
    // Wait for submission to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.success).toBe(false);
    expect(result.current.error).toBeTruthy();
  });
});

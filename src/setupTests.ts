import '@testing-library/jest-dom';
import 'whatwg-fetch';

// Add ReadableStream polyfill
if (typeof ReadableStream === 'undefined') {
  (global as any).ReadableStream = class ReadableStream {
    constructor() {}
    cancel() { return Promise.resolve(); }
    getReader() { return { read: () => Promise.resolve({ done: true }) }; }
  };
}

// Simple fetch mock setup
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Default mock responses
beforeEach(() => {
  mockFetch.mockImplementation((url: string | URL | Request, options?: RequestInit) => {
    let path: string;
    if (typeof url === 'string') {
      path = url;
    } else if (url instanceof URL) {
      path = url.toString();
    } else if (url instanceof Request) {
      path = url.url;
    } else {
      path = String(url);
    }
    
    // Mock tattoo request submission
    if (path.includes('/api/tattoo-requests') && options?.method === 'POST') {
      const body = JSON.parse(options.body as string);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'tattoo-123',
          description: body.description,
          placement: body.placement,
          size: body.size,
          colorPreference: body.colorPreference || '',
          style: body.style || '',
          status: 'new',
          createdAt: new Date().toISOString(),
          trackingToken: 'TRACK-ABC123',
          referenceImages: body.referenceImages || []
        })
      });
    }
    
    // Mock image upload
    if (path.includes('/upload-images')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          images: [{
            url: 'https://example.com/image.jpg',
            publicId: 'test-public-id',
            originalName: 'test.jpg'
          }]
        })
      });
    }
    
    // Default response
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({})
    });
  });
});

// Reset mocks after each test
afterEach(() => {
  mockFetch.mockClear();
}); 
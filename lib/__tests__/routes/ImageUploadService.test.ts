import { ImageUploadService, ImageUploadResponse } from '../../../../../../src/lib/api/services/ImageUploadService';
import { ApiClient } from '../../../../../../src/lib/api/apiClient';

// Mock the ApiClient
jest.mock('../../../../lib/api/apiClient', () => {
  return {
    ApiClient: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    })),
  };
});

describe('ImageUploadService', () => {
  let service: ImageUploadService;
  let mockApiClient: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a mock API client
    mockApiClient = new ApiClient();
    
    // Create a new service instance with the mock client
    service = new ImageUploadService(mockApiClient);
  });

  describe('uploadImage', () => {
    it('should call POST with the correct URL and form data', async () => {
      // Create a test file
      const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock response
      const mockResponse: ImageUploadResponse = {
        url: 'https://example.com/test.jpg',
        publicId: 'test-id',
      };
      
      // Setup mock to return the response
      mockApiClient.post.mockResolvedValue(mockResponse);
      
      // Call the method
      const result = await service.uploadImage(testFile);
      
      // Check that the API was called correctly
      expect(mockApiClient.post).toHaveBeenCalledTimes(1);
      
      // Get the actual call arguments
      const callArgs = mockApiClient.post.mock.calls[0];
      
      // Check the URL
      expect(callArgs[0]).toBe('/api/upload');
      
      // Check that FormData was passed as second argument
      expect(callArgs[1]).toBeInstanceOf(FormData);
      
      // Check headers
      expect(callArgs[2]).toEqual({
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Check the result
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      // Create a test file
      const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      
      // Setup mock to throw an error
      const mockError = new Error('Upload failed');
      mockApiClient.post.mockRejectedValue(mockError);
      
      // Call the method and expect it to throw
      await expect(service.uploadImage(testFile)).rejects.toThrow('Upload failed');
    });
  });

  describe('uploadImages', () => {
    it('should call uploadImage for each file and return combined results', async () => {
      // Create test files
      const testFile1 = new File(['test content 1'], 'test1.jpg', { type: 'image/jpeg' });
      const testFile2 = new File(['test content 2'], 'test2.jpg', { type: 'image/jpeg' });
      
      // Mock responses
      const mockResponse1: ImageUploadResponse = {
        url: 'https://example.com/test1.jpg',
        publicId: 'test-id-1',
      };
      
      const mockResponse2: ImageUploadResponse = {
        url: 'https://example.com/test2.jpg',
        publicId: 'test-id-2',
      };
      
      // Setup mock to return the responses
      mockApiClient.post
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);
      
      // Call the method
      const result = await service.uploadImages([testFile1, testFile2]);
      
      // Check that the API was called twice
      expect(mockApiClient.post).toHaveBeenCalledTimes(2);
      
      // Check the result
      expect(result).toEqual([mockResponse1, mockResponse2]);
    });

    it('should return empty array for empty input', async () => {
      // Call the method with empty array
      const result = await service.uploadImages([]);
      
      // Check that the API was not called
      expect(mockApiClient.post).not.toHaveBeenCalled();
      
      // Check the result
      expect(result).toEqual([]);
    });

    it('should handle errors in one of multiple uploads', async () => {
      // Create test files
      const testFile1 = new File(['test content 1'], 'test1.jpg', { type: 'image/jpeg' });
      const testFile2 = new File(['test content 2'], 'test2.jpg', { type: 'image/jpeg' });
      
      // Mock response for first file
      const mockResponse1: ImageUploadResponse = {
        url: 'https://example.com/test1.jpg',
        publicId: 'test-id-1',
      };
      
      // Setup mock to return response for first file but error for second
      const mockError = new Error('Second upload failed');
      mockApiClient.post
        .mockResolvedValueOnce(mockResponse1)
        .mockRejectedValueOnce(mockError);
      
      // Call the method and expect it to throw
      await expect(service.uploadImages([testFile1, testFile2])).rejects.toThrow('Second upload failed');
    });
  });
}); 
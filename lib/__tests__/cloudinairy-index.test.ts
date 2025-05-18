process.env.NODE_ENV = 'test';

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { v2 as cloudinary } from 'cloudinary';

// Mock the cloudinary module
jest.mock('cloudinary', () => {
  return {
    v2: {
      config: jest.fn(),
      api: {
        resource: jest.fn(),
      },
      uploader: {
        upload: jest.fn(),
        destroy: jest.fn(),
      },
      utils: {
        api_sign_request: jest.fn(),
      },
      url: jest.fn(),
    },
  };
});

// Import functions after mocking
import { 
  validateUploadResult, 
  generateUploadSignature, 
  uploadImage, 
  deleteImage, 
  getTransformedImageUrl 
} from '../../cloudinary/index';

describe('Cloudinary Service', () => {
  // Store original env vars
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Setup environment variables
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore original env vars
    process.env = originalEnv;
  });
  
  describe('validateUploadResult', () => {
    it('should return image metadata when validation is successful', async () => {
      // Mock response from cloudinary
      const mockResource = {
        public_id: 'test-id',
        url: 'http://test.com/image.jpg',
        secure_url: 'https://test.com/image.jpg',
        format: 'jpg',
        width: 800,
        height: 600,
        resource_type: 'image',
        metadata: { test: 'data' }
      };
      
      // Setup the mock
      (cloudinary.api.resource as jest.Mock).mockResolvedValue(mockResource);
      
      // Call the function
      const result = await validateUploadResult('test-id');
      
      // Assertions
      expect(cloudinary.api.resource).toHaveBeenCalledWith('test-id');
      expect(result).toEqual({
        publicId: 'test-id',
        url: 'http://test.com/image.jpg',
        secureUrl: 'https://test.com/image.jpg',
        format: 'jpg',
        width: 800,
        height: 600,
        resourceType: 'image',
        metadata: { test: 'data' }
      });
    });
    
    it('should return null when validation fails', async () => {
      // Setup the mock to throw an error
      (cloudinary.api.resource as jest.Mock).mockRejectedValue(new Error('Resource not found'));
      
      // Call the function
      const result = await validateUploadResult('invalid-id');
      
      // Assertions
      expect(cloudinary.api.resource).toHaveBeenCalledWith('invalid-id');
      expect(result).toBeNull();
    });
  });
  
  describe('generateUploadSignature', () => {
    it('should generate a valid signature with timestamp', () => {
      // Setup the mock
      (cloudinary.utils.api_sign_request as jest.Mock).mockReturnValue('test-signature');
      
      // Fix the timestamp for testing
      const timestamp = 1612345678;
      
      // Call the function
      const result = generateUploadSignature({ folder: 'test-folder' }, timestamp);
      
      // Assertions
      expect(cloudinary.utils.api_sign_request).toHaveBeenCalledWith(
        { folder: 'test-folder', timestamp }, 
        'test-secret'
      );
      expect(result).toEqual({
        signature: 'test-signature',
        timestamp,
        apiKey: 'test-key',
        cloudName: 'test-cloud'
      });
    });
  });
  
  describe('uploadImage', () => {
    it('should upload an image successfully', async () => {
      // Mock the uploader response
      const mockUploadResult = {
        public_id: 'test/image-id',
        url: 'http://test.com/image.jpg',
        secure_url: 'https://test.com/image.jpg',
        format: 'jpg',
        width: 1000,
        height: 800,
        resource_type: 'image'
      };
      
      // Setup the mock
      (cloudinary.uploader.upload as jest.Mock).mockResolvedValue(mockUploadResult);
      
      // Call the function
      const result = await uploadImage('path/to/local/image.jpg', 'test-folder', ['tag1', 'tag2']);
      
      // Assertions
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith('path/to/local/image.jpg', {
        folder: 'test-folder',
        tags: ['tag1', 'tag2'],
        resource_type: 'image'
      });
      expect(result).toEqual({
        publicId: 'test/image-id',
        url: 'http://test.com/image.jpg',
        secureUrl: 'https://test.com/image.jpg',
        format: 'jpg',
        width: 1000,
        height: 800,
        resourceType: 'image',
        metadata: {}
      });
    });
    
    it('should return null when upload fails', async () => {
      // Setup the mock to throw an error
      (cloudinary.uploader.upload as jest.Mock).mockRejectedValue(new Error('Upload failed'));
      
      // Call the function
      const result = await uploadImage('invalid/path.jpg');
      
      // Assertions
      expect(cloudinary.uploader.upload).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
  
  describe('deleteImage', () => {
    it('should delete an image successfully', async () => {
      // Mock the destroy response
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });
      
      // Call the function
      const result = await deleteImage('test-id');
      
      // Assertions
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test-id');
      expect(result).toBe(true);
    });
    
    it('should return false when deletion fails', async () => {
      // Mock the failed destroy response
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'not found' });
      
      // Call the function
      const result = await deleteImage('invalid-id');
      
      // Assertions
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('invalid-id');
      expect(result).toBe(false);
    });
  });
  
  describe('getTransformedImageUrl', () => {
    it('should generate a transformed URL correctly', () => {
      // Setup the mock
      (cloudinary.url as jest.Mock).mockReturnValue('https://test.com/transformed-image.jpg');
      
      // Transformations object
      const transformations = {
        width: 300,
        height: 200,
        crop: 'fill'
      };
      
      // Call the function
      const result = getTransformedImageUrl('test-id', transformations);
      
      // Assertions
      expect(cloudinary.url).toHaveBeenCalledWith('test-id', transformations);
      expect(result).toBe('https://test.com/transformed-image.jpg');
    });
  });
});
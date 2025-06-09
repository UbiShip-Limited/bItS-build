// Mock Cloudinary service for development when credentials are not available
import type { GalleryImage, CustomerUploadedImage, CloudinaryUploadParams, CloudinaryUploadResult, CloudinaryTransformations } from './index';

// Mock gallery images for development
const mockGalleryImages: GalleryImage[] = [
  {
    id: 'mock_1',
    url: 'https://via.placeholder.com/800x600/555/fff?text=Mock+Tattoo+1',
    publicId: 'mock_gallery_1',
    alt: 'Mock Tattoo Artwork 1',
    artist: 'Mock Artist',
    style: 'Traditional',
    width: 800,
    height: 600,
    tags: ['mock', 'traditional']
  },
  {
    id: 'mock_2',
    url: 'https://via.placeholder.com/800x600/777/fff?text=Mock+Tattoo+2',
    publicId: 'mock_gallery_2',
    alt: 'Mock Tattoo Artwork 2',
    artist: 'Mock Artist',
    style: 'Realism',
    width: 800,
    height: 600,
    tags: ['mock', 'realism']
  }
];

const mockCustomerImages: CustomerUploadedImage[] = [
  {
    id: 'mock_customer_1',
    url: 'https://via.placeholder.com/600x400/333/fff?text=Mock+Customer+Upload',
    publicId: 'mock_customer_upload_1',
    customerId: 'mock_customer_123',
    tattooRequestId: 'mock_request_456',
    uploadedAt: new Date().toISOString(),
    metadata: { type: 'reference_image' }
  }
];

// Mock Cloudinary object
const mockCloudinary = {
  search: {
    expression: () => mockCloudinary.search,
    with_field: () => mockCloudinary.search,
    sort_by: () => mockCloudinary.search,
    max_results: () => mockCloudinary.search,
    execute: async () => ({
      resources: mockGalleryImages.map(img => ({
        public_id: img.publicId,
        secure_url: img.url,
        width: img.width,
        height: img.height,
        format: 'jpg',
        resource_type: 'image',
        tags: img.tags,
        created_at: new Date().toISOString(),
        context: {
          custom: {
            alt: img.alt,
            artist: img.artist,
            style: img.style
          }
        }
      })),
      total_count: mockGalleryImages.length
    })
  },
  api: {
    resource: async (publicId: string) => ({
      public_id: publicId,
      url: `https://via.placeholder.com/800x600/555/fff?text=${encodeURIComponent(publicId)}`,
      secure_url: `https://via.placeholder.com/800x600/555/fff?text=${encodeURIComponent(publicId)}`,
      width: 800,
      height: 600,
      format: 'jpg',
      resource_type: 'image',
      tags: ['mock'],
      created_at: new Date().toISOString(),
      context: { custom: {} }
    }),
    root_folders: async () => ({
      folders: [
        { name: 'shop_content', path: 'shop_content' },
        { name: 'site_content', path: 'site_content' },
        { name: 'customer_uploads', path: 'customer_uploads' }
      ]
    })
  },
  uploader: {
    upload: async (filePath: string, options: any) => ({
      public_id: `mock_upload_${Date.now()}`,
      url: 'https://via.placeholder.com/800x600/555/fff?text=Mock+Upload',
      secure_url: 'https://via.placeholder.com/800x600/555/fff?text=Mock+Upload',
      width: 800,
      height: 600,
      format: 'jpg',
      resource_type: 'image',
      folder: options?.folder,
      tags: options?.tags || [],
      created_at: new Date().toISOString()
    }),
    destroy: async (publicId: string) => ({ result: 'ok' }),
    add_tag: async (tag: string, publicIds: string[]) => ({ result: 'ok' }),
    update_metadata: async (metadata: string, publicIds: string[]) => ({ result: 'ok' })
  },
  utils: {
    api_sign_request: (params: any, secret: string) => 'mock_signature_12345'
  },
  url: (publicId: string, transformations: any = {}) => 
    `https://via.placeholder.com/800x600/555/fff?text=${encodeURIComponent(publicId)}`
};

// Mock service implementing the same interface as the real CloudinaryService
const MockCloudinaryService = {
  cloudinary: mockCloudinary,
  
  CLOUDINARY_FOLDERS: {
    SHOP_CONTENT: 'shop_content',
    SITE_CONTENT: 'site_content',
    CUSTOMER_UPLOADS: 'customer_uploads',
    TATTOO_REQUESTS: 'customer_uploads/tattoo_requests',
    CUSTOMER_PROFILES: 'customer_uploads/profiles',
    SYSTEM: 'system',
    TEMP: 'temp'
  },

  validateUploadResult: async (publicId: string): Promise<CloudinaryUploadResult | null> => {
    return {
      url: `https://via.placeholder.com/800x600/555/fff?text=${encodeURIComponent(publicId)}`,
      publicId,
      format: 'jpg',
      width: 800,
      height: 600,
      resourceType: 'image',
      secureUrl: `https://via.placeholder.com/800x600/555/fff?text=${encodeURIComponent(publicId)}`,
      folder: 'mock_folder',
      tags: ['mock'],
      context: {}
    };
  },

  generateUploadSignature: (params: CloudinaryUploadParams = {}, timestamp?: number): any => {
    return {
      signature: 'mock_signature_12345',
      timestamp: timestamp || Math.round(Date.now() / 1000),
      apiKey: 'mock_api_key',
      cloudName: 'mock_cloud_name',
      folder: params.folder
    };
  },

  generateTattooRequestUploadSignature: (tattooRequestId: string, customerId?: string) => {
    return MockCloudinaryService.generateUploadSignature({
      folder: 'customer_uploads/tattoo_requests',
      tags: ['tattoo_request', 'customer_upload'],
      context: { tattoo_request_id: tattooRequestId }
    });
  },

  uploadImage: async (filePath: string, folder?: string, tags?: string[], context?: Record<string, string>): Promise<CloudinaryUploadResult | null> => {
    return {
      url: 'https://via.placeholder.com/800x600/555/fff?text=Mock+Upload',
      publicId: `mock_upload_${Date.now()}`,
      format: 'jpg',
      width: 800,
      height: 600,
      resourceType: 'image',
      secureUrl: 'https://via.placeholder.com/800x600/555/fff?text=Mock+Upload',
      folder,
      tags,
      context: context || {}
    };
  },

  getGalleryImagesByFolder: async (folder: string, maxResults: number = 100): Promise<GalleryImage[]> => {
    return mockGalleryImages.slice(0, maxResults);
  },

  getShopGalleryImages: async (): Promise<GalleryImage[]> => {
    return mockGalleryImages;
  },

  getSiteContentImages: async (): Promise<GalleryImage[]> => {
    return mockGalleryImages;
  },

  getCustomerUploadedImages: async (customerId?: string): Promise<CustomerUploadedImage[]> => {
    return mockCustomerImages;
  },

  getTattooRequestImages: async (tattooRequestId: string): Promise<CustomerUploadedImage[]> => {
    return mockCustomerImages.filter(img => img.tattooRequestId === tattooRequestId);
  },

  transferImagesToCustomer: async (tattooRequestId: string, customerId: string): Promise<boolean> => {
    return true;
  },

  deleteImage: async (publicId: string): Promise<boolean> => {
    return true;
  },

  getTransformedImageUrl: (publicId: string, transformations: CloudinaryTransformations = {}): string => {
    return `https://via.placeholder.com/800x600/555/fff?text=${encodeURIComponent(publicId)}`;
  },

  getThumbnailUrl: (publicId: string, size: number = 200): string => {
    return `https://via.placeholder.com/${size}x${size}/555/fff?text=${encodeURIComponent(publicId)}`;
  },

  getResponsiveImageUrls: (publicId: string) => {
    const base = `https://via.placeholder.com`;
    return {
      thumbnail: `${base}/300x300/555/fff?text=${encodeURIComponent(publicId)}`,
      medium: `${base}/800x800/555/fff?text=${encodeURIComponent(publicId)}`,
      large: `${base}/1200x1200/555/fff?text=${encodeURIComponent(publicId)}`,
      original: `${base}/1600x1200/555/fff?text=${encodeURIComponent(publicId)}`
    };
  }
};

export default MockCloudinaryService; 
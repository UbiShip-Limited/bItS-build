// Load environment variables first
import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env' });

// Debug: Log what Cloudinary sees
console.log('🔍 Cloudinary Module - Environment Check:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET');
console.log('CLOUDINARY_URL:', process.env.CLOUDINARY_URL ? '***SET***' : 'NOT SET');

import { v2 as cloudinary } from 'cloudinary';

// Set fallback only if no real credentials are found
if (!process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_CLOUD_NAME) {
  console.warn('⚠️  No Cloudinary credentials found, using demo values');
  process.env.CLOUDINARY_URL = 'cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz@demo';
  process.env.CLOUDINARY_CLOUD_NAME = 'demo';
  process.env.CLOUDINARY_API_KEY = '123456789012345';
  process.env.CLOUDINARY_API_SECRET = 'abcdefghijklmnopqrstuvwxyz';
} else {
  console.log('✅ Cloudinary using real credentials');
}

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Use HTTPS for all requests
});

// Cloudinary folder structure for organization
export const CLOUDINARY_FOLDERS = {
  // Shop gallery content (managed by admin)
  SHOP_CONTENT: 'shop_content',
  
  // Site content (hero images, backgrounds, UI assets)
  SITE_CONTENT: 'site_content',
  
  // Customer uploaded images (tattoo requests, reference images)
  CUSTOMER_UPLOADS: 'customer_uploads',
  
  // Nested customer upload folders
  TATTOO_REQUESTS: 'customer_uploads/tattoo_requests',
  CUSTOMER_PROFILES: 'customer_uploads/profiles',
  
  // System/admin uploads
  SYSTEM: 'system',
  TEMP: 'temp'
} as const;

// Type definitions for Cloudinary API responses
interface CloudinaryApiResource {
  public_id: string;
  url: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  resource_type: string;
  folder?: string;
  tags?: string[];
  created_at: string;
  filename?: string;
  context?: {
    custom?: Record<string, string>;
  };
}

interface CloudinarySearchResult {
  resources: CloudinaryApiResource[];
  total_count: number;
  next_cursor?: string;
}

interface CloudinaryUploadOptions {
  folder?: string;
  tags?: string[];
  resource_type?: 'image' | 'auto' | 'video' | 'raw';
  context?: string;
  public_id?: string;
  transformation?: string;
  format?: string;
  quality?: string | number;
  [key: string]: string | number | boolean | string[] | undefined;
}

// Type definitions for Cloudinary metadata and parameters
export interface CloudinaryUploadParams {
  timestamp?: number;
  folder?: string;
  tags?: string[];
  transformation?: string;
  format?: string;
  quality?: string | number;
  public_id?: string;
  context?: Record<string, string>;
  [key: string]: string | number | boolean | string[] | Record<string, string> | undefined;
}

export interface CloudinaryTransformations {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string | number;
  format?: string;
  gravity?: string;
  fetch_format?: string;
  dpr?: string | number;
  [key: string]: string | number | undefined;
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  resourceType: string;
  secureUrl: string;
  folder?: string;
  tags?: string[];
  context?: Record<string, string>;
}

export interface GalleryImage {
  id: string;
  url: string;
  publicId: string;
  alt: string;
  artist: string;
  style: string;
  width: number;
  height: number;
  tags?: string[];
}

export interface CustomerUploadedImage {
  id: string;
  url: string;
  publicId: string;
  customerId?: string;
  tattooRequestId?: string;
  uploadedAt: string;
  metadata?: Record<string, string>;
}

/**
 * Validates a Cloudinary upload result from the frontend
 * Ensures the upload was legitimately made with our account
 */
export const validateUploadResult = async (
  publicId: string
): Promise<CloudinaryUploadResult | null> => {
  try {
    // Get resource details from Cloudinary to verify it exists
    const result = await cloudinary.api.resource(publicId, {
      context: true // Include context metadata
    }) as CloudinaryApiResource;
    
    if (!result) return null;
    
    return {
      url: result.url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
      secureUrl: result.secure_url,
      folder: result.folder,
      tags: result.tags,
      context: result.context?.custom || {}
    };
  } catch (error) {
    console.error('Error validating Cloudinary upload:', error);
    return null;
  }
};

/**
 * Generates a signed upload signature for secure direct uploads from frontend
 */
export const generateUploadSignature = (
  params: CloudinaryUploadParams = {},
  timestamp: number = Math.round(new Date().getTime() / 1000)
): { signature: string; timestamp: number; apiKey: string; cloudName: string; folder?: string; tags?: string[]; context?: Record<string, string>; [key: string]: any } => {
  // Prepare parameters for signing
  const paramsToSign: any = { timestamp };
  
  // Only include non-empty parameters in signature
  if (params.folder) paramsToSign.folder = params.folder;
  if (params.tags && Array.isArray(params.tags) && params.tags.length > 0) {
    // Cloudinary expects tags as comma-separated string for signature generation
    paramsToSign.tags = params.tags.join(',');
  }
  if (params.context && Object.keys(params.context).length > 0) {
    // Cloudinary expects context as pipe-separated key=value pairs for signature generation
    paramsToSign.context = Object.entries(params.context)
      .map(([k, v]) => `${k}=${v}`)
      .join('|');
  }
  
  // Include any other params
  Object.keys(params).forEach(key => {
    if (!['folder', 'tags', 'context'].includes(key) && params[key] !== undefined) {
      paramsToSign[key] = params[key];
    }
  });
  
  // For development/testing without real credentials
  const apiSecret = process.env.CLOUDINARY_API_SECRET || 'abcdefghijklmnopqrstuvwxyz';
  const apiKey = process.env.CLOUDINARY_API_KEY || '123456789012345';
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'demo';
  
  // Log what we're signing
  console.log('🔏 Signing params:', JSON.stringify(paramsToSign));
  console.log('🔑 Using API Secret:', apiSecret ? `${apiSecret.substring(0, 4)}...` : 'NOT SET');
  
  // Generate signature
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    apiSecret
  );
  
  console.log('✅ Generated signature:', signature);
  
  // Return signature data with exact same parameters used for signing
  const result: any = { 
    signature, 
    timestamp,
    apiKey,
    cloudName
  };
  
  // Include only the parameters that were actually signed
  if (paramsToSign.folder) result.folder = paramsToSign.folder;
  if (paramsToSign.tags) {
    // Return tags as both array (for frontend) and string (for Cloudinary upload)
    result.tags = params.tags; // Keep original array for frontend reference
    result.tagsString = paramsToSign.tags; // String version used in signature
  }
  if (paramsToSign.context) {
    // Return context as both object (for frontend) and string (for Cloudinary upload)  
    result.context = params.context; // Keep original object for frontend reference
    result.contextString = paramsToSign.context; // String version used in signature
  }
  
  return result;
};

/**
 * Generate signature for tattoo request uploads with proper tagging
 */
export const generateTattooRequestUploadSignature = (
  tattooRequestId: string,
  customerId?: string
) => {
  const tags = ['tattoo_request', 'customer_upload'];
  if (customerId) tags.push(`customer_${customerId}`);
  
  const context = {
    tattoo_request_id: tattooRequestId,
    ...(customerId && { customer_id: customerId }),
    upload_type: 'tattoo_request_reference'
  };
  
  return generateUploadSignature({
    folder: CLOUDINARY_FOLDERS.TATTOO_REQUESTS,
    tags: tags, // Keep as array
    context: context // Keep as object
  });
};

/**
 * Server-side upload function (used when backend needs to upload directly)
 */
export const uploadImage = async (
  filePath: string,
  folder: string = CLOUDINARY_FOLDERS.CUSTOMER_UPLOADS,
  tags: string[] = [],
  context?: Record<string, string>
): Promise<CloudinaryUploadResult | null> => {
  try {
    const uploadOptions: CloudinaryUploadOptions = {
      folder,
      tags,
      resource_type: 'image',
    };
    
    if (context) {
      uploadOptions.context = Object.entries(context)
        .map(([k, v]) => `${k}=${v}`)
        .join('|');
    }
    
    const result = await cloudinary.uploader.upload(filePath, uploadOptions) as CloudinaryApiResource;
    
    return {
      url: result.url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
      secureUrl: result.secure_url,
      folder: result.folder,
      tags: result.tags,
      context: result.context?.custom || {}
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return null;
  }
};

/**
 * Generic function to query gallery images from any folder
 */
export const getGalleryImagesByFolder = async (
  folder: string, 
  maxResults: number = 100
): Promise<GalleryImage[]> => {
  try {
    const result = await cloudinary.search
      .expression(`folder:${folder}`)
      .with_field('tags')
      .with_field('context')
      .sort_by('created_at', 'desc')
      .max_results(maxResults)
      .execute() as CloudinarySearchResult;
    
    return result.resources.map((resource: CloudinaryApiResource) => ({
      id: resource.public_id,
      url: resource.secure_url,
      publicId: resource.public_id,
      alt: resource.context?.custom?.alt || resource.filename || 'Tattoo artwork',
      artist: resource.context?.custom?.artist || 'Kelly Miller',
      style: resource.context?.custom?.style || 'Mixed',
      width: resource.width,
      height: resource.height,
      tags: resource.tags || []
    }));
  } catch (error) {
    console.error(`Error fetching gallery images from ${folder}:`, error);
    return [];
  }
};

/**
 * Query shop gallery images from shop_content folder (backward compatibility)
 */
export const getShopGalleryImages = async (): Promise<GalleryImage[]> => {
  return getGalleryImagesByFolder(CLOUDINARY_FOLDERS.SHOP_CONTENT);
};

/**
 * Query site content images from site_content folder
 */
export const getSiteContentImages = async (): Promise<GalleryImage[]> => {
  return getGalleryImagesByFolder(CLOUDINARY_FOLDERS.SITE_CONTENT);
};

/**
 * Query customer uploaded images from customer_uploads folder
 */
export const getCustomerUploadedImages = async (customerId?: string): Promise<CustomerUploadedImage[]> => {
  try {
    let expression = `folder:${CLOUDINARY_FOLDERS.CUSTOMER_UPLOADS}/*`;
    if (customerId) {
      expression += ` AND tags:customer_${customerId}`;
    }
    
    const result = await cloudinary.search
      .expression(expression)
      .with_field('tags')
      .with_field('context')
      .sort_by('created_at', 'desc')
      .max_results(500)
      .execute() as CloudinarySearchResult;
    
    return result.resources.map((resource: CloudinaryApiResource) => ({
      id: resource.public_id,
      url: resource.secure_url,
      publicId: resource.public_id,
      customerId: resource.context?.custom?.customer_id,
      tattooRequestId: resource.context?.custom?.tattoo_request_id,
      uploadedAt: resource.created_at,
      metadata: resource.context?.custom || {}
    }));
  } catch (error) {
    console.error('Error fetching customer images:', error);
    return [];
  }
};

/**
 * Query images for a specific tattoo request
 */
export const getTattooRequestImages = async (tattooRequestId: string): Promise<CustomerUploadedImage[]> => {
  try {
    const result = await cloudinary.search
      .expression(`tags:tattoo_request AND context:tattoo_request_id=${tattooRequestId}`)
      .with_field('tags')
      .with_field('context')
      .sort_by('created_at', 'asc')
      .max_results(50)
      .execute() as CloudinarySearchResult;
    
    return result.resources.map((resource: CloudinaryApiResource) => ({
      id: resource.public_id,
      url: resource.secure_url,
      publicId: resource.public_id,
      customerId: resource.context?.custom?.customer_id,
      tattooRequestId: resource.context?.custom?.tattoo_request_id,
      uploadedAt: resource.created_at,
      metadata: resource.context?.custom || {}
    }));
  } catch (error) {
    console.error('Error fetching tattoo request images:', error);
    return [];
  }
};

/**
 * Transfer images from anonymous tattoo request to customer profile
 */
export const transferImagesToCustomer = async (
  tattooRequestId: string,
  customerId: string
): Promise<boolean> => {
  try {
    // Get all images for this tattoo request
    const images = await getTattooRequestImages(tattooRequestId);
    
    // Update each image to include customer information
    for (const image of images) {
      // Add customer tag (expects array of public IDs)
      await cloudinary.uploader.add_tag(`customer_${customerId}`, [image.publicId]);
      
      // Update context to include customer ID (expects array of public IDs)
      const currentContext = image.metadata || {};
      const newContext = {
        ...currentContext,
        customer_id: customerId,
        transferred_at: new Date().toISOString()
      };
      
      await cloudinary.uploader.update_metadata(
        Object.entries(newContext).map(([k, v]) => `${k}=${v}`).join('|'),
        [image.publicId]
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error transferring images to customer:', error);
    return false;
  }
};

/**
 * Delete an image from Cloudinary
 */
export const deleteImage = async (publicId: string): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

/**
 * Generate a transformation URL for an existing image
 */
export const getTransformedImageUrl = (
  publicId: string,
  transformations: CloudinaryTransformations = {}
): string => {
  return cloudinary.url(publicId, transformations);
};

/**
 * Get optimized thumbnail for dashboard display
 */
export const getThumbnailUrl = (publicId: string, size: number = 200): string => {
  return getTransformedImageUrl(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto'
  });
};

/**
 * Get responsive image URLs for gallery display
 */
export const getResponsiveImageUrls = (publicId: string) => {
  const baseTransform = {
    quality: 'auto',
    fetch_format: 'auto'
  };
  
  return {
    thumbnail: getTransformedImageUrl(publicId, { ...baseTransform, width: 300, height: 300, crop: 'fill' }),
    medium: getTransformedImageUrl(publicId, { ...baseTransform, width: 800, height: 800, crop: 'limit' }),
    large: getTransformedImageUrl(publicId, { ...baseTransform, width: 1200, height: 1200, crop: 'limit' }),
    original: getTransformedImageUrl(publicId, baseTransform)
  };
};

// Create a named object for the default export to avoid anonymous export
const CloudinaryService = {
  cloudinary,
  CLOUDINARY_FOLDERS,
  validateUploadResult,
  generateUploadSignature,
  generateTattooRequestUploadSignature,
  uploadImage,
  getGalleryImagesByFolder,
  getShopGalleryImages,
  getSiteContentImages,
  getCustomerUploadedImages,
  getTattooRequestImages,
  transferImagesToCustomer,
  deleteImage,
  getTransformedImageUrl,
  getThumbnailUrl,
  getResponsiveImageUrls
};

export default CloudinaryService;

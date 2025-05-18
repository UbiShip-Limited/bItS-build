import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Use HTTPS for all requests
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  resourceType: string;
  secureUrl: string;
  metadata: Record<string, any>;
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
    const result = await cloudinary.api.resource(publicId);
    
    if (!result) return null;
    
    return {
      url: result.url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
      secureUrl: result.secure_url,
      metadata: result.metadata || {}
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
  params: Record<string, any> = {},
  timestamp: number = Math.round(new Date().getTime() / 1000)
): { signature: string; timestamp: number; apiKey: string; cloudName: string } => {
  // Add timestamp to params if not provided
  const paramsToSign = { ...params, timestamp };
  
  // Generate signature
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET as string
  );
  
  return { 
    signature, 
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string 
  };
};

/**
 * Server-side upload function (used when backend needs to upload directly)
 */
export const uploadImage = async (
  filePath: string,
  folder: string = 'tattoo-requests',
  tags: string[] = []
): Promise<CloudinaryUploadResult | null> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      tags,
      resource_type: 'image',
    });
    
    return {
      url: result.url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
      secureUrl: result.secure_url,
      metadata: result.metadata || {}
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return null;
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
  transformations: Record<string, any> = {}
): string => {
  return cloudinary.url(publicId, transformations);
};

export default {
  cloudinary,
  validateUploadResult,
  generateUploadSignature,
  uploadImage,
  deleteImage,
  getTransformedImageUrl
};

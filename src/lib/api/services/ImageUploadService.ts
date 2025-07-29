import { ApiClient } from '../apiClient';

export interface ImageUploadResponse {
  url: string;
  publicId: string;
}

export interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder?: string;
  tags?: string[];
  context?: Record<string, string>;
  [key: string]: any; // Allow additional parameters from backend
}

export class ImageUploadService {
  private client: ApiClient;
  private cloudinarySignatureUrl = '/cloudinary/signature/public';
  private cloudinaryValidateUrl = '/cloudinary/validate';
  private tattooRequestUploadUrl = '/tattoo-requests/upload-images';

  constructor(apiClient: ApiClient) {
    this.client = apiClient;
  }

  /**
   * Get upload signature for tattoo request images
   */
  private async getTattooRequestUploadSignature(
    tattooRequestId: string, 
    customerId?: string
  ): Promise<CloudinarySignatureResponse> {
    const response = await this.client.post<CloudinarySignatureResponse>(
      this.cloudinarySignatureUrl,
      { 
        folder: 'customer_uploads/tattoo_requests',
        tags: ['tattoo_request', 'customer_upload', ...(customerId ? [`customer_${customerId}`] : [])],
        context: {
          tattoo_request_id: tattooRequestId,
          ...(customerId && { customer_id: customerId }),
          upload_type: 'tattoo_request_reference'
        }
      }
    );
    return response;
  }

  /**
   * Get general upload signature for other purposes
   */
  private async getUploadSignature(folder: string = 'customer_uploads', tags: string[] = []): Promise<CloudinarySignatureResponse> {
    console.log('🔐 Requesting upload signature:', { folder, tags: ['user-upload', ...tags] });
    
    const response = await this.client.post<CloudinarySignatureResponse>(
      this.cloudinarySignatureUrl,
      { 
        folder,
        tags: ['user-upload', ...tags]
      }
    );
    
    console.log('📋 Received signature response:', {
      hasSignature: !!response.signature,
      timestamp: response.timestamp,
      folder: response.folder,
      tags: response.tags,
      allKeys: Object.keys(response)
    });
    
    return response;
  }

  /**
   * Upload directly to Cloudinary using signature
   */
  private async uploadToCloudinary(file: File, signature: CloudinarySignatureResponse): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('signature', signature.signature);
    formData.append('timestamp', signature.timestamp.toString());
    formData.append('api_key', signature.apiKey);
    
    // Include folder parameter if present (required for signature validation)
    if (signature.folder) {
      formData.append('folder', signature.folder);
    }
    
    // Include tags if present (must match what was used in signature generation)
    if ((signature as any).tags) {
      const tags = (signature as any).tags;
      if (Array.isArray(tags)) {
        // Cloudinary expects tags as a comma-separated string
        formData.append('tags', tags.join(','));
      }
    }
    
    // Include context if present (must be formatted as key=value|key2=value2)
    if (signature.context && typeof signature.context === 'object') {
      const contextString = Object.entries(signature.context)
        .map(([k, v]) => `${k}=${v}`)
        .join('|');
      formData.append('context', contextString);
    }
    
    // Include any other parameters that might have been used in signature generation
    const signatureParams = signature as any;
    const excludedParams = ['signature', 'timestamp', 'apiKey', 'cloudName', 'folder', 'tags', 'context'];
    
    // Add any additional parameters from the signature response
    Object.keys(signatureParams).forEach(key => {
      if (!excludedParams.includes(key) && signatureParams[key] !== undefined) {
        formData.append(key, signatureParams[key].toString());
      }
    });

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`;
    
    console.log('🔍 Cloudinary upload request:', {
      url: cloudinaryUrl,
      folder: signature.folder,
      timestamp: signature.timestamp,
      hasSignature: !!signature.signature,
      additionalParams: Object.keys(signatureParams).filter(k => !excludedParams.includes(k))
    });
    
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Cloudinary upload error:', errorData);
      throw new Error(`Cloudinary upload failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  }

  /**
   * Validate upload with backend
   */
  private async validateUpload(publicId: string): Promise<ImageUploadResponse> {
    const response = await this.client.post<ImageUploadResponse>(
      this.cloudinaryValidateUrl,
      { publicId }
    );
    return response;
  }

  /**
   * Upload images for tattoo request with proper metadata
   * Uses backend endpoint that handles Cloudinary upload with proper tagging and metadata
   */
  async uploadTattooRequestImages(
    files: File[]
  ): Promise<ImageUploadResponse[]> {
    try {
      const formData = new FormData();
      
      // Add all files
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      // Upload via backend endpoint using ApiClient for proper auth and base URL
      const response = await this.client.uploadFile<{ images: Array<{ url: string; publicId: string; originalName: string }> }>(
        this.tattooRequestUploadUrl,
        formData
      );
      
      // Transform backend response to match our interface
      return response.images.map((img) => ({
        url: img.url,
        publicId: img.publicId
      }));
    } catch (error) {
      console.error('Tattoo request image upload failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to upload tattoo request images');
    }
  }

  /**
   * Upload a single image file using Cloudinary signature flow
   */
  async uploadImage(file: File, folder: string = 'customer_uploads'): Promise<ImageUploadResponse> {
    try {
      // Get upload signature from backend
      const signature = await this.getUploadSignature(folder);
      
      // Upload directly to Cloudinary
      const uploadResult = await this.uploadToCloudinary(file, signature);
      
      return uploadResult;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to upload image');
    }
  }

  /**
   * Upload multiple image files
   */
  async uploadImages(files: File[], folder: string = 'customer_uploads'): Promise<ImageUploadResponse[]> {
    // Process files in parallel
    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }
}

export default ImageUploadService; 
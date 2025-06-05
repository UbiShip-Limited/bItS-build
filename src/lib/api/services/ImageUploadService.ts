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
    const response = await this.client.post<CloudinarySignatureResponse>(
      this.cloudinarySignatureUrl,
      { 
        folder,
        tags: ['user-upload', ...tags]
      }
    );
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
    
    if (signature.folder) {
      formData.append('folder', signature.folder);
    }

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`;
    
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
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
    files: File[], 
    tattooRequestId?: string, 
    customerId?: string
  ): Promise<ImageUploadResponse[]> {
    try {
      const formData = new FormData();
      
      // Add metadata fields
      if (tattooRequestId) {
        formData.append('tattooRequestId', tattooRequestId);
      }
      if (customerId) {
        formData.append('customerId', customerId);
      }
      
      // Add all files
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      // Upload via backend endpoint
      const response = await fetch(this.tattooRequestUploadUrl, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      
      const result = await response.json();
      
      // Transform backend response to match our interface
      return result.images.map((img: any) => ({
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
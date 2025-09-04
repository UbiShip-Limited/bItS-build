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
  tagsString?: string; // String format used in signature generation
  contextString?: string; // String format used in signature generation
  [key: string]: any; // Allow additional parameters from backend
}

export class ImageUploadService {
  private client: ApiClient;
  private cloudinarySignatureUrl = '/cloudinary/signature/public';
  private cloudinaryValidateUrl = '/cloudinary/validate';
  
  // Default folder for tattoo request uploads (must match backend allowedFolders)
  private readonly DEFAULT_FOLDER = 'tattoo-requests';
  private readonly DEFAULT_TAGS = ['tattoo-request', 'user-upload'];

  constructor(apiClient: ApiClient) {
    this.client = apiClient;
    
    console.log('🏠 [ImageUploadService] Initialized with:', {
      baseUrl: this.client.getBaseUrl(),
      signatureEndpoint: this.client.getBaseUrl() + this.cloudinarySignatureUrl
    });
  }


  /**
   * Get upload signature for tattoo request images
   */
  private async getUploadSignature(
    folder: string = this.DEFAULT_FOLDER, 
    tags: string[] = this.DEFAULT_TAGS
  ): Promise<CloudinarySignatureResponse> {
    console.log('🔐 [ImageUploadService] Requesting upload signature:', { 
      folder, 
      tags,
      endpoint: this.cloudinarySignatureUrl,
      timestamp: new Date().toISOString()
    });
    
    try {
      const requestBody = {
        folder,
        tags
      };
      
      console.log('📤 [ImageUploadService] Sending signature request:', requestBody);
      
      const response = await this.client.post<CloudinarySignatureResponse>(
        this.cloudinarySignatureUrl,
        requestBody
      );
      
      console.log('✅ [ImageUploadService] Received signature response:', {
        success: true,
        hasSignature: !!response.signature,
        signatureLength: response.signature?.length || 0,
        timestamp: response.timestamp,
        folder: response.folder,
        tags: response.tags,
        apiKey: response.apiKey ? `${response.apiKey.substring(0, 6)}...` : 'missing',
        cloudName: response.cloudName || 'missing',
        allKeys: Object.keys(response)
      });
      
      // Validate that we have all required fields
      if (!response.signature || !response.timestamp || !response.apiKey || !response.cloudName) {
        throw new Error(`Invalid signature response: missing required fields`);
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ [ImageUploadService] Signature request failed:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        endpoint: this.cloudinarySignatureUrl,
        requestUrl: this.client.getBaseUrl() + this.cloudinarySignatureUrl
      });
      
      // Provide more specific error messages based on error type
      if (error.response?.status === 404) {
        throw new Error('Upload service not found. Please check server configuration.');
      } else if (error.response?.status >= 500) {
        throw new Error('Upload service is temporarily unavailable. Please try again.');
      } else if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network.');
      } else {
        throw new Error(`Failed to get upload signature: ${error.message}`);
      }
    }
  }

  /**
   * Upload directly to Cloudinary using signature
   */
  private async uploadToCloudinary(file: File, signature: CloudinarySignatureResponse): Promise<ImageUploadResponse> {
    console.log('📤 [ImageUploadService] Starting Cloudinary upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      cloudName: signature.cloudName,
      folder: signature.folder,
      timestamp: signature.timestamp
    });

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
    if ((signature as any).tagsString) {
      // Use the exact string format that was used in signature generation
      formData.append('tags', (signature as any).tagsString);
      console.log('🏷️ [ImageUploadService] Added tags (signed format):', (signature as any).tagsString);
    }
    
    // Include context if present (must match what was used in signature generation)
    if ((signature as any).contextString) {
      // Use the exact string format that was used in signature generation
      formData.append('context', (signature as any).contextString);
      console.log('📝 [ImageUploadService] Added context (signed format):', (signature as any).contextString);
    }
    
    // Include any other parameters that might have been used in signature generation
    const signatureParams = signature as any;
    const excludedParams = ['signature', 'timestamp', 'apiKey', 'cloudName', 'folder', 'tags', 'context', 'tagsString', 'contextString'];
    
    // Add any additional parameters from the signature response
    const additionalParams: string[] = [];
    Object.keys(signatureParams).forEach(key => {
      if (!excludedParams.includes(key) && signatureParams[key] !== undefined) {
        formData.append(key, signatureParams[key].toString());
        additionalParams.push(`${key}=${signatureParams[key]}`);
      }
    });

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`;
    
    console.log('🌍 [ImageUploadService] Making request to Cloudinary:', {
      url: cloudinaryUrl,
      folder: signature.folder,
      timestamp: signature.timestamp,
      signaturePresent: !!signature.signature,
      additionalParams,
      requestTime: new Date().toISOString()
    });
    
    try {
      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData
      });

      console.log('📡 [ImageUploadService] Cloudinary response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText } };
        }
        
        console.error('❌ [ImageUploadService] Cloudinary upload failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          file: { name: file.name, size: file.size, type: file.type }
        });
        
        throw new Error(`Cloudinary upload failed (${response.status}): ${errorData.error?.message || errorText || 'Unknown error'}`);
      }

      const result = await response.json();
      
      console.log('✅ [ImageUploadService] Upload successful:', {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes
      });
      
      return {
        url: result.secure_url,
        publicId: result.public_id
      };
    } catch (error: any) {
      console.error('❌ [ImageUploadService] Fetch error during upload:', {
        error: error.message,
        fileName: file.name,
        cloudinaryUrl
      });
      throw error;
    }
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
   * Upload a single image file for tattoo requests
   */
  async uploadImage(file: File, folder: string = this.DEFAULT_FOLDER): Promise<ImageUploadResponse> {
    const uploadId = Math.random().toString(36).substring(7);
    console.log(`🚀 [ImageUploadService] Starting upload process [${uploadId}]:`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      folder,
      startTime: new Date().toISOString()
    });
    
    // Validate file before uploading
    this.validateFile(file);
    
    try {
      // Get upload signature from backend
      console.log(`🔑 [ImageUploadService] Getting signature [${uploadId}]`);
      const signature = await this.getUploadSignature(folder, this.DEFAULT_TAGS);
      
      // Upload directly to Cloudinary
      console.log(`☁️ [ImageUploadService] Uploading to Cloudinary [${uploadId}]`);
      const uploadResult = await this.uploadToCloudinary(file, signature);
      
      console.log(`✅ [ImageUploadService] Upload complete [${uploadId}]:`, {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        fileSizeKB: Math.round(file.size / 1024)
      });
      
      return uploadResult;
    } catch (error: any) {
      console.error(`❌ [ImageUploadService] Upload failed [${uploadId}]:`, {
        error: error.message,
        fileName: file.name,
        fileSize: file.size,
        errorType: error.constructor.name
      });
      
      // Re-throw with more context
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }
  }
  
  /**
   * Validate file before upload
   */
  private validateFile(file: File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (file.size > maxSize) {
      throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File ${file.name} has unsupported format. Please use JPG, PNG, GIF, or WebP.`);
    }
    
    console.log('✅ [ImageUploadService] File validation passed:', {
      fileName: file.name,
      fileType: file.type,
      fileSizeKB: Math.round(file.size / 1024)
    });
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
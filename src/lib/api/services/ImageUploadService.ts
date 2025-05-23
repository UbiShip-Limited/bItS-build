import { ApiClient } from '../apiClient';

export interface ImageUploadResponse {
  url: string;
  publicId: string;
}

export class ImageUploadService {
  private client: ApiClient;
  private baseUrl = '/api/upload';

  constructor(apiClient: ApiClient) {
    this.client = apiClient;
  }

  /**
   * Upload an image file
   */
  async uploadImage(file: File): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Use multipart/form-data for file uploads
    const response = await this.client.post<ImageUploadResponse>(
      this.baseUrl,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response;
  }

  /**
   * Upload multiple image files
   */
  async uploadImages(files: File[]): Promise<ImageUploadResponse[]> {
    // Process files in parallel
    const uploadPromises = files.map((file) => this.uploadImage(file));
    return Promise.all(uploadPromises);
  }
}

export default ImageUploadService; 
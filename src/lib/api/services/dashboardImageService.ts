import { ApiClient } from '../apiClient';

export interface CustomerUploadedImage {
  id: string;
  url: string;
  publicId: string;
  customerId?: string;
  tattooRequestId?: string;
  uploadedAt: string;
  metadata?: Record<string, any>;
  thumbnailUrl?: string;
}

export interface DashboardImageFilters {
  customerId?: string;
  tattooRequestId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export class DashboardImageService {
  private client: ApiClient;
  private customerUploadsUrl = '/cloudinary/customer-uploads';
  private tattooRequestImagesUrl = '/cloudinary/tattoo-request';
  private thumbnailUrl = '/cloudinary/thumbnail';

  constructor(apiClient: ApiClient) {
    this.client = apiClient;
  }

  /**
   * Get all customer uploaded images
   */
  async getCustomerUploadedImages(filters?: DashboardImageFilters): Promise<CustomerUploadedImage[]> {
    try {
      const response = await this.client.get<CustomerUploadedImage[]>(this.customerUploadsUrl, {
        params: filters
      });
      
      // Add thumbnail URLs for dashboard display
      return response.map(image => ({
        ...image,
        thumbnailUrl: this.getThumbnailUrl(image.publicId, 200)
      }));
    } catch (error) {
      console.error('Failed to fetch customer uploads:', error);
      return [];
    }
  }

  /**
   * Get images for a specific customer
   */
  async getCustomerImages(customerId: string): Promise<CustomerUploadedImage[]> {
    return this.getCustomerUploadedImages({ customerId });
  }

  /**
   * Get images for a specific tattoo request
   */
  async getTattooRequestImages(requestId: string): Promise<CustomerUploadedImage[]> {
    try {
      const response = await this.client.get<CustomerUploadedImage[]>(
        `${this.tattooRequestImagesUrl}/${requestId}/images`
      );
      
      return response.map(image => ({
        ...image,
        thumbnailUrl: this.getThumbnailUrl(image.publicId, 200)
      }));
    } catch (error) {
      console.error('Failed to fetch tattoo request images:', error);
      return [];
    }
  }

  /**
   * Get recent uploads across all customers
   */
  async getRecentUploads(limit: number = 20): Promise<CustomerUploadedImage[]> {
    return this.getCustomerUploadedImages({ limit });
  }

  /**
   * Get uploads by date range
   */
  async getUploadsByDateRange(dateFrom: string, dateTo: string): Promise<CustomerUploadedImage[]> {
    return this.getCustomerUploadedImages({ dateFrom, dateTo });
  }

  /**
   * Get upload statistics
   */
  async getUploadStats(): Promise<{
    totalUploads: number;
    uploadsThisMonth: number;
    uploadsThisWeek: number;
    topCustomers: Array<{ customerId: string; count: number }>;
  }> {
    try {
      const allImages = await this.getCustomerUploadedImages();
      
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const uploadsThisMonth = allImages.filter(img => 
        new Date(img.uploadedAt) >= thisMonth
      ).length;
      
      const uploadsThisWeek = allImages.filter(img => 
        new Date(img.uploadedAt) >= thisWeek
      ).length;
      
      // Count uploads per customer
      const customerCounts = allImages.reduce((acc, img) => {
        if (img.customerId) {
          acc[img.customerId] = (acc[img.customerId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      const topCustomers = Object.entries(customerCounts)
        .map(([customerId, count]) => ({ customerId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      return {
        totalUploads: allImages.length,
        uploadsThisMonth,
        uploadsThisWeek,
        topCustomers
      };
    } catch (error) {
      console.error('Failed to fetch upload stats:', error);
      return {
        totalUploads: 0,
        uploadsThisMonth: 0,
        uploadsThisWeek: 0,
        topCustomers: []
      };
    }
  }

  /**
   * Delete an image (admin only)
   */
  async deleteImage(publicId: string): Promise<boolean> {
    try {
      await this.client.delete(`/cloudinary/image/${publicId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete image:', error);
      return false;
    }
  }

  /**
   * Get optimized thumbnail URL
   */
  private getThumbnailUrl(publicId: string, size: number = 200): string {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
    return `https://res.cloudinary.com/${cloudName}/image/upload/w_${size},h_${size},c_fill,q_auto,f_auto/${publicId}`;
  }

  /**
   * Get responsive image URL for modal display
   */
  getResponsiveUrl(publicId: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
    const sizes = {
      small: 'w_400,h_400,c_limit',
      medium: 'w_800,h_800,c_limit',
      large: 'w_1200,h_1200,c_limit'
    };
    
    return `https://res.cloudinary.com/${cloudName}/image/upload/${sizes[size]},q_auto,f_auto/${publicId}`;
  }

  /**
   * Bulk operations for admin dashboard
   */
  async bulkDeleteImages(publicIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    const results = await Promise.allSettled(
      publicIds.map(publicId => this.deleteImage(publicId))
    );
    
    const success: string[] = [];
    const failed: string[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        success.push(publicIds[index]);
      } else {
        failed.push(publicIds[index]);
      }
    });
    
    return { success, failed };
  }

  /**
   * Search images by metadata
   */
  async searchImages(query: string): Promise<CustomerUploadedImage[]> {
    const allImages = await this.getCustomerUploadedImages();
    
    return allImages.filter(image => {
      const searchableText = [
        image.customerId,
        image.tattooRequestId,
        JSON.stringify(image.metadata)
      ].join(' ').toLowerCase();
      
      return searchableText.includes(query.toLowerCase());
    });
  }
}

export default DashboardImageService; 
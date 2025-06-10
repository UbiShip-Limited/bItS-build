import { ApiClient } from '../apiClient';

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
  thumbnailUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
}

export interface GalleryFilters {
  artist?: string;
  style?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  folder?: string;
}

export class GalleryService {
  private client: ApiClient;
  private galleryUrl = '/cloudinary/gallery';

  constructor(apiClient: ApiClient) {
    this.client = apiClient;
  }

  /**
   * Get gallery images from specified folder (defaults to shop_content for backward compatibility)
   * 🎯 Now supports offset for cost-effective pagination
   */
  async getGalleryImages(filters?: GalleryFilters): Promise<GalleryImage[]> {
    try {
      const targetFolder = filters?.folder || 'shop_content';
      const offset = filters?.offset || 0;
      const limit = filters?.limit || 15;
      
      console.log('🔗 GalleryService: Fetching images from', this.galleryUrl);
      console.log(`📁 GalleryService: Target folder: ${targetFolder}`);
      console.log(`📄 GalleryService: Pagination - offset: ${offset}, limit: ${limit}`);
      console.log('🌐 Cloudinary cloud name:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'NOT SET');
      
      const response = await this.client.get<GalleryImage[]>(this.galleryUrl, {
        params: filters
      });
      
      console.log(`✅ GalleryService: Received ${response.length} images from ${targetFolder} folder`);
      console.log(`📊 GalleryService: Cost optimization - requested ${limit} images with offset ${offset}`);
      
      // Add responsive image URLs for each image
      const imagesWithUrls = response.map(image => {
        return {
          ...image,
          thumbnailUrl: image.thumbnailUrl || this.getResponsiveUrl(image.publicId, 'thumbnail', image.url),
          mediumUrl: image.mediumUrl || this.getResponsiveUrl(image.publicId, 'medium', image.url),
          largeUrl: image.largeUrl || this.getResponsiveUrl(image.publicId, 'large', image.url)
        };
      });
      
      console.log('🖼️ Sample image with URLs:', imagesWithUrls[0]);
      
      return imagesWithUrls;
    } catch (error) {
      console.error('❌ GalleryService: Failed to fetch gallery images:', error);
      return [];
    }
  }

  /**
   * 🎯 NEW: Get paginated gallery images with explicit offset
   * Perfect for "Load More" functionality
   */
  async getPaginatedGalleryImages(
    offset: number, 
    limit: number, 
    filters?: Omit<GalleryFilters, 'offset' | 'limit'>
  ): Promise<GalleryImage[]> {
    console.log(`🔄 GalleryService: Paginated request - offset: ${offset}, limit: ${limit}`);
    return this.getGalleryImages({ ...filters, offset, limit });
  }

  /**
   * 🎯 NEW: Get initial gallery images (for cost optimization)
   */
  async getInitialGalleryImages(count: number = 9, filters?: Omit<GalleryFilters, 'limit' | 'offset'>): Promise<GalleryImage[]> {
    console.log(`💰 GalleryService: Initial load - requesting ${count} images for cost optimization`);
    return this.getGalleryImages({ ...filters, limit: count, offset: 0 });
  }

  /**
   * 🎯 NEW: Get more gallery images (for "Load More" functionality)
   */
  async getMoreGalleryImages(
    currentCount: number, 
    loadMoreCount: number = 20, 
    filters?: Omit<GalleryFilters, 'limit' | 'offset'>
  ): Promise<GalleryImage[]> {
    console.log(`📈 GalleryService: Load More - current: ${currentCount}, loading: ${loadMoreCount} more`);
    return this.getGalleryImages({ ...filters, limit: loadMoreCount, offset: currentCount });
  }

  /**
   * Get filtered gallery images by artist
   */
  async getImagesByArtist(artist: string, limit?: number, offset?: number): Promise<GalleryImage[]> {
    return this.getGalleryImages({ artist, limit, offset });
  }

  /**
   * Get filtered gallery images by style
   */
  async getImagesByStyle(style: string, limit?: number, offset?: number): Promise<GalleryImage[]> {
    return this.getGalleryImages({ style, limit, offset });
  }

  /**
   * Get images from site_content folder (for hero images, backgrounds, etc.)
   */
  async getSiteContentImages(filters?: Omit<GalleryFilters, 'folder'>): Promise<GalleryImage[]> {
    return this.getGalleryImages({ ...filters, folder: 'site_content' });
  }

  /**
   * Get images from shop_content folder (for tattoo gallery)
   */
  async getShopGalleryImages(filters?: Omit<GalleryFilters, 'folder'>): Promise<GalleryImage[]> {
    return this.getGalleryImages({ ...filters, folder: 'shop_content' });
  }

  /**
   * Get images from any custom folder
   */
  async getImagesByFolder(folder: string, filters?: Omit<GalleryFilters, 'folder'>): Promise<GalleryImage[]> {
    return this.getGalleryImages({ ...filters, folder });
  }

  /**
   * Get unique artists from gallery
   */
  async getArtists(): Promise<string[]> {
    try {
      const images = await this.getGalleryImages();
      const artists = [...new Set(images.map(img => img.artist))].filter(Boolean);
      return artists;
    } catch (error) {
      console.error('Failed to fetch artists:', error);
      return [];
    }
  }

  /**
   * Get unique styles from gallery
   */
  async getStyles(): Promise<string[]> {
    try {
      const images = await this.getGalleryImages();
      const styles = [...new Set(images.map(img => img.style))].filter(Boolean);
      return styles;
    } catch (error) {
      console.error('Failed to fetch styles:', error);
      return [];
    }
  }

  /**
   * Extract cloud name from an existing Cloudinary URL
   */
  private getCloudNameFromUrl(url: string): string {
    const match = url.match(/res\.cloudinary\.com\/([^\/]+)/);
    return match ? match[1] : 'demo';
  }

  /**
   * Generate responsive image URL for different sizes
   */
  private getResponsiveUrl(publicId: string, size: 'thumbnail' | 'medium' | 'large', existingUrl?: string): string {
    // Try to get cloud name from existing URL first, then fallback to env var
    const cloudName = existingUrl 
      ? this.getCloudNameFromUrl(existingUrl)
      : process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
    
    const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
    
    const transformations = {
      thumbnail: 'w_300,h_300,c_fill,q_auto,f_auto',
      medium: 'w_800,h_800,c_limit,q_auto,f_auto',
      large: 'w_1200,h_1200,c_limit,q_auto,f_auto'
    };
    
    return `${baseUrl}/${transformations[size]}/${publicId}`;
  }

  /**
   * Get optimized URL for gallery display
   */
  getOptimizedUrl(publicId: string, width?: number, height?: number, existingUrl?: string): string {
    // Try to get cloud name from existing URL first, then fallback to env var
    const cloudName = existingUrl 
      ? this.getCloudNameFromUrl(existingUrl)
      : process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
    
    const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
    
    let transformation = 'q_auto,f_auto';
    if (width) transformation += `,w_${width}`;
    if (height) transformation += `,h_${height}`;
    if (width && height) transformation += ',c_fill';
    
    return `${baseUrl}/${transformation}/${publicId}`;
  }
}

export default GalleryService; 
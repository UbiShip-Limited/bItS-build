import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../middleware/auth';
import { UserRole } from '../types/auth';
import { CloudinarySignatureBody } from '../types/api';
import CloudinaryService, { type GalleryImage } from '../cloudinary/index';

// TypeScript interfaces for Cloudinary API responses
interface CloudinaryResource {
  public_id: string;
  folder?: string;
  secure_url: string;
  [key: string]: unknown;
}

interface CloudinarySearchResult {
  total_count: number;
  resources: CloudinaryResource[];
}

interface CloudinaryFolder {
  name: string;
  path: string;
}

interface CloudinaryFoldersResult {
  folders: CloudinaryFolder[];
}

// Use mock service if no Cloudinary credentials are set
const useMock = !process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET;
const cloudinaryService = useMock 
  ? await import('../cloudinary/mock').then(m => m.default)
  : await import('../cloudinary/index').then(m => m.default);

if (useMock) {
  console.log('⚠️  Using mock Cloudinary service - set CLOUDINARY_* env vars for real uploads');
}

const cloudinaryRoutes: FastifyPluginAsync = async (fastify) => {
  // Public endpoint for tattoo request image uploads (no auth required)
  fastify.post('/signature/public', {
    schema: {
      body: {
        type: 'object',
        properties: {
          folder: { type: 'string', default: 'tattoo-requests' },
          tags: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }, async (request, reply) => {
    const { folder = 'tattoo-requests', tags = ['tattoo-request', 'public-upload'] } = request.body as CloudinarySignatureBody;
    
    // Generate a signature with folder and tags pre-defined
    // This locks the upload to only go to the specified folder
    const params = {
      folder,
      tags: Array.isArray(tags) ? tags : [tags], // Ensure tags is an array
      upload_preset: 'tattoo-requests' // Optional: if you have a preset configured
    };
    
    const signatureData = cloudinaryService.generateUploadSignature(params);
    
    reply.type('application/json');
    return signatureData;
  });

  // Generate upload signature for authenticated users
  fastify.post('/signature', {
    preHandler: authorize(['artist', 'admin', 'customer'] as UserRole[]),
    schema: {
      body: {
        type: 'object',
        properties: {
          folder: { type: 'string', default: 'tattoo-requests' },
          tags: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }, async (request, reply) => {
    const { folder = 'tattoo-requests', tags = [] } = request.body as CloudinarySignatureBody;
    
    // Generate a signature with folder and tags pre-defined
    // This locks the upload to only go to the specified folder
    const params = {
      folder,
      tags: Array.isArray(tags) ? tags : [tags] // Ensure tags is an array
    };
    
    const signatureData = cloudinaryService.generateUploadSignature(params);
    
    reply.type('application/json');
    return signatureData;
  });
  
  // Validate and process an upload after frontend direct upload
  fastify.post('/validate', {
    preHandler: authorize(['artist', 'admin', 'customer'] as UserRole[]),
    schema: {
      body: {
        type: 'object',
        required: ['publicId'],
        properties: {
          publicId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { publicId } = request.body as { publicId: string };
    
    const validationResult = await cloudinaryService.validateUploadResult(publicId);
    
    if (!validationResult) {
      return reply.status(400).send({ error: 'Invalid or unauthorized image upload' });
    }
    
    reply.type('application/json');
    return validationResult;
  });



  // Generate signature specifically for tattoo request uploads
  fastify.post('/signature/tattoo-request', async (request, reply) => {
    try {
      const { tattooRequestId, customerId } = request.body as { 
        tattooRequestId: string; 
        customerId?: string; 
      };
      
      if (!tattooRequestId) {
        reply.code(400).send({ error: 'tattooRequestId is required' });
        return;
      }
      
      const signatureData = CloudinaryService.generateTattooRequestUploadSignature(
        tattooRequestId,
        customerId
      );
      
      reply.code(200).send(signatureData);
    } catch (error) {
      request.log.error(error, 'Error generating tattoo request upload signature');
      reply.code(500).send({ 
        error: 'Failed to generate upload signature',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });



  // Debug endpoint to check what's in Cloudinary account
  fastify.get('/debug', async (request, reply) => {
    try {
      console.log('🔍 Debug: Checking Cloudinary account...');
      
      // Check account status and list some resources
      const allResources = await CloudinaryService.cloudinary.search
        .max_results(10)
        .execute() as CloudinarySearchResult;
      
      // Check specifically for shop_content folder
      const shopContentSearch = await CloudinaryService.cloudinary.search
        .expression('folder:shop_content')
        .max_results(10)
        .execute() as CloudinarySearchResult;
      
      // Get folders
      const folders = await CloudinaryService.cloudinary.api.root_folders() as CloudinaryFoldersResult;
      
      const debugInfo = {
        account: {
          cloudName: process.env.CLOUDINARY_CLOUD_NAME,
          hasCredentials: !!process.env.CLOUDINARY_API_KEY
        },
        totalResources: allResources.total_count,
        sampleResources: allResources.resources.map((r: CloudinaryResource) => ({
          publicId: r.public_id,
          folder: r.folder,
          url: r.secure_url
        })),
        shopContentFolder: {
          totalCount: shopContentSearch.total_count,
          resources: shopContentSearch.resources.map((r: CloudinaryResource) => ({
            publicId: r.public_id,
            folder: r.folder,
            url: r.secure_url
          }))
        },
        folders: folders.folders.map((f: CloudinaryFolder) => f.name)
      };
      
      console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
      reply.code(200).send(debugInfo);
    } catch (error) {
      console.error('Debug error:', error);
      reply.code(500).send({ 
        error: 'Debug failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get gallery images from specified folder (defaults to shop_content for backward compatibility)
  fastify.get('/gallery', async (request, reply) => {
    try {
      const { artist, style, tags, limit, folder } = request.query as {
        artist?: string;
        style?: string;
        tags?: string[];
        limit?: string;
        folder?: string;
      };
      
      // Default to shop_content for backward compatibility
      const targetFolder = folder || 'shop_content';
      console.log(`🖼️ Gallery: Fetching images from ${targetFolder} folder...`);
      
      // Get images from specified folder
      let images: GalleryImage[] = [];
      if (targetFolder === 'shop_content') {
        images = await CloudinaryService.getShopGalleryImages();
      } else if (targetFolder === 'site_content') {
        images = await CloudinaryService.getSiteContentImages();
      } else {
        // Use generic folder fetcher for other folders
        images = await CloudinaryService.getGalleryImagesByFolder(targetFolder);
      }
      
      console.log(`🖼️ Gallery: Found ${images.length} images in ${targetFolder} folder`);
      
      // Apply filters if provided
      if (artist) {
        images = images.filter(img => 
          img.artist && img.artist.toLowerCase().includes(artist.toLowerCase())
        );
      }
      
      if (style) {
        images = images.filter(img => 
          img.style && img.style.toLowerCase().includes(style.toLowerCase())
        );
      }
      
      if (tags && Array.isArray(tags)) {
        images = images.filter(img => 
          tags.some(tag => img.tags?.includes(tag))
        );
      }
      
      // Apply limit if provided
      if (limit) {
        const limitNum = parseInt(limit, 10);
        if (!isNaN(limitNum) && limitNum > 0) {
          images = images.slice(0, limitNum);
        }
      }
      
      console.log(`🖼️ Gallery: Returning ${images.length} images after filters`);
      reply.code(200).send(images);
    } catch (error) {
      request.log.error(error, 'Error fetching gallery images');
      reply.code(500).send({ 
        error: 'Failed to fetch gallery images',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get customer uploaded images
  fastify.get('/customer-uploads', async (request, reply) => {
    try {
      const { customerId } = request.query as { customerId?: string };
      
      const images = await CloudinaryService.getCustomerUploadedImages(customerId);
      
      reply.code(200).send(images);
    } catch (error) {
      request.log.error(error, 'Error fetching customer uploads');
      reply.code(500).send({ 
        error: 'Failed to fetch customer uploads',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get images for a specific tattoo request
  fastify.get('/tattoo-request/:requestId/images', async (request, reply) => {
    try {
      const { requestId } = request.params as { requestId: string };
      
      if (!requestId) {
        reply.code(400).send({ error: 'requestId is required' });
        return;
      }
      
      const images = await CloudinaryService.getTattooRequestImages(requestId);
      
      reply.code(200).send(images);
    } catch (error) {
      request.log.error(error, 'Error fetching tattoo request images');
      reply.code(500).send({ 
        error: 'Failed to fetch tattoo request images',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get thumbnail URL for an image
  fastify.get('/thumbnail/:publicId', async (request, reply) => {
    try {
      const { publicId } = request.params as { publicId: string };
      const { size = '200' } = request.query as { size?: string };
      
      if (!publicId) {
        reply.code(400).send({ error: 'publicId is required' });
        return;
      }
      
      const sizeNum = parseInt(size, 10) || 200;
      const thumbnailUrl = CloudinaryService.getThumbnailUrl(publicId, sizeNum);
      
      reply.code(200).send({ url: thumbnailUrl });
    } catch (error) {
      request.log.error(error, 'Error generating thumbnail URL');
      reply.code(500).send({ 
        error: 'Failed to generate thumbnail URL',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get responsive image URLs for an image
  fastify.get('/responsive/:publicId', async (request, reply) => {
    try {
      const { publicId } = request.params as { publicId: string };
      
      if (!publicId) {
        reply.code(400).send({ error: 'publicId is required' });
        return;
      }
      
      const responsiveUrls = CloudinaryService.getResponsiveImageUrls(publicId);
      
      reply.code(200).send(responsiveUrls);
    } catch (error) {
      request.log.error(error, 'Error generating responsive URLs');
      reply.code(500).send({ 
        error: 'Failed to generate responsive URLs',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete an image (admin only - would need auth middleware)
  fastify.delete('/image/:publicId', async (request, reply) => {
    try {
      const { publicId } = request.params as { publicId: string };
      
      if (!publicId) {
        reply.code(400).send({ error: 'publicId is required' });
        return;
      }
      
      const success = await CloudinaryService.deleteImage(publicId);
      
      if (success) {
        reply.code(200).send({ message: 'Image deleted successfully' });
      } else {
        reply.code(404).send({ error: 'Image not found or could not be deleted' });
      }
    } catch (error) {
      request.log.error(error, 'Error deleting image');
      reply.code(500).send({ 
        error: 'Failed to delete image',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
};

export default cloudinaryRoutes;

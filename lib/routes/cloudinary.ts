import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../middleware/auth';
import { UserRole } from '../types/auth';
import { CloudinarySignatureBody } from '../types/api';

// Use mock service if no Cloudinary credentials are set
const useMock = !process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET;
const cloudinaryService = useMock 
  ? await import('../cloudinary/mock.js').then(m => m.default)
  : await import('../cloudinary/index.js').then(m => m.default);

if (useMock) {
  console.log('⚠️  Using mock Cloudinary service - set CLOUDINARY_* env vars for real uploads');
}

const cloudinaryRoutes: FastifyPluginAsync = async (fastify, _options) => {
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
      tags: tags.join(','),
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
      tags: tags.join(',')
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
};

export default cloudinaryRoutes;

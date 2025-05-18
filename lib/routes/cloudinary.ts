import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../middleware/auth.js';
import { UserRole } from '../types/auth.js';
import cloudinaryService from '../cloudinary/index.js';

const cloudinaryRoutes: FastifyPluginAsync = async (fastify, options) => {
  // Generate upload signature for frontend direct uploads
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
    const { folder = 'tattoo-requests', tags = [] } = request.body as any;
    
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

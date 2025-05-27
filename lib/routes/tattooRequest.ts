import { FastifyPluginAsync } from 'fastify';
import multipart from '@fastify/multipart';
import { authorize } from '../middleware/auth.js';
import { UserRole } from '../types/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { TattooRequestService } from '../services/tattooRequestService.js';
import { BookingType } from '../types/booking.js';
// import cloudinaryService from '../cloudinary/index.js';
import { pipeline } from 'stream/promises';
import fs from 'fs';
import path from 'path';
import os from 'os';

const tattooRequestsRoutes: FastifyPluginAsync = async (fastify, options) => {
  // Register multipart support for this route context
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
      files: 5 // Maximum 5 files
    }
  });

  // Initialize TattooRequestService
  const tattooRequestService = new TattooRequestService();
  
  // Decorate fastify instance
  if (!fastify.hasDecorator('tattooRequestService')) {
    fastify.decorate('tattooRequestService', tattooRequestService);
  }

  // GET /tattoo-requests - List tattoo requests (admin only)
  fastify.get('/', {
    // TODO: Re-enable auth after testing
    // preHandler: authorize(['artist', 'admin'] as UserRole[]),
    schema: {
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['new', 'reviewed', 'approved', 'rejected'] },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    const { status, page = 1, limit = 20 } = request.query as any;
    
    const result = await tattooRequestService.list({
      status,
      page,
      limit
    });
    
    return result;
  });
  
  // GET /tattoo-requests/:id - Get details of a specific tattoo request
  fastify.get('/:id', {
    // TODO: Re-enable auth after testing
    // preHandler: authorize(['artist', 'admin'] as UserRole[]),
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tattooRequest = await tattooRequestService.findById(id);
    return tattooRequest;
  });
  
  // POST /tattoo-requests - Submit a new tattoo request
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['description'],
        properties: {
          customerId: { type: 'string' },
          contactEmail: { type: 'string', format: 'email' },
          contactPhone: { type: 'string' },
          description: { type: 'string' },
          placement: { type: 'string' },
          size: { type: 'string' },
          colorPreference: { type: 'string' },
          style: { type: 'string' },
          purpose: { type: 'string' },
          preferredArtist: { type: 'string' },
          timeframe: { type: 'string' },
          contactPreference: { type: 'string' },
          additionalNotes: { type: 'string' },
          referenceImages: { 
            type: 'array',
            items: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                publicId: { type: 'string' }
              }
            }
          }
        },
        // Either customerId OR contactEmail must be provided
        oneOf: [
          { required: ['customerId'] },
          { required: ['contactEmail'] }
        ]
      }
    }
  }, async (request, reply) => {
    try {
      const { 
        customerId, 
        contactEmail,
        contactPhone,
        description, 
        placement, 
        size, 
        colorPreference, 
        style,
        purpose,
        preferredArtist,
        timeframe,
        contactPreference,
        additionalNotes,
        referenceImages 
      } = request.body as any;
      
      // Generate tracking token for anonymous requests
      const trackingToken = !customerId ? uuidv4() : null;
      
      // Create the tattoo request with the right structure
      const tattooRequestData: any = {
        description,
        placement,
        size,
        colorPreference,
        style,
        purpose,
        preferredArtist,
        timeframe,
        contactPreference,
        additionalNotes,
        referenceImages: referenceImages || []
      };
      
      // Add either customer ID or anonymous fields
      if (customerId) {
        tattooRequestData.customerId = customerId;
      } else {
        // Add anonymous request fields
        if (contactEmail) tattooRequestData.contactEmail = contactEmail;
        if (contactPhone) tattooRequestData.contactPhone = contactPhone;
        if (trackingToken) tattooRequestData.trackingToken = trackingToken;
      }
      
      // Create the tattoo request
      const tattooRequest = await fastify.prisma.tattooRequest.create({
        data: tattooRequestData
      });
      
      // Log the audit - only if user is available (optional for anonymous requests)
      try {
        await fastify.prisma.auditLog.create({
          data: {
            userId: request.user?.id || null,
            action: 'CREATE',
            resource: 'TattooRequest',
            resourceId: tattooRequest.id,
            details: { 
              tattooRequest,
              isAnonymous: !customerId
            }
          }
        });
      } catch (auditError) {
        // Log audit error but don't fail the request
        fastify.log.warn('Failed to create audit log:', auditError);
      }
      
      reply.type('application/json');
      return tattooRequest;
    } catch (error: any) {
      fastify.log.error(error, 'Error creating tattoo request');
      return reply.status(500).send({ 
        error: 'Failed to submit tattoo request',
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  
  // PUT /tattoo-requests/:id - Update a tattoo request
  fastify.put('/:id', {
    preHandler: authorize(['artist', 'admin'] as UserRole[]),
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['new', 'reviewed', 'approved', 'rejected'] },
          notes: { type: 'string' },
          customerId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status, notes, customerId } = request.body as any;
    
    if (status) {
      const updated = await tattooRequestService.updateStatus(id, status, request.user?.id);
      return updated;
    }
    
    // If not updating status, handle other updates
    const updateData: any = {};
    if (notes !== undefined) updateData.notes = notes;
    if (customerId !== undefined) updateData.customerId = customerId;
    
    const original = await fastify.prisma.tattooRequest.findUnique({ where: { id } });
    
    if (!original) {
      return reply.status(404).send({ error: 'Tattoo request not found' });
    }
    
    const updated = await fastify.prisma.tattooRequest.update({
      where: { id },
      data: updateData
    });
    
    // Log the audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.id,
        action: 'UPDATE',
        resource: 'TattooRequest',
        resourceId: id,
        details: { before: original, after: updated }
      }
    });
    
    reply.type('application/json');
    return updated;
  });

  // POST /tattoo-requests/:id/convert-to-appointment - Convert an approved tattoo request to an appointment
  fastify.post('/:id/convert-to-appointment', {
    preHandler: authorize(['artist', 'admin'] as UserRole[]),
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['startAt', 'duration'],
        properties: {
          startAt: { type: 'string', format: 'date-time' },
          duration: { type: 'integer', minimum: 30 }, // Duration in minutes
          artistId: { type: 'string' },
          bookingType: { 
            type: 'string', 
            enum: Object.values(BookingType),
            default: BookingType.TATTOO_SESSION
          },
          priceQuote: { type: 'number' },
          note: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { 
      startAt, 
      duration, 
      artistId = request.user?.id, 
      bookingType = BookingType.TATTOO_SESSION,
      priceQuote,
      note
    } = request.body as any;
    
    try {
      const result = await tattooRequestService.convertToAppointment(
        id,
        {
          startAt: new Date(startAt),
          duration,
          artistId,
          bookingType,
          priceQuote,
          note
        },
        request.user?.id
      );
      
      return result;
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: error.message });
    }
  });

  // POST /tattoo-requests/upload-images - Upload reference images
  fastify.post('/upload-images', {
    schema: {
      description: 'Upload reference images for tattoo requests',
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  publicId: { type: 'string' },
                  originalName: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const images: Array<{ url: string; publicId: string; originalName: string }> = [];
    const tempFiles: string[] = [];

    try {
      const files = await request.files();
      
      for await (const file of files) {
        // Create temp file path
        const tempFilePath = path.join(os.tmpdir(), `upload-${uuidv4()}-${file.filename}`);
        tempFiles.push(tempFilePath);
        
        // Save file to temp location
        await pipeline(file.file, fs.createWriteStream(tempFilePath));
        
        // Upload to Cloudinary (temporarily disabled)
        // const uploadResult = await cloudinaryService.uploadImage(
        //   tempFilePath,
        //   'tattoo-requests',
        //   ['tattoo-request', 'reference-image']
        // );
        // console.log('uploadResult', uploadResult);
        // if (uploadResult) {
        //   images.push({
        //     url: uploadResult.secureUrl,
        //     publicId: uploadResult.publicId,
        //     originalName: file.filename
        //   });
        // }
        
        // Temporary mock response for testing
        images.push({
          url: `http://localhost:3001/temp-image-${Date.now()}.jpg`,
          publicId: `temp-${Date.now()}`,
          originalName: file.filename
        });
      }
      
      // Clean up temp files
      for (const tempFile of tempFiles) {
        try {
          await fs.promises.unlink(tempFile);
        } catch (err) {
          // Log but don't throw - file cleanup is not critical
          fastify.log.warn(`Failed to delete temp file: ${tempFile}`);
        }
      }
      
      return { images };
    } catch (error) {
      // Clean up any temp files on error
      for (const tempFile of tempFiles) {
        try {
          await fs.promises.unlink(tempFile);
        } catch (err) {
          // Ignore cleanup errors
        }
      }
      
      fastify.log.error(error);
      return reply.status(500).send({ 
        error: 'Failed to upload images',
        message: error.message 
      });
    }
  });
};

export default tattooRequestsRoutes;

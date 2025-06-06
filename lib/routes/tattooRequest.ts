import { FastifyPluginAsync } from 'fastify';
import multipart from '@fastify/multipart';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/auth';
import { v4 as uuidv4 } from 'uuid';
import { TattooRequestService, CreateTattooRequestData, ConvertToAppointmentData } from '../services/tattooRequestService';
import { BookingType } from '../services/bookingService';
import { tattooRequestImageService } from '../services/tattooRequestImageService';
import { tattooRequestWorkflowService } from '../services/tattooRequestWorkflowService';
import { pipeline } from 'stream/promises';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { NotFoundError, ValidationError } from '../services/errors';
import CloudinaryService from '../cloudinary/index.js';

// Type definitions for request bodies and queries
interface TattooRequestQueryParams {
  status?: 'new' | 'reviewed' | 'approved' | 'rejected' | 'converted_to_appointment';
  page?: number;
  limit?: number;
}

interface ConvertToAppointmentBody {
  startAt: string;
  duration: number;
  artistId?: string;
  bookingType?: any;
  priceQuote?: number;
  note?: string;
}

const tattooRequestsRoutes: FastifyPluginAsync = async (fastify) => {
  // Register multipart support for image uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
      files: 5 // Maximum 5 files
    }
  });

  // Initialize service
  const tattooRequestService = new TattooRequestService();

  // GET /tattoo-requests - List tattoo requests (admin dashboard)
  fastify.get('/', {
    preHandler: [authenticate, authorize(['artist', 'admin'] as UserRole[])],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          status: { 
            type: 'string', 
            enum: ['new', 'reviewed', 'approved', 'rejected', 'converted_to_appointment'] 
          },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { status, page = 1, limit = 20 } = request.query as TattooRequestQueryParams;
      
      const result = await tattooRequestService.list({
        status,
        page,
        limit
      });
      
      return result;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
  
  // GET /tattoo-requests/:id - Get tattoo request details
  fastify.get('/:id', {
    preHandler: [authenticate, authorize(['artist', 'admin'] as UserRole[])],
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
    try {
      const { id } = request.params as { id: string };
      const tattooRequest = await tattooRequestService.findById(id);
      return tattooRequest;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
  
  // POST /tattoo-requests - Submit new tattoo request (public endpoint)
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['description'],
        properties: {
          customerId: { type: 'string' },
          contactEmail: { type: 'string', format: 'email' },
          contactPhone: { type: 'string' },
          description: { type: 'string', minLength: 10 },
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
      const requestData = request.body as CreateTattooRequestData;
      
      // Create via service (handles all business logic)
      const tattooRequest = await tattooRequestService.create(
        requestData,
        request.user?.id
      );
      
      return tattooRequest;
    } catch (error: unknown) {
      request.log.error(error, 'Error creating tattoo request');
      
      if (error instanceof ValidationError) {
        return reply.status(400).send({ error: error.message });
      }
      
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ error: error.message });
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ 
        error: 'Failed to submit tattoo request',
        message: errorMessage
      });
    }
  });
  
  // PUT /tattoo-requests/:id/status - Update status (admin workflow)
  fastify.put('/:id/status', {
    preHandler: [authenticate, authorize(['artist', 'admin'] as UserRole[])],
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
        required: ['status'],
        properties: {
          status: { 
            type: 'string', 
            enum: ['new', 'reviewed', 'approved', 'rejected', 'converted_to_appointment'] 
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: 'new' | 'reviewed' | 'approved' | 'rejected' | 'converted_to_appointment' };
      
      const updated = await tattooRequestService.updateStatus(id, status, request.user?.id);
      return updated;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ error: error.message });
      }
      
      if (error instanceof ValidationError) {
        return reply.status(400).send({ error: error.message });
      }
      
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // POST /tattoo-requests/:id/convert-to-appointment - Convert to appointment (admin action)
  fastify.post('/:id/convert-to-appointment', {
    preHandler: [authenticate, authorize(['artist', 'admin'] as UserRole[])],
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
          duration: { type: 'integer', minimum: 30 },
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
    try {
      const { id } = request.params as { id: string };
      const { 
        startAt, 
        duration, 
        artistId = request.user?.id, 
        bookingType = BookingType.TATTOO_SESSION,
        priceQuote,
        note
      } = request.body as ConvertToAppointmentBody;
      
      const result = await tattooRequestWorkflowService.convertToAppointment(
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
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        return reply.status(400).send({ error: error.message });
      }
      
      request.log.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: errorMessage });
    }
  });

  // POST /tattoo-requests/:id/link-images - Link existing Cloudinary images to tattoo request
  fastify.post('/:id/link-images', {
    preHandler: [authenticate, authorize(['artist', 'admin'] as UserRole[])],
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
        required: ['publicIds'],
        properties: {
          publicIds: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { publicIds } = request.body as { publicIds: string[] };
      
      await tattooRequestImageService.linkImagesToRequest(id, publicIds, request.user?.id);
      
      reply.code(200).send({ 
        message: 'Images linked successfully',
        linkedCount: publicIds.length 
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ error: error.message });
      }
      
      if (error instanceof ValidationError) {
        return reply.status(400).send({ error: error.message });
      }
      
      request.log.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ 
        error: 'Failed to link images',
        message: errorMessage
      });
    }
  });

  // POST /tattoo-requests/upload-images - Upload reference images (public endpoint)
  fastify.post('/upload-images', {
    schema: {
      description: 'Upload reference images for tattoo requests',
      consumes: ['multipart/form-data'],
      body: {
        type: 'object',
        properties: {
          tattooRequestId: { type: 'string' },
          customerId: { type: 'string' }
        }
      },
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
      const parts = request.files();
      let tattooRequestId: string | undefined;
      let customerId: string | undefined;
      
      // Process all parts (fields and files)
      for await (const part of parts) {
        if (part.type === 'field') {
          const value = part.value as string;
          if (part.fieldname === 'tattooRequestId') {
            tattooRequestId = value;
          } else if (part.fieldname === 'customerId') {
            customerId = value;
          }
        } else if (part.type === 'file') {
          // Create temp file path
          const tempFilePath = path.join(os.tmpdir(), `upload-${uuidv4()}-${part.filename}`);
          tempFiles.push(tempFilePath);
          
          // Save file to temp location
          await pipeline(part.file, fs.createWriteStream(tempFilePath));
          
          // Upload to Cloudinary using the existing service
          try {
            const cloudinaryResult = await CloudinaryService.uploadImage(
              tempFilePath,
              CloudinaryService.CLOUDINARY_FOLDERS.TATTOO_REQUESTS,
              ['tattoo_request', 'customer_upload', ...(customerId ? [`customer_${customerId}`] : [])],
              {
                ...(tattooRequestId && { tattoo_request_id: tattooRequestId }),
                ...(customerId && { customer_id: customerId }),
                upload_type: 'tattoo_request_reference',
                original_name: part.filename
              }
            );
            
            if (cloudinaryResult) {
              images.push({
                url: cloudinaryResult.secureUrl,
                publicId: cloudinaryResult.publicId,
                originalName: part.filename
              });
            } else {
              request.log.warn(`Failed to upload ${part.filename} to Cloudinary`);
            }
          } catch (uploadError) {
            request.log.error(uploadError, `Error uploading ${part.filename} to Cloudinary`);
            // Continue with other files instead of failing completely
          }
        }
      }
      
      // Clean up temp files
      for (const tempFile of tempFiles) {
        try {
          await fs.promises.unlink(tempFile);
        } catch {
          fastify.log.warn(`Failed to delete temp file: ${tempFile}`);
        }
      }
      
      return { images };
    } catch (error) {
      // Clean up any temp files on error
      for (const tempFile of tempFiles) {
        try {
          await fs.promises.unlink(tempFile);
        } catch {
          // Ignore cleanup errors
        }
      }
      
      fastify.log.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ 
        error: 'Failed to upload images',
        message: errorMessage
      });
    }
  });
};

export default tattooRequestsRoutes;

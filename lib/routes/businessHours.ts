import { FastifyPluginAsync } from 'fastify';
import { authenticate, authorize } from '../middleware/auth';
import { readRateLimit, writeRateLimit } from '../middleware/rateLimiting';
import { UserRole } from '../types/auth';
import { z } from 'zod';
import { DEFAULT_BUSINESS_HOURS } from '../services/availability/constants';

// Schema for business hours
const businessHoursSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  isOpen: z.boolean()
});

const specialHoursSchema = z.object({
  date: z.string().datetime(),
  openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).nullable(),
  closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).nullable(),
  isClosed: z.boolean(),
  reason: z.string().optional()
});

const businessHoursRoutes: FastifyPluginAsync = async (fastify) => {
  const { auditService, availabilityService } = fastify.services;
  const { prisma } = fastify;

  // GET /business-hours - Get all business hours
  fastify.get('/', {
    preHandler: readRateLimit(),
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            businessHours: { type: 'array' },
            source: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Check if prisma is available
      if (!prisma) {
        fastify.log.error('Prisma client not available');
        return reply.status(500).send({
          success: false,
          error: 'Database connection not available'
        });
      }

      // Try to get from database first
      let businessHours = await prisma.businessHours.findMany({
        orderBy: { dayOfWeek: 'asc' }
      });

      let source = 'database';

      // If no business hours in database, use defaults and create them
      if (businessHours.length === 0) {
        source = 'defaults';
        
        // Create default business hours in database
        const createPromises = DEFAULT_BUSINESS_HOURS.map(hours => 
          prisma.businessHours.create({
            data: {
              dayOfWeek: hours.dayOfWeek,
              openTime: hours.openTime,
              closeTime: hours.closeTime,
              isOpen: hours.isOpen
            }
          })
        );

        businessHours = await Promise.all(createPromises);
        
        // Log the initialization
        if (auditService) {
          await auditService.log({
            action: 'business_hours_initialized',
            resource: 'business_hours',
            userId: 'system',
            details: {
              message: 'Default business hours created in database'
            }
          });
        }
      }

      return reply.send({
        success: true,
        businessHours,
        source
      });
    } catch (error) {
      fastify.log.error('Error fetching business hours:', error);
      
      // More detailed error for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = process.env.NODE_ENV === 'development' ? {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      } : undefined;
      
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch business hours',
        details: errorDetails
      });
    }
  });

  // PUT /business-hours/:dayOfWeek - Update business hours for a specific day
  fastify.put('/:dayOfWeek', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), writeRateLimit()],
    schema: {
      params: {
        type: 'object',
        required: ['dayOfWeek'],
        properties: {
          dayOfWeek: { type: 'number', minimum: 0, maximum: 6 }
        }
      },
      body: {
        type: 'object',
        required: ['openTime', 'closeTime', 'isOpen'],
        properties: {
          openTime: { type: 'string' },
          closeTime: { type: 'string' },
          isOpen: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { dayOfWeek } = request.params as { dayOfWeek: number };
      const validatedData = businessHoursSchema.parse({
        ...request.body,
        dayOfWeek
      });

      // Update or create business hours
      const updated = await prisma.businessHours.upsert({
        where: { dayOfWeek },
        update: {
          openTime: validatedData.openTime,
          closeTime: validatedData.closeTime,
          isOpen: validatedData.isOpen,
          updatedAt: new Date()
        },
        create: {
          dayOfWeek,
          openTime: validatedData.openTime,
          closeTime: validatedData.closeTime,
          isOpen: validatedData.isOpen
        }
      });

      // Update the in-memory business hours in AvailabilityService
      await availabilityService.updateBusinessHours();

      // Log the change
      await auditService.log({
        action: 'business_hours_updated',
        resource: 'business_hours',
        resourceId: updated.id,
        userId: request.user?.id,
        details: {
          dayOfWeek,
          oldValues: await prisma.businessHours.findUnique({ where: { dayOfWeek } }),
          newValues: validatedData
        }
      });

      return reply.send({
        success: true,
        businessHours: updated
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid input',
          details: error.errors
        });
      }
      
      fastify.log.error('Error updating business hours:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update business hours'
      });
    }
  });

  // GET /business-hours/special - Get special hours (holidays, etc.)
  fastify.get('/special', {
    preHandler: readRateLimit(),
    schema: {
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            specialHours: { type: 'array' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

      const where: any = {};
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }

      const specialHours = await prisma.specialHours.findMany({
        where,
        orderBy: { date: 'asc' }
      });

      return reply.send({
        success: true,
        specialHours
      });
    } catch (error) {
      fastify.log.error('Error fetching special hours:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch special hours'
      });
    }
  });

  // POST /business-hours/special - Create special hours
  fastify.post('/special', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), writeRateLimit()],
    schema: {
      body: {
        type: 'object',
        required: ['date'],
        properties: {
          date: { type: 'string' },
          openTime: { type: ['string', 'null'] },
          closeTime: { type: ['string', 'null'] },
          isClosed: { type: 'boolean' },
          reason: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const validatedData = specialHoursSchema.parse(request.body);

      // Check if special hours already exist for this date
      const existing = await prisma.specialHours.findUnique({
        where: { date: new Date(validatedData.date) }
      });

      if (existing) {
        return reply.status(409).send({
          success: false,
          error: 'Special hours already exist for this date'
        });
      }

      const specialHours = await prisma.specialHours.create({
        data: {
          date: new Date(validatedData.date),
          openTime: validatedData.openTime,
          closeTime: validatedData.closeTime,
          isClosed: validatedData.isClosed,
          reason: validatedData.reason
        }
      });

      // Log the creation
      await auditService.log({
        action: 'special_hours_created',
        resource: 'special_hours',
        resourceId: specialHours.id,
        userId: request.user?.id,
        details: validatedData
      });

      return reply.send({
        success: true,
        specialHours
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid input',
          details: error.errors
        });
      }
      
      fastify.log.error('Error creating special hours:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to create special hours'
      });
    }
  });

  // PUT /business-hours/special/:date - Update special hours
  fastify.put('/special/:date', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), writeRateLimit()],
    schema: {
      params: {
        type: 'object',
        required: ['date'],
        properties: {
          date: { type: 'string', format: 'date' }
        }
      },
      body: {
        type: 'object',
        properties: {
          openTime: { type: ['string', 'null'] },
          closeTime: { type: ['string', 'null'] },
          isClosed: { type: 'boolean' },
          reason: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { date } = request.params as { date: string };
      const updates = request.body as Partial<z.infer<typeof specialHoursSchema>>;

      const specialHours = await prisma.specialHours.update({
        where: { date: new Date(date) },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      // Log the update
      await auditService.log({
        action: 'special_hours_updated',
        resource: 'special_hours',
        resourceId: specialHours.id,
        userId: request.user?.id,
        details: {
          date,
          updates
        }
      });

      return reply.send({
        success: true,
        specialHours
      });
    } catch (error) {
      fastify.log.error('Error updating special hours:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update special hours'
      });
    }
  });

  // DELETE /business-hours/special/:date - Delete special hours
  fastify.delete('/special/:date', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), writeRateLimit()],
    schema: {
      params: {
        type: 'object',
        required: ['date'],
        properties: {
          date: { type: 'string', format: 'date' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { date } = request.params as { date: string };

      const deleted = await prisma.specialHours.delete({
        where: { date: new Date(date) }
      });

      // Log the deletion
      await auditService.log({
        action: 'special_hours_deleted',
        resource: 'special_hours',
        resourceId: deleted.id,
        userId: request.user?.id,
        details: {
          date,
          deletedRecord: deleted
        }
      });

      return reply.send({
        success: true,
        message: 'Special hours deleted successfully'
      });
    } catch (error) {
      fastify.log.error('Error deleting special hours:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete special hours'
      });
    }
  });

  // GET /business-hours/check/:date - Check if shop is open on a specific date/time
  fastify.get('/check/:date', {
    preHandler: readRateLimit(),
    schema: {
      params: {
        type: 'object',
        required: ['date'],
        properties: {
          date: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          time: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            isOpen: { type: 'boolean' },
            hours: { type: 'object' },
            specialHours: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { date } = request.params as { date: string };
      const { time } = request.query as { time?: string };
      
      const checkDate = new Date(date);
      const dayOfWeek = checkDate.getDay();

      // Check for special hours first
      const specialHours = await prisma.specialHours.findUnique({
        where: { date: checkDate }
      });

      if (specialHours) {
        const isOpen = !specialHours.isClosed;
        return reply.send({
          success: true,
          isOpen: time ? isTimeInRange(time, specialHours.openTime, specialHours.closeTime) && isOpen : isOpen,
          hours: {
            openTime: specialHours.openTime,
            closeTime: specialHours.closeTime,
            reason: specialHours.reason
          },
          specialHours: true
        });
      }

      // Get regular business hours
      const businessHours = await prisma.businessHours.findUnique({
        where: { dayOfWeek }
      });

      if (!businessHours) {
        return reply.send({
          success: true,
          isOpen: false,
          hours: null,
          specialHours: false
        });
      }

      const isOpen = businessHours.isOpen;
      return reply.send({
        success: true,
        isOpen: time ? isTimeInRange(time, businessHours.openTime, businessHours.closeTime) && isOpen : isOpen,
        hours: {
          openTime: businessHours.openTime,
          closeTime: businessHours.closeTime
        },
        specialHours: false
      });
    } catch (error) {
      fastify.log.error('Error checking business hours:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to check business hours'
      });
    }
  });
};

// Helper function to check if a time is within a range
function isTimeInRange(time: string, openTime: string | null, closeTime: string | null): boolean {
  if (!openTime || !closeTime) return false;
  
  const [checkHour, checkMinute] = time.split(':').map(Number);
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);
  
  const checkMinutes = checkHour * 60 + checkMinute;
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;
  
  return checkMinutes >= openMinutes && checkMinutes <= closeMinutes;
}

export default businessHoursRoutes;
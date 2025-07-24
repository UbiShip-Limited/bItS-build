import { FastifyPluginAsync } from 'fastify';
import { realtimeService } from '../services/realtimeService';

const eventsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /events - Server-Sent Events endpoint
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          eventTypes: { type: 'string' }, // comma-separated event types
          lastEventId: { type: 'string' }
        },
        required: ['userId']
      }
    }
  }, async (request, reply) => {
    const { userId, eventTypes, lastEventId } = request.query as {
      userId: string;
      eventTypes?: string;
      lastEventId?: string;
    };

    // Set headers for Server-Sent Events
    reply.header('Content-Type', 'text/event-stream');
    reply.header('Cache-Control', 'no-cache');
    reply.header('Connection', 'keep-alive');
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Headers', 'Cache-Control');

    // Parse event types or use defaults
    const eventTypesList = eventTypes 
      ? eventTypes.split(',')
      : [
          'appointment_created', 
          'payment_received', 
          'request_submitted',
          'request_reviewed',
          'request_approved',
          'request_rejected',
          'appointment_approved',
          'email_sent'
        ];

    try {
      // Get initial events
      const events = await realtimeService.getEventsForSSE({
        userId,
        eventTypes: eventTypesList,
        lastEventId
      });

      // Send initial events
      for (const event of events) {
        reply.raw.write(`id: ${event.id}\n`);
        reply.raw.write(`event: ${event.type}\n`);
        reply.raw.write(`data: ${JSON.stringify({
          id: event.id,
          type: event.type,
          data: event.data,
          timestamp: event.timestamp,
          userId: event.userId
        })}\n\n`);
      }

      // Send keep-alive ping every 30 seconds
      const keepAliveInterval = setInterval(() => {
        try {
          // Check if connection is still alive before writing
          if (!reply.raw.destroyed && !reply.raw.writableEnded) {
            reply.raw.write(': keep-alive\n\n');
          } else {
            clearInterval(keepAliveInterval);
            fastify.log.info(`SSE keep-alive stopped - connection closed for user ${userId}`);
          }
        } catch (error) {
          clearInterval(keepAliveInterval);
          fastify.log.warn(`SSE keep-alive write failed for user ${userId}:`, error.message);
        }
      }, 30000);

      // Clean up on connection close
      request.raw.on('close', () => {
        clearInterval(keepAliveInterval);
        fastify.log.info(`SSE connection closed for user ${userId}`);
      });

      request.raw.on('error', (error) => {
        clearInterval(keepAliveInterval);
        const errorMessage = error?.message || 'Unknown error';
        const errorCode = error?.code || 'UNKNOWN';
        
        // Log specific error types with more context
        if (errorCode === 'ECONNRESET') {
          fastify.log.warn(`SSE connection reset by client for user ${userId}`);
        } else if (errorCode === 'EPIPE') {
          fastify.log.warn(`SSE broken pipe for user ${userId} - client disconnected`);
        } else {
          fastify.log.error(`SSE connection error for user ${userId}:`, {
            code: errorCode,
            message: errorMessage,
            stack: error?.stack
          });
        }
      });

      // Handle response errors
      reply.raw.on('error', (error) => {
        clearInterval(keepAliveInterval);
        fastify.log.error(`SSE response error for user ${userId}:`, error);
      });

      // Keep connection alive
      return reply.hijack();

    } catch (error) {
      fastify.log.error('Error in events SSE endpoint:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // GET /events/stats - Get event statistics (for debugging)
  fastify.get('/stats', async (request, reply) => {
    try {
      const stats = realtimeService.getStats();
      return { stats };
    } catch (error) {
      fastify.log.error('Error getting event stats:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
};

export default eventsRoutes; 
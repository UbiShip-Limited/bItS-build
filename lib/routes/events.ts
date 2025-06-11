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
      : ['appointment_created', 'payment_received', 'request_submitted'];

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
          reply.raw.write(': keep-alive\n\n');
        } catch (error) {
          clearInterval(keepAliveInterval);
        }
      }, 30000);

      // Clean up on connection close
      request.raw.on('close', () => {
        clearInterval(keepAliveInterval);
        fastify.log.info(`SSE connection closed for user ${userId}`);
      });

      request.raw.on('error', (error) => {
        clearInterval(keepAliveInterval);
        fastify.log.error(`SSE connection error for user ${userId}:`, error);
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
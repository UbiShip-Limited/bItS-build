import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getAuthStatus, verifySession } from '../controllers/authController';
import { authenticate, requireAdmin } from '../../middleware/auth';

const authRoutes = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  // Verify session token (no auth required)
  fastify.post('/verify', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            authenticated: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                isAdmin: { type: 'boolean' }
              }
            }
          }
        }
      }
    },
    handler: verifySession
  });
  
  // Get current auth status (requires authentication)
  fastify.get('/status', {
    preHandler: authenticate,
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            authenticated: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                isAdmin: { type: 'boolean' }
              }
            }
          }
        }
      }
    },
    handler: getAuthStatus
  });
  
  // Example protected admin route
  fastify.get('/admin-only', {
    preHandler: requireAdmin,
    handler: async (request, reply) => {
      return {
        message: 'You have admin access',
        user: request.user
      };
    }
  });
};

export default authRoutes; 
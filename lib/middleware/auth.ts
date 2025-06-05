import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { supabase } from '../supabase/supabaseClient';
import { UserRole, UserWithRole } from '../types/auth';

// Test user for controlled test environment only
const TEST_USER: UserWithRole = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'artist' as UserRole,
  aud: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  // Only use test mode in actual test environment with explicit flag
  if (process.env.NODE_ENV === 'test' && process.env.BYPASS_AUTH === 'true') {
    request.log.warn('⚠️  Using test authentication bypass - should only be used in tests');
    request.user = TEST_USER;
    return;
  }
  
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ 
      error: 'Authentication required',
      message: 'Valid Bearer token is required'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Validate token format (basic check)
  if (!token || token.length < 10) {
    return reply.status(401).send({ 
      error: 'Invalid token format',
      message: 'Token appears to be malformed'
    });
  }
  
  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return reply.status(401).send({ 
        error: 'Invalid or expired token',
        message: error?.message || 'Authentication failed'
      });
    }
    
    // Get user role from database
    const userWithRole = await request.server.prisma.user.findUnique({
      where: { id: data.user.id },
      select: { role: true, email: true }
    });
    
    if (!userWithRole) {
      return reply.status(403).send({ 
        error: 'User not found in system',
        message: 'Please contact an administrator to set up your account'
      });
    }
    
    // Attach the user to the request for use in route handlers
    request.user = {
      ...data.user,
      role: userWithRole.role as UserRole
    };
  } catch (err) {
    request.log.error(err, 'Authentication error');
    return reply.status(500).send({ 
      error: 'Authentication failed',
      message: 'An internal server error occurred during authentication'
    });
  }
}

// Role-based access control middleware
export function authorize(allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Only use test mode in actual test environment with explicit flag
    if (process.env.NODE_ENV === 'test' && process.env.BYPASS_AUTH === 'true') {
      request.log.warn('⚠️  Using test authorization bypass - should only be used in tests');
      return;
    }

    if (!request.user) {
      return reply.status(401).send({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }
    
    try {
      if (!request.user.role || !allowedRoles.includes(request.user.role)) {
        request.log.warn(`Access denied for user ${request.user.id} with role ${request.user.role}. Required: ${allowedRoles.join(' or ')}`);
        return reply.status(403).send({ 
          error: 'Insufficient permissions',
          message: `Required role: ${allowedRoles.join(' or ')}`
        });
      }
    } catch (err) {
      request.log.error(err, 'Authorization error');
      return reply.status(500).send({ 
        error: 'Authorization failed',
        message: 'An internal server error occurred during authorization'
      });
    }
  };
}

// Mock authentication for test environment only
export function mockAuthenticate(userId: string = 'test-user-id', role: UserRole = 'artist') {
  return (request: FastifyRequest, _reply: FastifyReply) => {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Mock authentication can only be used in test environment');
    }
    
    request.user = {
      ...TEST_USER,
      id: userId,
      role
    };
  };
}

// Utility hook to apply authentication to all routes in a plugin
export function requireAuth(instance: FastifyInstance, options: Record<string, unknown>, done: () => void) {
  instance.addHook('preHandler', authenticate);
  done();
}

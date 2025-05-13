import { FastifyRequest, FastifyReply } from 'fastify';
import supabaseAuth from '../integrations/supabase/auth';
import { AuthenticatedUser, Role } from '../types/user';
import { UserService } from '../services/userService';

// Initialize UserService
const userService = new UserService();

/**
 * Extend FastifyRequest to include user data
 */
declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

/**
 * Extract JWT token from Authorization header
 */
const extractToken = (request: FastifyRequest): string | null => {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Skip "Bearer " prefix
};

/**
 * JWT authentication middleware - verifies token and attaches user to request
 */
export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const token = extractToken(request);
  
  if (!token) {
    reply.status(401).send({
      error: 'Authentication required',
      message: 'No valid authentication token provided'
    });
    return;
  }
  
  const { valid, user, error } = await supabaseAuth.verifyToken(token);
  
  if (!valid || !user) {
    reply.status(401).send({
      error: 'Authentication failed',
      message: error || 'Invalid or expired token'
    });
    return;
  }
  
  try {
    // Ensure user exists in our database
    await userService.upsertUser({
      id: user.id,
      email: user.email || '',
    });
    
    // Check if user has admin role
    const isAdmin = await userService.isUserAdmin(user.id);
    
    // Attach user data to request for use in route handlers
    request.user = {
      id: user.id,
      email: user.email || '',
      role: isAdmin ? Role.ADMIN : Role.USER,
      isAdmin
    };
  } catch (err) {
    console.error('Error in authentication middleware:', err);
    reply.status(500).send({
      error: 'Server error',
      message: 'Failed to authenticate user'
    });
    return;
  }
};

/**
 * Role-based access control middleware - ensures user has required role
 * @param requiredRole The role required to access the route
 */
export const requireRole = (requiredRole: Role = Role.ADMIN) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // First authenticate the user
    await authenticate(request, reply);
    
    // If the request was authenticated but didn't proceed (reply sent), return early
    if (reply.sent) return;
    
    // At this point, user should be defined due to authenticate middleware
    if (!request.user) {
      reply.status(500).send({
        error: 'Server error',
        message: 'User authentication state is inconsistent'
      });
      return;
    }
    
    // Check if user has required role
    // For simplicity, we're treating ADMIN as a super-role that has access to everything
    if (request.user.role !== requiredRole && request.user.role !== Role.ADMIN) {
      reply.status(403).send({
        error: 'Access denied',
        message: `Requires ${requiredRole} role`
      });
      return;
    }
  };
};

/**
 * Admin-only middleware - ensures user is an admin
 */
export const requireAdmin = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  // First authenticate the user
  await authenticate(request, reply);
  
  // If the request was authenticated but didn't proceed (reply sent), return early
  if (reply.sent) return;
  
  // At this point, user should be defined due to authenticate middleware
  if (!request.user) {
    reply.status(500).send({
      error: 'Server error',
      message: 'User authentication state is inconsistent'
    });
    return;
  }
  
  // Check if user is an admin
  if (!request.user.isAdmin) {
    reply.status(403).send({
      error: 'Access denied',
      message: 'Requires admin privileges'
    });
    return;
  }
}; 
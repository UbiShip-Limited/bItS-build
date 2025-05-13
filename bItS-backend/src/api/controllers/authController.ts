import { FastifyRequest, FastifyReply } from 'fastify';
import supabaseAuth from '../../integrations/supabase/auth';
import { UserService } from '../../services/userService';
import { Role } from '../../types/user';

// Initialize user service
const userService = new UserService();

interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Check the authenticated user's status
 */
export const getAuthStatus = async (request: FastifyRequest, reply: FastifyReply) => {
  // The user is already authenticated at this point via middleware
  return { 
    authenticated: true,
    user: request.user 
  };
};

/**
 * Login user via Supabase
 * Note: Actual authentication is handled by Supabase client-side
 * This endpoint just verifies token from the client
 */
export const verifySession = async (
  request: FastifyRequest<{ Headers: { authorization?: string } }>,
  reply: FastifyReply
) => {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'Authentication required',
      message: 'No valid authentication token provided'
    });
  }
  
  const token = authHeader.substring(7); // Skip "Bearer " prefix
  
  const { valid, user, error } = await supabaseAuth.verifyToken(token);
  
  if (!valid || !user) {
    return reply.status(401).send({
      error: 'Authentication failed',
      message: error || 'Invalid or expired token'
    });
  }
  
  // Ensure user exists in our Prisma database
  try {
    await userService.upsertUser({
      id: user.id,
      email: user.email || '',
    });
  } catch (err) {
    console.error('Failed to sync Supabase user to database:', err);
  }
  
  // Check if user has an admin role
  const isAdmin = await userService.isUserAdmin(user.id);
  
  return {
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      role: isAdmin ? Role.ADMIN : Role.USER,
      isAdmin
    }
  };
}; 
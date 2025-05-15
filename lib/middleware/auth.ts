import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../supabase/supabaseClient';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return reply.status(401).send({ error: 'Invalid or expired token' });
    }
    
    // Attach the user to the request for use in route handlers
    request.user = data.user;
  } catch (err) {
    request.log.error(err, 'Authentication error');
    return reply.status(500).send({ error: 'Authentication failed' });
  }
}

// Role-based access control middleware
export function authorize(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    try {
      // Get the user's role from the database
      const user = await request.server.prisma.user.findUnique({
        where: { id: request.user.id }
      });
      
      if (!user || !allowedRoles.includes(user.role)) {
        return reply.status(403).send({ error: 'Insufficient permissions' });
      }
    } catch (err) {
      request.log.error(err, 'Authorization error');
      return reply.status(500).send({ error: 'Authorization failed' });
    }
  };
}

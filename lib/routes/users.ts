import { FastifyPluginAsync } from 'fastify';
import { UserService, CreateUserData, UpdateUserData } from '../services/userService';
import { authorize } from '../middleware/auth';
import { UserRole, canManageUsers } from '../types/auth';
import { ValidationError, NotFoundError } from '../services/errors';

const userService = new UserService();

interface CreateUserBody extends CreateUserData {}

interface UpdateUserBody extends UpdateUserData {}

interface UserParams {
  id: string;
}

interface PaginationQuery {
  page?: number;
  limit?: number;
}

const userRoutes: FastifyPluginAsync = async (fastify) => {
  
  // GET /users/me - Get current user profile
  fastify.get('/me', {
    preHandler: authorize(['artist', 'assistant', 'admin'] as UserRole[])
  }, async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return reply.status(401).send({ error: 'Authorization header required' });
      }
      
      const token = authHeader.split(' ')[1];
      const user = await userService.getCurrentUser(token);
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // GET /users - List all users (admin only)
  fastify.get('/', {
    preHandler: authorize(['admin'] as UserRole[]),
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { page = 1, limit = 20 } = request.query as PaginationQuery;
      
      // Double-check authorization
      if (!canManageUsers(request.user?.role as UserRole)) {
        return reply.status(403).send({ error: 'Insufficient permissions' });
      }
      
      const result = await userService.listUsers(page, limit);
      
      return {
        success: true,
        ...result
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // GET /users/:id - Get user by ID (admin only)
  fastify.get('/:id', {
    preHandler: authorize(['admin'] as UserRole[]),
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
      const { id } = request.params as UserParams;
      
      // Double-check authorization
      if (!canManageUsers(request.user?.role as UserRole)) {
        return reply.status(403).send({ error: 'Insufficient permissions' });
      }
      
      const user = await userService.getUserById(id);
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at,
          email_confirmed_at: user.email_confirmed_at,
          last_sign_in_at: user.last_sign_in_at
        }
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // POST /users - Create new user (admin only)
  fastify.post('/', {
    preHandler: authorize(['admin'] as UserRole[]),
    schema: {
      body: {
        type: 'object',
        required: ['email', 'role'],
        properties: {
          email: { type: 'string', format: 'email' },
          role: { 
            type: 'string', 
            enum: ['artist', 'assistant', 'admin'] 
          },
          password: { type: 'string', minLength: 8 },
          sendInvite: { type: 'boolean', default: false }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userData = request.body as CreateUserBody;
      
      // Double-check authorization
      if (!canManageUsers(request.user?.role as UserRole)) {
        return reply.status(403).send({ error: 'Insufficient permissions' });
      }
      
      // Validate input
      if (!userData.password && !userData.sendInvite) {
        return reply.status(400).send({ 
          error: 'Either password or sendInvite must be provided' 
        });
      }
      
      const user = await userService.createUser(userData, request.user?.id);
      
      return reply.status(201).send({
        success: true,
        message: userData.sendInvite 
          ? 'User invitation sent successfully' 
          : 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          created_at: user.created_at
        }
      });
    } catch (error) {
      request.log.error(error);
      
      if (error instanceof ValidationError) {
        return reply.status(400).send({ error: error.message });
      }
      
      return reply.status(500).send({ 
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // PUT /users/:id - Update user (admin only)
  fastify.put('/:id', {
    preHandler: authorize(['admin'] as UserRole[]),
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
          email: { type: 'string', format: 'email' },
          role: { 
            type: 'string', 
            enum: ['artist', 'assistant', 'admin'] 
          },
          password: { type: 'string', minLength: 8 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as UserParams;
      const updateData = request.body as UpdateUserBody;
      
      // Double-check authorization
      if (!canManageUsers(request.user?.role as UserRole)) {
        return reply.status(403).send({ error: 'Insufficient permissions' });
      }
      
      // Prevent admin from demoting themselves
      if (id === request.user?.id && updateData.role && updateData.role !== 'admin') {
        return reply.status(400).send({ 
          error: 'Cannot change your own admin role' 
        });
      }
      
      const user = await userService.updateUser(id, updateData);
      
      return {
        success: true,
        message: 'User updated successfully',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          updated_at: user.updated_at
        }
      };
    } catch (error) {
      request.log.error(error);
      
      if (error instanceof ValidationError) {
        return reply.status(400).send({ error: error.message });
      }
      
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ error: error.message });
      }
      
      return reply.status(500).send({ 
        error: 'Failed to update user',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // DELETE /users/:id - Delete user (admin only)
  fastify.delete('/:id', {
    preHandler: authorize(['admin'] as UserRole[]),
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
      const { id } = request.params as UserParams;
      
      // Double-check authorization
      if (!canManageUsers(request.user?.role as UserRole)) {
        return reply.status(403).send({ error: 'Insufficient permissions' });
      }
      
      // Prevent admin from deleting themselves
      if (id === request.user?.id) {
        return reply.status(400).send({ 
          error: 'Cannot delete your own account' 
        });
      }
      
      await userService.deleteUser(id);
      
      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      request.log.error(error);
      
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ error: error.message });
      }
      
      return reply.status(500).send({ 
        error: 'Failed to delete user',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // PUT /users/me/password - Update current user's password
  fastify.put('/me/password', {
    preHandler: authorize(['artist', 'assistant', 'admin'] as UserRole[]),
    schema: {
      body: {
        type: 'object',
        required: ['newPassword'],
        properties: {
          newPassword: { type: 'string', minLength: 8 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { newPassword } = request.body as { newPassword: string };
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.status(401).send({ error: 'User not authenticated' });
      }
      
      await userService.updatePassword(userId, newPassword);
      
      return {
        success: true,
        message: 'Password updated successfully'
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ 
        error: 'Failed to update password',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
};

export default userRoutes; 
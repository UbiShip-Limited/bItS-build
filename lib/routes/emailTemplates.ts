import { FastifyPluginAsync } from 'fastify';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/auth';
import { emailTemplateService } from '../services/emailTemplateService';
import { ValidationError, NotFoundError } from '../services/errors';
import { readRateLimit, writeRateLimit } from '../middleware/rateLimiting';

interface EmailTemplateParams {
  id: string;
}

interface CreateEmailTemplateBody {
  name: string;
  displayName: string;
  subject: string;
  body: string;
  htmlBody?: string;
  variables: Record<string, string>;
  isActive?: boolean;
}

interface UpdateEmailTemplateBody {
  displayName?: string;
  subject?: string;
  body?: string;
  htmlBody?: string;
  variables?: Record<string, string>;
  isActive?: boolean;
}

interface PreviewEmailTemplateBody {
  sampleData: Record<string, any>;
}

interface SendTestEmailBody {
  to: string;
  sampleData: Record<string, any>;
}

const emailTemplatesRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /email-templates - List all email templates
  fastify.get('/', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), readRateLimit()],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          isActive: { type: 'boolean' },
          search: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { isActive, search } = request.query as { isActive?: boolean; search?: string };
      
      const templates = await emailTemplateService.list({
        isActive,
        search
      });
      
      return templates;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to list email templates' });
    }
  });

  // GET /email-templates/:id - Get single email template
  fastify.get<{ Params: EmailTemplateParams }>('/:id', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), readRateLimit()],
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
      const { id } = request.params;
      const template = await emailTemplateService.findById(id);
      return template;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to get email template' });
    }
  });

  // POST /email-templates - Create new email template
  fastify.post<{ Body: CreateEmailTemplateBody }>('/', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), writeRateLimit()],
    schema: {
      body: {
        type: 'object',
        required: ['name', 'displayName', 'subject', 'body', 'variables'],
        properties: {
          name: { type: 'string', pattern: '^[a-z_]+$' },
          displayName: { type: 'string' },
          subject: { type: 'string' },
          body: { type: 'string' },
          htmlBody: { type: 'string' },
          variables: { 
            type: 'object',
            additionalProperties: { type: 'string' }
          },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const template = await emailTemplateService.create(
        request.body,
        request.user?.id
      );
      
      return reply.status(201).send(template);
    } catch (error) {
      if (error instanceof ValidationError) {
        return reply.status(400).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to create email template' });
    }
  });

  // PUT /email-templates/:id - Update email template
  fastify.put<{ 
    Params: EmailTemplateParams;
    Body: UpdateEmailTemplateBody;
  }>('/:id', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), writeRateLimit()],
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
          displayName: { type: 'string' },
          subject: { type: 'string' },
          body: { type: 'string' },
          htmlBody: { type: 'string' },
          variables: { 
            type: 'object',
            additionalProperties: { type: 'string' }
          },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const template = await emailTemplateService.update(
        id,
        request.body,
        request.user?.id
      );
      
      return template;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ error: error.message });
      }
      if (error instanceof ValidationError) {
        return reply.status(400).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to update email template' });
    }
  });

  // DELETE /email-templates/:id - Delete email template
  fastify.delete<{ Params: EmailTemplateParams }>('/:id', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), writeRateLimit()],
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
      const { id } = request.params;
      await emailTemplateService.delete(id, request.user?.id);
      
      return reply.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete email template' });
    }
  });

  // POST /email-templates/:id/preview - Preview email template with sample data
  fastify.post<{ 
    Params: EmailTemplateParams;
    Body: PreviewEmailTemplateBody;
  }>('/:id/preview', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), readRateLimit()],
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
        required: ['sampleData'],
        properties: {
          sampleData: { 
            type: 'object',
            additionalProperties: true
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { sampleData } = request.body;
      
      const preview = await emailTemplateService.preview(id, sampleData);
      
      return preview;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to preview email template' });
    }
  });

  // POST /email-templates/:id/test - Send test email
  fastify.post<{ 
    Params: EmailTemplateParams;
    Body: SendTestEmailBody;
  }>('/:id/test', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), writeRateLimit()],
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
        required: ['to', 'sampleData'],
        properties: {
          to: { type: 'string', format: 'email' },
          sampleData: { 
            type: 'object',
            additionalProperties: true
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { to, sampleData } = request.body;
      
      await emailTemplateService.sendTest(id, to, sampleData);
      
      return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ error: error.message });
      }
      if (error instanceof ValidationError) {
        return reply.status(400).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to send test email' });
    }
  });
};

export default emailTemplatesRoutes;
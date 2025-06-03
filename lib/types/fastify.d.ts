import { PrismaClient } from '@prisma/client';
import '@fastify/jwt'
import { UserWithRole } from './auth';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authorize: (roles: string[]) => (request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => void;
  }

  interface FastifyRequest {
    user?: UserWithRole;
    rawBody?: string;
  }

  interface FastifyContextConfig {
    rawBody?: boolean;
    [key: string]: unknown;
  }
}


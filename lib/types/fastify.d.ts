import { PrismaClient } from '@prisma/client';
import { FastifyRequest, FastifyReply } from 'fastify';
import '@fastify/jwt'
import { UserWithRole } from './auth';
import { Services } from '../plugins/services';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    services: Services;
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


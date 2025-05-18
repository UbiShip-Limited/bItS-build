import { PrismaClient } from '@prisma/client';
import '@fastify/jwt'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }

  interface FastifyRequest {
    user?: any;
  }
}


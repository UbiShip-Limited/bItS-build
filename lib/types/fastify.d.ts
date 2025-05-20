import { PrismaClient } from '@prisma/client';
import '@fastify/jwt'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authorize: (roles: string[]) => (request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => void;
  }

  interface FastifyRequest {
    user?: any;
  }
}


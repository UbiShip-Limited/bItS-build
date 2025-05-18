import { FastifyRequest, FastifyReply } from 'fastify';

// Mock authenticate function that always succeeds in tests
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  // Do nothing, authentication passes
  return;
}

// Mock authorize function that always succeeds in tests
export function authorize(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Do nothing, authorization passes
    return;
  };
} 
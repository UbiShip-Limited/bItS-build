import { FastifyRequest, FastifyReply } from 'fastify';

// Mock authenticate function that always succeeds in tests
export async function authenticate(_request: FastifyRequest, _reply: FastifyReply) {
  // Do nothing, authentication passes
  return;
}

// Mock authorize function that always succeeds in tests
export function authorize(_allowedRoles: string[]) {
  return async (_request: FastifyRequest, _reply: FastifyReply) => {
    // Do nothing, authorization passes
    return;
  };
} 
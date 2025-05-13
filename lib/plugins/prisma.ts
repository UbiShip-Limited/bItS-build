import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { prisma } from '../prisma/prisma'; // Path to your prisma client instance

const prismaPlugin: FastifyPluginAsync = async (fastify, options) => {
  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (instance) => {
    // In Fastify v3, 'instance' is the Fastify instance.
    // In Fastify v4, you might access prisma directly via `fastify.prisma` or `instance.prisma`
    // depending on how you've structured things or if you're inside a specific scope.
    // For a global decorator, `instance.prisma` or simply `prisma` (if in the same module scope and not shadowed)
    // or `fastify.prisma` (if `fastify` refers to the top-level instance) would be typical.
    // Here, `instance.prisma` should work as we decorated the instance.
    await instance.prisma.$disconnect(); 
  });
};

export default fp(prismaPlugin);

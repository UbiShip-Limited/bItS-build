import { FastifyInstance } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
declare const server: FastifyInstance<Server, IncomingMessage, ServerResponse>;
declare const start: () => Promise<void>;
export default server;
export { start };

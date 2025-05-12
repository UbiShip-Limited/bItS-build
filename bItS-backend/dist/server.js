"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const fastify_1 = __importDefault(require("fastify"));
const server = (0, fastify_1.default)({
    logger: process.env.NODE_ENV !== 'production' ? {
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    } : true, // Enable default JSON logger for production
});
// Health check route
const healthCheckOpts = {
    schema: {
        response: {
            200: {
                type: 'object',
                properties: {
                    status: { type: 'string' },
                    timestamp: { type: 'string' },
                },
            },
        },
    },
};
server.get('/health', healthCheckOpts, async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});
const start = async () => {
    try {
        const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001; // Default to 3001 for backend
        const host = process.env.HOST || '0.0.0.0'; // Listen on all available interfaces
        await server.listen({ port, host });
        server.log.info(`Server listening on http://${host}:${port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
exports.start = start;
// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
    process.on(signal, async () => {
        server.log.info(`Received ${signal}, shutting down gracefully...`);
        await server.close();
        process.exit(0);
    });
});
exports.default = server; // Export for testing or programmatic use
//# sourceMappingURL=server.js.map
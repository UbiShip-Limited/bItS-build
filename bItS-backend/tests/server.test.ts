import server from '../src/server'; // Import the Fastify instance
import config from '../src/config'; // To use the configured port for testing
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
describe('Server Health Check (src/server.ts)', () => {
  beforeAll(async () => {
    // Ensure the server is started before tests run
    // Use a different port for testing if not already handled by NODE_ENV=test in config
    // The config loaded should be from .env.test if NODE_ENV=test
    await server.listen({ port: config.PORT, host: config.HOST });
  });

  afterAll(async () => {
    // Close the server after all tests are done
    await server.close();
  });

  it('should return 200 OK for GET /health', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.status).toBe('ok');
    expect(payload.timestamp).toBeDefined();
  });
});

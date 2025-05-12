import server, { start as startServer } from './server';
// Import the config to ensure it's loaded early, though not directly used in this file after server.ts changes
import './config';
// Import other application-level modules like routes, plugins, services as they are developed.
// Example:
// import authPlugin from './auth/authPlugin';
// import userRoutes from './api/users/userRoutes';

const main = async () => {
  try {
    // Register application-specific plugins, routes, hooks, etc.
    // For example:
    // await server.register(authPlugin);
    // await server.register(userRoutes, { prefix: '/api/v1/users' });

    // server.log will use the logger configured in server.ts, which now uses our config
    server.log.info('Application setup complete. Starting server...');
    await startServer();
  } catch (err) {
    // Use server.log if available, otherwise console.error
    const log = server?.log || console;
    log.error('Error starting application:', err);
    process.exit(1);
  }
};

main();

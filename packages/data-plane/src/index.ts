import { createServer } from '@connector/core';

/**
 * Bootstraps and starts the Data Plane Fastify server.
 */
export async function start(): Promise<void> {
  const server = createServer();
  const port = Number(process.env.DP_PORT) || 3001;

  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.info(`Data Plane server running at http://localhost:${port}`);
  } catch (err) {
    console.error('Error starting Data Plane server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

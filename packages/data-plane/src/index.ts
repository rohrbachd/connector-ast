import { createServer } from '@connector/core';
import { config } from '@connector/shared';

/**
 * Bootstraps and starts the Data Plane Fastify server.
 */
export async function start(): Promise<void> {
  const server = createServer();
  const port = config.get('dataPlane.port');

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

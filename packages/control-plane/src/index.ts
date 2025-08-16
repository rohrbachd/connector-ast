import { createServer } from '@connector/core';
import { config } from '@connector/shared';

/**
 * Bootstraps and starts the Control Plane Fastify server.
 */
export async function start(): Promise<void> {
  const server = createServer();
  const port = config.get('controlPlane.port');

  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.info(`Control Plane server running at http://localhost:${port}`);
  } catch (err) {
    console.error('Error starting Control Plane server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

import fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { ConnectorError } from '../errors';

/**
 * Creates a preconfigured Fastify server instance with standard
 * middleware, including a basic health endpoint and centralized
 * error handling for ConnectorError instances.
 */
export function createServer(): FastifyInstance {
  const server = fastify();

  server.get('/health', async () => ({ status: 'ok' }));

  server.setErrorHandler((error, _request, reply) => {
    if (error instanceof ConnectorError) {
      const { statusCode, errorCode, message } = error;
      reply.status(statusCode).send({ error: errorCode, message });
    } else {
      reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      });
    }
  });

  return server;
}

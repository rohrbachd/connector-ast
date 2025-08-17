import fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { errorHandler } from './error-handler';

/**
 * Creates a preconfigured Fastify server instance with standard
 * middleware, including a basic health endpoint and centralized
 * error handling for ConnectorError instances.
 */
export function createServer(): FastifyInstance {
  const server = fastify({
    ajv: {
      customOptions: { allErrors: true },
    },
  });

  server.get(
    '/health',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            ping: { type: 'string' },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            type: 'object',
            properties: { status: { type: 'string' } },
            required: ['status'],
          },
        },
      },
    },
    async () => ({ status: 'ok' }),
  );

  server.get(
    '/ready',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: { status: { type: 'string' } },
            required: ['status'],
          },
        },
      },
    },
    async () => ({ status: 'ready' }),
  );

  server.setErrorHandler(errorHandler);

  return server;
}

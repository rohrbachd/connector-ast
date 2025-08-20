import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ConnectorError } from '../errors/index.js';

/**
 * Global Fastify error handler translating ConnectorError instances
 * into structured HTTP responses while guarding against leaking
 * internal error details.
 */
export function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof ConnectorError) {
    const { statusCode, errorCode, message } = error;
    reply.status(statusCode).send({ error: errorCode, message });
    return;
  }

  reply.status(500).send({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
  });
}

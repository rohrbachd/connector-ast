import fastify from 'fastify';
import { ConnectorError } from '../../core/src/errors';

const server = fastify();

server.get('/health', async () => {
  return { status: 'ok' };
});

server.setErrorHandler((error, request, reply) => {
  if (error instanceof ConnectorError) {
    reply.status(error.statusCode).send({
      error: error.errorCode,
      message: error.message,
    });
  } else {
    reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
});

export async function start() {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.info('Control Plane server running at http://localhost:3000');
  } catch (err) {
    console.error('Error starting Control Plane server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

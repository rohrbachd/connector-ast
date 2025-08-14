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
    }
    else {
        reply.status(500).send({
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
export async function start() {
    try {
        await server.listen({ port: 3001, host: '0.0.0.0' });
        console.info('Data Plane server running at http://localhost:3001');
    }
    catch (err) {
        console.error('Error starting Data Plane server:', err);
        process.exit(1);
    }
}
if (require.main === module) {
    start();
}
//# sourceMappingURL=index.js.map
import { describe, it, expect } from 'vitest';
import { createServer } from '../src/utils/server.js';
import { NotFoundError } from '../src/errors/index.js';

/**
 * Helper to create a new Fastify instance for each test.
 */
function setup() {
  return createServer();
}

describe('createServer', () => {
  it('exposes a health endpoint', async () => {
    const server = setup();
    const res = await server.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('exposes a readiness endpoint', async () => {
    const server = setup();
    const res = await server.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ready' });
  });

  it('handles ConnectorError via error handler', async () => {
    const server = setup();
    server.get('/boom', () => {
      throw new NotFoundError('missing');
    });
    const res = await server.inject({ method: 'GET', url: '/boom' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'NOT_FOUND', message: 'missing' });
  });
});

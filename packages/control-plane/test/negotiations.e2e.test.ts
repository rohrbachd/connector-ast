import { describe, it, expect } from 'vitest';
import {
  createServer,
  InMemoryNegotiationRepository,
} from '../../core/src/index.js';
import { registerNegotiationRoutes } from '../src/routes/negotiations.js';

function setup() {
  const server = createServer();
  const negotiationRepo = new InMemoryNegotiationRepository();
  registerNegotiationRoutes(server, { negotiationRepo });
  return { server, negotiationRepo };
}

describe('negotiation endpoints', () => {
  it('creates and retrieves a negotiation', async () => {
    const { server } = setup();
    const postRes = await server.inject({ method: 'POST', url: '/dsp/negotiations', payload: {} });
    expect(postRes.statusCode).toBe(201);
    const created = postRes.json();
    expect(created).toHaveProperty('@id');
    expect(created).toHaveProperty('state', 'REQUESTED');

    const getRes = await server.inject({ method: 'GET', url: `/dsp/negotiations/${created['@id']}` });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json()).toEqual(created);
  });

  it('returns 404 for unknown negotiation', async () => {
    const { server } = setup();
    const res = await server.inject({ method: 'GET', url: '/dsp/negotiations/does-not-exist' });
    expect(res.statusCode).toBe(404);
  });
});

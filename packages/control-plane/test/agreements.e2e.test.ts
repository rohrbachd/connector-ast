import { describe, it, expect } from 'vitest';
import { createServer, InMemoryAgreementRepository } from '../../core/src/index.js';
import { registerAgreementRoutes } from '../src/routes/agreements.js';

function setup() {
  const server = createServer();
  const agreementRepo = new InMemoryAgreementRepository();
  registerAgreementRoutes(server, { agreementRepo });
  return { server, agreementRepo };
}

describe('agreement endpoints', () => {
  it('creates and retrieves an agreement', async () => {
    const { server } = setup();
    const postRes = await server.inject({
      method: 'POST',
      url: '/dsp/agreements',
      payload: { negotiationId: 'neg-1' },
    });
    expect(postRes.statusCode).toBe(201);
    const created = postRes.json();
    expect(created).toHaveProperty('@id');
    expect(created).toHaveProperty('negotiationId', 'neg-1');

    const getRes = await server.inject({
      method: 'GET',
      url: `/dsp/agreements/${created['@id']}`,
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json()).toEqual(created);
  });

  it('returns 404 for unknown agreement', async () => {
    const { server } = setup();
    const res = await server.inject({ method: 'GET', url: '/dsp/agreements/does-not-exist' });
    expect(res.statusCode).toBe(404);
  });
});

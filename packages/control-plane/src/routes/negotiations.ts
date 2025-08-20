import type { FastifyInstance } from 'fastify';
import { ContractNegotiation, type NegotiationRepository } from '@connector/core';

interface Deps {
  negotiationRepo: NegotiationRepository;
}

/**
 * Registers contract negotiation endpoints.
 * Provides basic POST and GET handlers for negotiations.
 */
export function registerNegotiationRoutes(server: FastifyInstance, deps: Deps): void {
  server.post(
    '/dsp/negotiations',
    {
      schema: {
        body: { type: 'object', additionalProperties: true },
        response: {
          201: {
            type: 'object',
            properties: {
              '@id': { type: 'string' },
              state: { type: 'string' },
            },
            required: ['@id', 'state'],
          },
        },
      },
    },
    async (_req, reply) => {
      const negotiation = new ContractNegotiation();
      await deps.negotiationRepo.create(negotiation);
      reply.code(201);
      return { '@id': negotiation.id, state: negotiation.state };
    },
  );

  server.get(
    '/dsp/negotiations/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              '@id': { type: 'string' },
              state: { type: 'string' },
            },
            required: ['@id', 'state'],
          },
          404: {
            type: 'object',
            properties: { message: { type: 'string' } },
            required: ['message'],
          },
        },
      },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const negotiation = await deps.negotiationRepo.findById(id);
      if (!negotiation) {
        reply.code(404);
        return { message: 'Negotiation not found' };
      }
      return { '@id': negotiation.id, state: negotiation.state };
    },
  );
}

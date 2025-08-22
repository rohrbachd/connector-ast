import type { FastifyInstance } from 'fastify';
import { ContractAgreement, type AgreementRepository } from '@connector/core';

interface Deps {
  agreementRepo: AgreementRepository;
}

/**
 * Registers contract agreement endpoints.
 * Provides basic POST and GET handlers for agreements.
 */
export function registerAgreementRoutes(server: FastifyInstance, deps: Deps): void {
  server.post(
    '/dsp/agreements',
    {
      schema: {
        body: {
          type: 'object',
          properties: { negotiationId: { type: 'string' } },
          required: ['negotiationId'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              '@id': { type: 'string' },
              negotiationId: { type: 'string' },
            },
            required: ['@id', 'negotiationId'],
          },
        },
      },
    },
    async (req, reply) => {
      const { negotiationId } = req.body as { negotiationId: string };
      const agreement = new ContractAgreement({ negotiationId });
      await deps.agreementRepo.create(agreement);
      reply.code(201);
      return { '@id': agreement.id, negotiationId: agreement.negotiationId };
    },
  );

  server.get(
    '/dsp/agreements/:id',
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
              negotiationId: { type: 'string' },
            },
            required: ['@id', 'negotiationId'],
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
      const agreement = await deps.agreementRepo.findById(id);
      if (!agreement) {
        reply.code(404);
        return { message: 'Agreement not found' };
      }
      return { '@id': agreement.id, negotiationId: agreement.negotiationId };
    },
  );
}

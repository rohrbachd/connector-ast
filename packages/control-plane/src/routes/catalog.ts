import type { FastifyInstance } from 'fastify';
import { AssetType, type AssetRepository } from '@connector/core';

interface Deps {
  assetRepo: AssetRepository;
}

/**
 * Registers the DSP catalog endpoint.
 * Returns basic dataset and service listings in JSON-LD format.
 */
export function registerCatalogRoutes(server: FastifyInstance, deps: Deps): void {
  server.get(
    '/dsp/catalog',
    {
      schema: {
        response: {
          200: { type: 'object', additionalProperties: true },
        },
      },
    },
    async () => {
      const assets = await deps.assetRepo.findAll();

      const datasets = assets
        .filter(a => a.assetType === AssetType.DATASET)
        .map(a => ({
          '@type': 'dcat:Dataset',
          '@id': a.id,
          'dct:title': a.title,
          'dct:description': a.description ?? '',
        }));

      const services = assets
        .filter(a => a.assetType === AssetType.SERVICE)
        .map(a => ({
          '@type': 'dcat:DataService',
          '@id': a.id,
          'dct:title': a.title,
          'dct:description': a.description ?? '',
          'dcat:endpointURL': a.externalId,
        }));

      return {
        '@context': 'https://www.w3.org/ns/dcat2',
        '@type': 'dcat:Catalog',
        '@id': 'urn:connector:catalog',
        'dcat:dataset': datasets,
        'dcat:service': services,
        'dct:conformsTo': 'https://www.w3.org/TR/vocab-dcat-2/',
        'dct:title': 'Connector Catalog',
        'dct:description': 'Available assets and services',
      };
    },
  );
}

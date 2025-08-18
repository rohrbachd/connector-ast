import { describe, it, expect } from 'vitest';
import { createServer, Asset, AssetType, InMemoryAssetRepository } from '../../core/src/index.js';
import { registerCatalogRoutes } from '../src/routes/catalog.js';

function setup() {
  const server = createServer();
  const repo = new InMemoryAssetRepository();
  registerCatalogRoutes(server, { assetRepo: repo });
  return { server, repo };
}

describe('catalog endpoint', () => {
  it('returns datasets and services', async () => {
    const { server, repo } = setup();
    const dataset = new Asset({
      id: 'dataset1',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      externalId: 'https://example.com/datasets/1',
      participantId: 'p1',
      assetType: AssetType.DATASET,
      title: 'Dataset',
      description: 'Example dataset',
    });
    const service = new Asset({
      id: 'service1',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      externalId: 'https://example.com/services/1',
      participantId: 'p1',
      assetType: AssetType.SERVICE,
      title: 'Service',
      description: 'Example service',
    });
    await repo.create(dataset);
    await repo.create(service);

    const res = await server.inject({ method: 'GET', url: '/dsp/catalog' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({
      '@context': 'https://www.w3.org/ns/dcat2',
      '@type': 'dcat:Catalog',
      'dcat:dataset': [
        {
          '@type': 'dcat:Dataset',
          '@id': dataset.id,
          'dct:title': dataset.title,
          'dct:description': dataset.description,
        },
      ],
      'dcat:service': [
        {
          '@type': 'dcat:DataService',
          '@id': service.id,
          'dct:title': service.title,
          'dct:description': service.description,
          'dcat:endpointURL': service.externalId,
        },
      ],
    });
  });
});

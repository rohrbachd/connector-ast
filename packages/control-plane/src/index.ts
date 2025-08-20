import {
  createServer,
  Asset,
  AssetType,
  InMemoryAssetRepository,
  InMemoryNegotiationRepository,
} from '@connector/core';
import { config } from '@connector/shared';
import { registerCatalogRoutes } from './routes/catalog.js';
import { registerNegotiationRoutes } from './routes/negotiations.js';
import { randomUUID } from 'crypto';

/**
 * Bootstraps and starts the Control Plane Fastify server.
 */
export async function start(): Promise<void> {
  const server = createServer();

  // Simple dependency setup
  const assetRepo = new InMemoryAssetRepository();
  const negotiationRepo = new InMemoryNegotiationRepository();

  // Seed example assets for demonstration
  await assetRepo.create(
    new Asset({
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      externalId: 'https://example.com/datasets/1',
      participantId: 'urn:example:participant',
      assetType: AssetType.DATASET,
      title: 'Sample Dataset',
      description: 'Example dataset asset',
    }),
  );

  await assetRepo.create(
    new Asset({
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      externalId: 'https://example.com/service/1',
      participantId: 'urn:example:participant',
      assetType: AssetType.SERVICE,
      title: 'Sample Service',
      description: 'Example service asset',
    }),
  );

  registerCatalogRoutes(server, { assetRepo });
  registerNegotiationRoutes(server, { negotiationRepo });

  const port = config.get('controlPlane.port');

  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.info(`Control Plane server running at http://localhost:${port}`);
  } catch (err) {
    console.error('Error starting Control Plane server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

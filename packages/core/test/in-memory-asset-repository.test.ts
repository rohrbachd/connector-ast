import { describe, it, expect } from 'vitest';
import { InMemoryAssetRepository } from '../src/repositories/memory/in-memory-asset-repository.js';
import { Asset, AssetType } from '../src/domain/index.js';

function createAsset(overrides: Partial<ConstructorParameters<typeof Asset>[0]> = {}) {
  return new Asset({
    id: 'asset1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    externalId: 'ext-1',
    participantId: 'participant',
    assetType: AssetType.DATASET,
    title: 'Test Asset',
    description: 'desc',
    ...overrides,
  });
}

describe('InMemoryAssetRepository', () => {
  it('creates and retrieves an asset', async () => {
    const repo = new InMemoryAssetRepository();
    const asset = createAsset();
    await repo.create(asset);

    await expect(repo.findById(asset.id)).resolves.toEqual(asset);
    await expect(repo.findAll()).resolves.toEqual([asset]);
  });

  it('updates an existing asset', async () => {
    const repo = new InMemoryAssetRepository();
    const asset = createAsset();
    await repo.create(asset);

    const updated = createAsset({ id: asset.id, title: 'Updated' });
    await repo.update(updated);

    await expect(repo.findById(asset.id)).resolves.toEqual(updated);
  });

  it('throws when updating a missing asset', async () => {
    const repo = new InMemoryAssetRepository();
    const asset = createAsset();

    await expect(repo.update(asset)).rejects.toThrow('Asset with id');
  });

  it('deletes an asset', async () => {
    const repo = new InMemoryAssetRepository();
    const asset = createAsset();
    await repo.create(asset);

    await repo.delete(asset.id);

    await expect(repo.findById(asset.id)).resolves.toBeNull();
    await expect(repo.findAll()).resolves.toEqual([]);
  });
});

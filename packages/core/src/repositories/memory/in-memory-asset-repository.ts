import type { Asset } from '../../domain/asset';
import type { AssetRepository } from '../asset-repository';

/**
 * Simple in-memory Asset repository for early development and testing.
 * Stores assets in a Map keyed by ID.
 */
export class InMemoryAssetRepository implements AssetRepository {
  private readonly store = new Map<string, Asset>();

  async findById(id: string): Promise<Asset | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(): Promise<Asset[]> {
    return Array.from(this.store.values());
  }

  async create(entity: Asset): Promise<Asset> {
    this.store.set(entity.id, entity);
    return entity;
  }

  async update(entity: Asset): Promise<Asset> {
    if (!this.store.has(entity.id)) {
      throw new Error(`Asset with id ${entity.id} not found`);
    }
    this.store.set(entity.id, entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

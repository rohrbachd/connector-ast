import type { Pool } from 'pg';
import { Asset } from '../../domain/asset';
import type { AssetStatus, AssetType } from '../../domain/types';
import type { AssetRepository } from '../asset-repository';

type AssetRow = {
  id: string;
  created_at: Date;
  updated_at: Date;
  external_id: string;
  participant_id: string;
  asset_type: string;
  title: string;
  description: string | null;
  version: string;
  status: string;
};

export class PostgresAssetRepository implements AssetRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<Asset | null> {
    const result = await this.pool.query('SELECT * FROM assets WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRow(result.rows[0]);
  }

  async findAll(): Promise<Asset[]> {
    const result = await this.pool.query('SELECT * FROM assets');
    return result.rows.map((row: AssetRow) => this.mapRow(row));
  }

  async create(entity: Asset): Promise<Asset> {
    const result = await this.pool.query(
      `INSERT INTO assets (id, external_id, participant_id, asset_type, title, description, version, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        entity.id,
        entity.externalId,
        entity.participantId,
        entity.assetType,
        entity.title,
        entity.description ?? null,
        entity.version,
        entity.status,
        entity.createdAt,
        entity.updatedAt,
      ]
    );
    return this.mapRow(result.rows[0]);
  }

  async update(entity: Asset): Promise<Asset> {
    const result = await this.pool.query(
      `UPDATE assets SET external_id=$2, participant_id=$3, asset_type=$4, title=$5, description=$6, version=$7, status=$8, updated_at=$9
       WHERE id=$1 RETURNING *`,
      [
        entity.id,
        entity.externalId,
        entity.participantId,
        entity.assetType,
        entity.title,
        entity.description ?? null,
        entity.version,
        entity.status,
        entity.updatedAt,
      ]
    );
    return this.mapRow(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM assets WHERE id=$1', [id]);
  }

  private mapRow(row: AssetRow): Asset {
    return new Asset({
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      externalId: row.external_id,
      participantId: row.participant_id,
      assetType: row.asset_type as AssetType,
      title: row.title,
      description: row.description ?? undefined,
      version: row.version,
      status: row.status as AssetStatus,
    });
  }
}

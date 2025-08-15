import type { Pool } from 'pg';
import { Participant } from '../../domain/participant';
import type { ParticipantRole, ParticipantStatus } from '../../domain/types';
import type { ParticipantRepository } from '../participant-repository';

type ParticipantRow = {
  id: string;
  created_at: Date;
  updated_at: Date;
  did: string;
  name: string;
  description: string | null;
  homepage_url: string | null;
  roles: string[] | null;
  status: string;
  address: string | null;
  trust_level: number | null;
};

export class PostgresParticipantRepository implements ParticipantRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<Participant | null> {
    const result = await this.pool.query('SELECT * FROM participants WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRow(result.rows[0]);
  }

  async findAll(): Promise<Participant[]> {
    const result = await this.pool.query('SELECT * FROM participants');
    return result.rows.map((row: ParticipantRow) => this.mapRow(row));
  }

  async create(entity: Participant): Promise<Participant> {
    const result = await this.pool.query(
      `INSERT INTO participants (id, did, name, description, homepage_url, roles, status, address, trust_level, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        entity.id,
        entity.did,
        entity.name,
        entity.description ?? null,
        entity.homepageUrl ?? null,
        entity.roles,
        entity.status,
        entity.address ? JSON.stringify(entity.address) : null,
        entity.trustLevel,
        entity.createdAt,
        entity.updatedAt,
      ],
    );
    return this.mapRow(result.rows[0]);
  }

  async update(entity: Participant): Promise<Participant> {
    const result = await this.pool.query(
      `UPDATE participants SET did=$2, name=$3, description=$4, homepage_url=$5, roles=$6, status=$7, address=$8, trust_level=$9, updated_at=$10
       WHERE id=$1 RETURNING *`,
      [
        entity.id,
        entity.did,
        entity.name,
        entity.description ?? null,
        entity.homepageUrl ?? null,
        entity.roles,
        entity.status,
        entity.address ? JSON.stringify(entity.address) : null,
        entity.trustLevel,
        entity.updatedAt,
      ],
    );
    return this.mapRow(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM participants WHERE id=$1', [id]);
  }

  private mapRow(row: ParticipantRow): Participant {
    return new Participant({
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      did: row.did,
      name: row.name,
      description: row.description ?? undefined,
      homepageUrl: row.homepage_url ?? undefined,
      roles: row.roles?.map(role => role as ParticipantRole) ?? [],
      status: row.status as ParticipantStatus,
      address: row.address ? JSON.parse(row.address) : undefined,
      trustLevel: row.trust_level ?? 0,
    });
  }
}

import type { ContractNegotiation } from '../../state-machine/negotiation.state-machine';
import type { NegotiationRepository } from '../negotiation-repository';

/**
 * Simple in-memory repository for ContractNegotiation entities.
 * Useful for early development and testing.
 */
export class InMemoryNegotiationRepository implements NegotiationRepository {
  private readonly store = new Map<string, ContractNegotiation>();

  async findById(id: string): Promise<ContractNegotiation | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(): Promise<ContractNegotiation[]> {
    return Array.from(this.store.values());
  }

  async create(entity: ContractNegotiation): Promise<ContractNegotiation> {
    this.store.set(entity.id, entity);
    return entity;
  }

  async update(entity: ContractNegotiation): Promise<ContractNegotiation> {
    if (!this.store.has(entity.id)) {
      throw new Error(`Negotiation with id ${entity.id} not found`);
    }
    this.store.set(entity.id, entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

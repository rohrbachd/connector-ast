import type { ContractAgreement } from '../../domain/agreement';
import type { AgreementRepository } from '../agreement-repository';

/**
 * Simple in-memory repository for ContractAgreement entities.
 */
export class InMemoryAgreementRepository implements AgreementRepository {
  private readonly store = new Map<string, ContractAgreement>();

  async findById(id: string): Promise<ContractAgreement | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(): Promise<ContractAgreement[]> {
    return Array.from(this.store.values());
  }

  async create(entity: ContractAgreement): Promise<ContractAgreement> {
    this.store.set(entity.id, entity);
    return entity;
  }

  async update(entity: ContractAgreement): Promise<ContractAgreement> {
    if (!this.store.has(entity.id)) {
      throw new Error(`Agreement with id ${entity.id} not found`);
    }
    this.store.set(entity.id, entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

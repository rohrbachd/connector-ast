import { randomUUID } from 'crypto';
import type { BaseEntityProps } from '../types';

/**
 * BaseEntity provides common identifiers and timestamps for all domain models.
 */
export abstract class BaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  protected constructor(props: BaseEntityProps = {}) {
    this.id = props.id ?? randomUUID();
    const now = new Date();
    this.createdAt = props.createdAt ?? now;
    this.updatedAt = props.updatedAt ?? now;
  }
}

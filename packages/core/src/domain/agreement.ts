import { BaseEntity } from './base-entity';
import type { BaseEntityProps } from '../types';

export interface AgreementProps extends BaseEntityProps {
  /** Identifier of the related negotiation. */
  negotiationId: string;
}

/**
 * ContractAgreement represents a finalized contract between participants.
 *
 * For Stage 1, it only stores the associated negotiation identifier.
 */
export class ContractAgreement extends BaseEntity {
  readonly negotiationId: string;

  constructor(props: AgreementProps) {
    super(props);
    this.negotiationId = props.negotiationId;
  }
}

import { BaseEntity } from './base-entity';
import type { BaseEntityProps } from '../types';
import type { ParticipantRole, Address } from './types';
import { ParticipantStatus } from './types';

export interface ParticipantProps extends BaseEntityProps {
  did: string;
  name: string;
  description?: string;
  homepageUrl?: string;
  roles?: ParticipantRole[];
  status?: ParticipantStatus;
  address?: Address;
  trustLevel?: number;
}

/**
 * Participant represents a dataspace participant such as a data or service provider.
 */
export class Participant extends BaseEntity {
  readonly did: string;
  readonly name: string;
  readonly description?: string;
  readonly homepageUrl?: string;
  readonly roles: ParticipantRole[];
  readonly status: ParticipantStatus;
  readonly address?: Address;
  readonly trustLevel: number;

  constructor(props: ParticipantProps) {
    super(props);
    this.did = props.did;
    this.name = props.name;
    this.description = props.description;
    this.homepageUrl = props.homepageUrl;
    this.roles = props.roles ?? [];
    this.status = props.status ?? ParticipantStatus.ACTIVE;
    this.address = props.address;
    this.trustLevel = props.trustLevel ?? 0;
  }
}

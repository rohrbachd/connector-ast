import { BaseEntity } from './base-entity';
import type { BaseEntityProps } from '../types';
import type { AssetType } from './types';
import { AssetStatus } from './types';

export interface AssetProps extends BaseEntityProps {
  externalId: string;
  participantId: string;
  assetType: AssetType;
  title: string;
  description?: string;
  version?: string;
  status?: AssetStatus;
}

/**
 * Asset describes a dataset or service that can be offered in the dataspace.
 */
export class Asset extends BaseEntity {
  readonly externalId: string;
  readonly participantId: string;
  readonly assetType: AssetType;
  readonly title: string;
  readonly description?: string;
  readonly version: string;
  readonly status: AssetStatus;

  constructor(props: AssetProps) {
    super(props);
    this.externalId = props.externalId;
    this.participantId = props.participantId;
    this.assetType = props.assetType;
    this.title = props.title;
    this.description = props.description;
    this.version = props.version ?? '1.0.0';
    this.status = props.status ?? AssetStatus.DRAFT;
  }
}

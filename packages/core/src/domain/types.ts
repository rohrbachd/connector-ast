/**
 * Common enums and interfaces used across domain models.
 */
export type ParticipantRole = 'DataProvider' | 'DataConsumer' | 'ServiceProvider';

export enum ParticipantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
}

export enum AssetType {
  DATASET = 'dataset',
  SERVICE = 'service',
}

export enum AssetStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  DEPRECATED = 'deprecated',
  ARCHIVED = 'archived',
}

export interface Address {
  street?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
}

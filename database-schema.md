# Database Schema & Data Models - Lightweight Dataspace Connector

## Database Architecture Overview

The connector uses a multi-store approach optimized for different data types and access patterns:

1. **PostgreSQL** - Primary metadata store with JSON-LD support
2. **Redis** - Caching layer and session storage
3. **Apache Jena Fuseki** - Optional RDF triplestore for SPARQL queries

## PostgreSQL Schema Design

### Core Domain Tables

#### 1. Participants Table
Stores information about dataspace participants.

```sql
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    did VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    homepage_url VARCHAR(500),
    legal_name VARCHAR(255),
    headquarters_address JSONB,
    registration_number VARCHAR(100),
    jurisdiction VARCHAR(100),
    gaia_x_credentials JSONB[], -- Array of Gaia-X VCs
    roles VARCHAR(50)[] DEFAULT '{}', -- e.g., ['DataProvider', 'ServiceProvider']
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
    trust_level INTEGER DEFAULT 0 CHECK (trust_level >= 0 AND trust_level <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}' -- Additional JSON-LD metadata
);

CREATE INDEX idx_participants_did ON participants(did);
CREATE INDEX idx_participants_roles ON participants USING GIN(roles);
CREATE INDEX idx_participants_status ON participants(status);
CREATE INDEX idx_participants_metadata ON participants USING GIN(metadata);
```

#### 2. Assets Table
Stores dataset and service asset definitions.

```sql
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE NOT NULL, -- User-defined ID
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('dataset', 'service')),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    version VARCHAR(50) DEFAULT '1.0.0',
    content_type VARCHAR(100),
    format VARCHAR(100),
    keywords VARCHAR(100)[] DEFAULT '{}',
    themes VARCHAR(100)[] DEFAULT '{}',
    categories VARCHAR(100)[] DEFAULT '{}',
    language VARCHAR(10) DEFAULT 'en',
    license VARCHAR(255),
    rights TEXT,
    temporal_coverage JSONB, -- { "start": "2023-01-01", "end": "2023-12-31" }
    spatial_coverage JSONB, -- GeoJSON or named locations
    data_address JSONB NOT NULL, -- Connection details for data access
    private_properties JSONB DEFAULT '{}', -- Internal properties not exposed
    public_properties JSONB DEFAULT '{}', -- Properties exposed in catalog
    json_ld_metadata JSONB NOT NULL DEFAULT '{}', -- Full JSON-LD representation
    shacl_shapes VARCHAR(255)[], -- SHACL shape references
    conformance_profiles VARCHAR(255)[] DEFAULT '{}', -- DCAT-AP, NGSI-LD, etc.
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'deprecated', 'archived')),
    published_at TIMESTAMP WITH TIME ZONE,
    deprecated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assets_external_id ON assets(external_id);
CREATE INDEX idx_assets_participant ON assets(participant_id);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_keywords ON assets USING GIN(keywords);
CREATE INDEX idx_assets_themes ON assets USING GIN(themes);
CREATE INDEX idx_assets_metadata ON assets USING GIN(json_ld_metadata);
CREATE INDEX idx_assets_temporal ON assets USING GIN(temporal_coverage);
CREATE INDEX idx_assets_spatial ON assets USING GIN(spatial_coverage);

-- Full-text search index
CREATE INDEX idx_assets_search ON assets USING GIN(
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
);
```

#### 3. Services Table (Extension of Assets)
Additional service-specific metadata.

```sql
CREATE TABLE services (
    asset_id UUID PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
    endpoint_url VARCHAR(500) NOT NULL,
    endpoint_description VARCHAR(500), -- OpenAPI/AsyncAPI URL
    service_type VARCHAR(100) NOT NULL, -- REST, GraphQL, gRPC, AsyncAPI
    api_version VARCHAR(50),
    authentication_type VARCHAR(50), -- bearer, oauth2, apikey, mtls
    rate_limits JSONB, -- { "requests_per_minute": 1000, "burst": 100 }
    sla JSONB, -- Service Level Agreement terms
    pricing_model JSONB, -- Pricing information
    health_check_url VARCHAR(500),
    documentation_url VARCHAR(500),
    terms_of_service_url VARCHAR(500),
    contact_info JSONB, -- Contact information
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_services_type ON services(service_type);
CREATE INDEX idx_services_endpoint ON services(endpoint_url);
```

#### 4. Policies Table
ODRL policy definitions with versioning.

```sql
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) NOT NULL, -- User-defined ID like "research-eu@1.2.0"
    title VARCHAR(500) NOT NULL,
    description TEXT,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    policy_type VARCHAR(20) DEFAULT 'offer' CHECK (policy_type IN ('offer', 'agreement', 'request')),
    odrl_policy JSONB NOT NULL, -- Full ODRL JSON-LD policy
    policy_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for integrity
    parameters JSONB DEFAULT '{}', -- Template parameters
    tags VARCHAR(100)[] DEFAULT '{}',
    is_template BOOLEAN DEFAULT FALSE,
    parent_policy_id UUID REFERENCES policies(id), -- For policy inheritance
    created_by UUID REFERENCES participants(id),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'deprecated', 'revoked')),
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(external_id, version)
);

CREATE INDEX idx_policies_external_id ON policies(external_id);
CREATE INDEX idx_policies_hash ON policies(policy_hash);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policies_tags ON policies USING GIN(tags);
CREATE INDEX idx_policies_type ON policies(policy_type);
CREATE INDEX idx_policies_effective ON policies(effective_from, effective_until);
```

#### 5. Offers Table
Contract offers combining assets and policies.

```sql
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE NOT NULL,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES policies(id),
    provider_id UUID NOT NULL REFERENCES participants(id),
    offer_type VARCHAR(20) DEFAULT 'dataset' CHECK (offer_type IN ('dataset', 'service')),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    priority INTEGER DEFAULT 0, -- For offer ranking
    target_audience VARCHAR(100)[], -- Intended consumer types
    geographical_scope VARCHAR(100)[], -- Geographic restrictions
    sector_scope VARCHAR(100)[], -- Industry sectors
    json_ld_representation JSONB NOT NULL, -- Full JSON-LD offer
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'suspended', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_offers_external_id ON offers(external_id);
CREATE INDEX idx_offers_asset ON offers(asset_id);
CREATE INDEX idx_offers_policy ON offers(policy_id);
CREATE INDEX idx_offers_provider ON offers(provider_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_validity ON offers(valid_from, valid_until);
CREATE INDEX idx_offers_audience ON offers USING GIN(target_audience);
```

### Contract Management Tables

#### 6. Contract Negotiations Table
DSP contract negotiation state machine.

```sql
CREATE TABLE contract_negotiations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE NOT NULL, -- DSP negotiation ID
    provider_pid VARCHAR(255) NOT NULL, -- Provider process ID
    consumer_pid VARCHAR(255) NOT NULL, -- Consumer process ID
    provider_id UUID NOT NULL REFERENCES participants(id),
    consumer_id UUID NOT NULL REFERENCES participants(id),
    offer_id UUID REFERENCES offers(id),
    current_offer JSONB NOT NULL, -- Current contract offer
    original_offer JSONB NOT NULL, -- Initial offer for reference
    state VARCHAR(20) NOT NULL DEFAULT 'REQUESTED' CHECK (
        state IN ('REQUESTED', 'OFFERED', 'ACCEPTED', 'AGREED', 'VERIFIED', 'FINALIZED', 'TERMINATED')
    ),
    state_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    callback_address VARCHAR(500),
    error_detail TEXT,
    correlation_id VARCHAR(255), -- For tracing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_negotiations_external_id ON contract_negotiations(external_id);
CREATE INDEX idx_negotiations_provider_pid ON contract_negotiations(provider_pid);
CREATE INDEX idx_negotiations_consumer_pid ON contract_negotiations(consumer_pid);
CREATE INDEX idx_negotiations_state ON contract_negotiations(state);
CREATE INDEX idx_negotiations_participants ON contract_negotiations(provider_id, consumer_id);
CREATE INDEX idx_negotiations_correlation ON contract_negotiations(correlation_id);
```

#### 7. Contract Agreements Table
Finalized agreements (immutable).

```sql
CREATE TABLE contract_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE NOT NULL, -- DSP agreement ID
    negotiation_id UUID NOT NULL REFERENCES contract_negotiations(id),
    provider_id UUID NOT NULL REFERENCES participants(id),
    consumer_id UUID NOT NULL REFERENCES participants(id),
    asset_id UUID NOT NULL REFERENCES assets(id),
    policy_id UUID NOT NULL REFERENCES policies(id),
    agreement_document JSONB NOT NULL, -- Full ODRL agreement
    policy_hash VARCHAR(64) NOT NULL, -- Policy hash at agreement time
    contract_start TIMESTAMP WITH TIME ZONE NOT NULL,
    contract_end TIMESTAMP WITH TIME ZONE,
    provider_signature JSONB, -- Digital signature
    consumer_signature JSONB, -- Digital signature
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated', 'expired')),
    termination_reason TEXT,
    reciprocal_agreement_id UUID REFERENCES contract_agreements(id), -- For bidirectional agreements
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agreements_external_id ON contract_agreements(external_id);
CREATE INDEX idx_agreements_negotiation ON contract_agreements(negotiation_id);
CREATE INDEX idx_agreements_participants ON contract_agreements(provider_id, consumer_id);
CREATE INDEX idx_agreements_asset ON contract_agreements(asset_id);
CREATE INDEX idx_agreements_policy_hash ON contract_agreements(policy_hash);
CREATE INDEX idx_agreements_status ON contract_agreements(status);
CREATE INDEX idx_agreements_validity ON contract_agreements(contract_start, contract_end);
CREATE INDEX idx_agreements_reciprocal ON contract_agreements(reciprocal_agreement_id);
```

### Transfer Management Tables

#### 8. Transfer Processes Table
Data transfer and service invocation tracking.

```sql
CREATE TABLE transfer_processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE NOT NULL, -- DSP transfer ID
    provider_pid VARCHAR(255) NOT NULL,
    consumer_pid VARCHAR(255) NOT NULL,
    agreement_id UUID NOT NULL REFERENCES contract_agreements(id),
    transfer_type VARCHAR(20) NOT NULL CHECK (transfer_type IN ('pull', 'push', 'stream', 'service')),
    asset_id UUID NOT NULL REFERENCES assets(id),
    data_destination JSONB, -- Consumer's data destination
    data_source JSONB, -- Provider's data source
    format VARCHAR(100),
    state VARCHAR(20) NOT NULL DEFAULT 'REQUESTED' CHECK (
        state IN ('REQUESTED', 'STARTED', 'COMPLETED', 'SUSPENDED', 'TERMINATED')
    ),
    state_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    bytes_transferred BIGINT DEFAULT 0,
    records_transferred BIGINT DEFAULT 0,
    error_detail TEXT,
    correlation_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transfers_external_id ON transfer_processes(external_id);
CREATE INDEX idx_transfers_agreement ON transfer_processes(agreement_id);
CREATE INDEX idx_transfers_state ON transfer_processes(state);
CREATE INDEX idx_transfers_type ON transfer_processes(transfer_type);
CREATE INDEX idx_transfers_correlation ON transfer_processes(correlation_id);
```

#### 9. Subscriptions Table
Standing agreements and real-time subscriptions.

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE NOT NULL,
    agreement_id UUID NOT NULL REFERENCES contract_agreements(id),
    selector JSONB NOT NULL, -- Asset selection criteria
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('periodic', 'push', 'stream')),
    schedule VARCHAR(255), -- RRULE format for periodic
    callback_url VARCHAR(500),
    since_timestamp TIMESTAMP WITH TIME ZONE,
    until_timestamp TIMESTAMP WITH TIME ZONE,
    watermark JSONB, -- Last processed position
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
    last_execution TIMESTAMP WITH TIME ZONE,
    next_execution TIMESTAMP WITH TIME ZONE,
    execution_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_external_id ON subscriptions(external_id);
CREATE INDEX idx_subscriptions_agreement ON subscriptions(agreement_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_execution ON subscriptions(next_execution);
```

### Identity and Trust Tables

#### 10. Trust Anchors Table
Trusted certificate authorities and issuers.

```sql
CREATE TABLE trust_anchors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    anchor_type VARCHAR(50) NOT NULL CHECK (anchor_type IN ('ca_certificate', 'did_issuer', 'gaia_x_registry')),
    did VARCHAR(255),
    certificate_pem TEXT,
    public_key_jwk JSONB,
    trust_framework VARCHAR(100), -- e.g., 'gaia-x', 'eudi', 'custom'
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    revocation_list_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trust_anchors_did ON trust_anchors(did);
CREATE INDEX idx_trust_anchors_type ON trust_anchors(anchor_type);
CREATE INDEX idx_trust_anchors_status ON trust_anchors(status);
CREATE INDEX idx_trust_anchors_framework ON trust_anchors(trust_framework);
```

#### 11. Verifiable Credentials Cache
Cache for verified credentials and presentations.

```sql
CREATE TABLE credential_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id VARCHAR(255) UNIQUE NOT NULL,
    holder_did VARCHAR(255) NOT NULL,
    issuer_did VARCHAR(255) NOT NULL,
    credential_type VARCHAR(100)[] NOT NULL,
    credential_subject JSONB NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    revocation_status VARCHAR(20) DEFAULT 'valid' CHECK (revocation_status IN ('valid', 'revoked', 'suspended', 'unknown')),
    last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verification_method VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_credentials_id ON credential_cache(credential_id);
CREATE INDEX idx_credentials_holder ON credential_cache(holder_did);
CREATE INDEX idx_credentials_issuer ON credential_cache(issuer_did);
CREATE INDEX idx_credentials_type ON credential_cache USING GIN(credential_type);
CREATE INDEX idx_credentials_expiry ON credential_cache(expires_at);
CREATE INDEX idx_credentials_status ON credential_cache(revocation_status);
```

### Observability and Audit Tables

#### 12. Usage Records Table
Track usage for billing and compliance.

```sql
CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id UUID NOT NULL REFERENCES contract_agreements(id),
    transfer_id UUID REFERENCES transfer_processes(id),
    participant_id UUID NOT NULL REFERENCES participants(id),
    asset_id UUID NOT NULL REFERENCES assets(id),
    usage_type VARCHAR(50) NOT NULL, -- 'request', 'bytes', 'duration', 'invocation'
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    billing_period VARCHAR(20), -- 'hourly', 'daily', 'monthly'
    cost_amount NUMERIC(10,4),
    cost_currency VARCHAR(3),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_usage_agreement ON usage_records(agreement_id);
CREATE INDEX idx_usage_participant ON usage_records(participant_id);
CREATE INDEX idx_usage_timestamp ON usage_records(timestamp);
CREATE INDEX idx_usage_billing ON usage_records(billing_period, timestamp);
CREATE INDEX idx_usage_type ON usage_records(usage_type);

-- Partitioning by month for performance
CREATE TABLE usage_records_y2024m01 PARTITION OF usage_records
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- Additional partitions would be created as needed
```

#### 13. Duty Receipts Table
Track execution of ODRL obligations.

```sql
CREATE TABLE duty_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id UUID NOT NULL REFERENCES contract_agreements(id),
    transfer_id UUID REFERENCES transfer_processes(id),
    duty_type VARCHAR(100) NOT NULL, -- 'notify', 'delete', 'watermark', 'anonymize'
    duty_description TEXT NOT NULL,
    execution_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    execution_status VARCHAR(20) DEFAULT 'completed' CHECK (execution_status IN ('completed', 'failed', 'partial')),
    execution_details JSONB NOT NULL, -- Proof of execution
    receipt_hash VARCHAR(64) NOT NULL, -- Hash of receipt for integrity
    signature JSONB, -- Digital signature of receipt
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_duty_receipts_agreement ON duty_receipts(agreement_id);
CREATE INDEX idx_duty_receipts_transfer ON duty_receipts(transfer_id);
CREATE INDEX idx_duty_receipts_type ON duty_receipts(duty_type);
CREATE INDEX idx_duty_receipts_timestamp ON duty_receipts(execution_timestamp);
CREATE INDEX idx_duty_receipts_hash ON duty_receipts(receipt_hash);
```

#### 14. Audit Log Table
Comprehensive audit trail.

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'asset', 'agreement', 'transfer', etc.
    entity_id UUID NOT NULL,
    actor_id UUID REFERENCES participants(id),
    actor_type VARCHAR(50), -- 'participant', 'system', 'admin'
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'access'
    resource VARCHAR(255) NOT NULL,
    outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('success', 'failure', 'partial')),
    details JSONB NOT NULL,
    ip_address INET,
    user_agent TEXT,
    correlation_id VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_event_type ON audit_log(event_type);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_correlation ON audit_log(correlation_id);

-- Partitioning by month for performance
CREATE TABLE audit_log_y2024m01 PARTITION OF audit_log
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## Redis Schema Design

### Cache Keys Structure

```typescript
// Session and authentication
"session:{sessionId}" // User session data
"jwt:blacklist:{jti}" // Blacklisted JWT tokens
"rate_limit:{participantId}:{endpoint}" // Rate limiting counters

// Policy decisions cache
"policy:decision:{policyHash}:{contextHash}" // Cached policy decisions
"policy:conflicts:{policyId}" // Conflict resolution results

// Credential verification cache
"vc:verification:{credentialId}" // Verification results
"did:document:{did}" // Resolved DID documents

// Transfer state cache
"transfer:state:{transferId}" // Transfer process state
"transfer:progress:{transferId}" // Transfer progress tracking

// Subscription watermarks
"subscription:watermark:{subscriptionId}" // Last processed position

// Usage counters
"usage:counter:{agreementId}:{metric}" // Real-time usage counters
"usage:quota:{agreementId}" // Quota tracking

// Temporary data
"temp:ticket:{ticketId}" // Short-lived access tickets
"temp:challenge:{challengeId}" // Authentication challenges
```

### Redis Data Structures

```typescript
// Usage counter (Hash)
HSET usage:counter:agreement123:requests count 1500 last_reset 1640995200

// Rate limiting (String with expiry)
SET rate_limit:participant456:catalog 10 EX 60

// Policy decision cache (JSON)
SET policy:decision:hash123:context456 '{"decision":"permit","obligations":["notify"]}'

// Transfer progress (Hash)
HSET transfer:progress:transfer789 bytes_transferred 1048576 percentage 25 status "in_progress"
```

## RDF Triplestore Schema (Optional)

### Namespaces and Prefixes

```turtle
@prefix dcat: <http://www.w3.org/ns/dcat#> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix dspace: <https://w3id.org/dspace/v0.8/> .
@prefix connector: <https://connector.example.com/ns/> .
@prefix gx: <https://w3id.org/gaia-x/core#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
```

### Sample RDF Data Structure

```turtle
# Participant
connector:participant/123 a foaf:Organization ;
    foaf:name "Example Data Provider" ;
    dct:identifier "did:web:example.com" ;
    connector:hasRole connector:DataProvider, connector:ServiceProvider ;
    gx:hasCredential connector:credential/gx-123 .

# Dataset Asset
connector:asset/dataset-456 a dcat:Dataset ;
    dct:title "Weather Data Berlin 2023" ;
    dct:description "Hourly weather measurements from Berlin" ;
    dcat:keyword "weather", "berlin", "temperature", "humidity" ;
    dcat:theme <http://publications.europa.eu/resource/authority/data-theme/ENVI> ;
    dct:spatial <http://sws.geonames.org/2950159/> ; # Berlin
    dct:temporal [ a dct:PeriodOfTime ;
        dcat:startDate "2023-01-01"^^xsd:date ;
        dcat:endDate "2023-12-31"^^xsd:date ] ;
    dcat:distribution connector:distribution/456-csv .

# Service Asset
connector:asset/service-789 a dcat:DataService ;
    dct:title "Weather Prediction API" ;
    dct:description "Machine learning weather prediction service" ;
    dcat:endpointURL <https://api.example.com/weather/predict> ;
    dcat:endpointDescription <https://api.example.com/openapi.json> ;
    dcat:servesDataset connector:asset/dataset-456 .

# Contract Offer
connector:offer/offer-101 a odrl:Offer ;
    odrl:target connector:asset/dataset-456 ;
    odrl:assigner connector:participant/123 ;
    odrl:permission [
        odrl:action odrl:use ;
        odrl:constraint [
            odrl:leftOperand odrl:purpose ;
            odrl:operator odrl:isAnyOf ;
            odrl:rightOperand "research", "education"
        ]
    ] ;
    odrl:duty [
        odrl:action odrl:notify ;
        odrl:target <https://example.com/usage-notification>
    ] .
```

## Data Model Classes (TypeScript)

### Core Domain Models

```typescript
// Base Entity
export abstract class BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  
  constructor(id?: string) {
    this.id = id || crypto.randomUUID();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

// Participant
export class Participant extends BaseEntity {
  did: string;
  name: string;
  description?: string;
  homepageUrl?: string;
  legalName?: string;
  headquartersAddress?: Address;
  registrationNumber?: string;
  jurisdiction?: string;
  gaiaXCredentials: VerifiableCredential[];
  roles: ParticipantRole[];
  status: ParticipantStatus;
  trustLevel: number;
  metadata: Record<string, any>;
}

// Asset
export class Asset extends BaseEntity {
  externalId: string;
  participantId: string;
  assetType: AssetType;
  title: string;
  description?: string;
  version: string;
  contentType?: string;
  format?: string;
  keywords: string[];
  themes: string[];
  categories: string[];
  language: string;
  license?: string;
  rights?: string;
  temporalCoverage?: TemporalCoverage;
  spatialCoverage?: SpatialCoverage;
  dataAddress: DataAddress;
  privateProperties: Record<string, any>;
  publicProperties: Record<string, any>;
  jsonLdMetadata: Record<string, any>;
  shaclShapes: string[];
  conformanceProfiles: string[];
  status: AssetStatus;
  publishedAt?: Date;
  deprecatedAt?: Date;
}

// Policy
export class Policy extends BaseEntity {
  externalId: string;
  title: string;
  description?: string;
  version: string;
  policyType: PolicyType;
  odrlPolicy: ODRLPolicy;
  policyHash: string;
  parameters: Record<string, any>;
  tags: string[];
  isTemplate: boolean;
  parentPolicyId?: string;
  createdBy?: string;
  status: PolicyStatus;
  effectiveFrom: Date;
  effectiveUntil?: Date;
}

// Contract Agreement
export class ContractAgreement extends BaseEntity {
  externalId: string;
  negotiationId: string;
  providerId: string;
  consumerId: string;
  assetId: string;
  policyId: string;
  agreementDocument: ODRLAgreement;
  policyHash: string;
  contractStart: Date;
  contractEnd?: Date;
  providerSignature?: DigitalSignature;
  consumerSignature?: DigitalSignature;
  status: AgreementStatus;
  terminationReason?: string;
  reciprocalAgreementId?: string;
}
```

### Enums and Types

```typescript
export enum AssetType {
  DATASET = 'dataset',
  SERVICE = 'service'
}

export enum AssetStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  DEPRECATED = 'deprecated',
  ARCHIVED = 'archived'
}

export enum NegotiationState {
  REQUESTED = 'REQUESTED',
  OFFERED = 'OFFERED',
  ACCEPTED = 'ACCEPTED',
  AGREED = 'AGREED',
  VERIFIED = 'VERIFIED',
  FINALIZED = 'FINALIZED',
  TERMINATED = 'TERMINATED'
}

export enum TransferState {
  REQUESTED = 'REQUESTED',
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED'
}

export enum TransferType {
  PULL = 'pull',
  PUSH = 'push',
  STREAM = 'stream',
  SERVICE = 'service'
}
```

This comprehensive database schema provides the foundation for storing all connector data with proper indexing, relationships, and support for JSON-LD semantic metadata while maintaining ACID compliance and performance.
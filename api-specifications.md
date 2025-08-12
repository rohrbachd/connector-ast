# API Specifications - Lightweight Dataspace Connector

## DSP Protocol API Specification

### Base Configuration
- **Base URL:** `https://{connector-host}/dsp`
- **Content Type:** `application/ld+json` (JSON-LD)
- **Authentication:** Bearer tokens with DPoP binding
- **API Version:** DSP 0.8 compliant

### Core DSP Endpoints

#### 1. Catalog API

##### GET /dsp/catalog
Retrieve the connector's catalog of available datasets and services.

**Query Parameters:**
```typescript
interface CatalogQuery {
  filter?: string;           // SPARQL-like filter expression
  limit?: number;           // Max results (default: 50, max: 1000)
  offset?: number;          // Pagination offset
  profile?: string;         // Content profile (dcat-ap, ngsi-ld)
  participantId?: string;   // Filter by participant
}
```

**Response:**
```typescript
interface CatalogResponse {
  "@context": string | object;
  "@type": "dcat:Catalog";
  "@id": string;
  "dcat:dataset": DatasetOffer[];
  "dcat:service": ServiceOffer[];
  "dct:conformsTo": string;
  "foaf:homepage": string;
  "dct:title": string;
  "dct:description": string;
  "dcat:themeTaxonomy": string[];
}

interface DatasetOffer {
  "@type": "dcat:Dataset";
  "@id": string;
  "dct:title": string;
  "dct:description": string;
  "dcat:keyword": string[];
  "dcat:theme": string[];
  "dct:format": string[];
  "dcat:distribution": Distribution[];
  "odrl:hasPolicy": string; // Policy URI reference
  "dct:conformsTo": string[];
}

interface ServiceOffer {
  "@type": "dcat:DataService";
  "@id": string;
  "dct:title": string;
  "dct:description": string;
  "dcat:endpointURL": string;
  "dcat:endpointDescription": string; // OpenAPI/AsyncAPI URL
  "dcat:servesDataset": string[];
  "odrl:hasPolicy": string;
  "dct:conformsTo": string[];
}
```

#### 2. Contract Negotiation API

##### POST /dsp/negotiations
Initiate a contract negotiation.

**Request:**
```typescript
interface ContractRequestMessage {
  "@context": string | object;
  "@type": "dspace:ContractRequestMessage";
  "@id": string;
  "dspace:providerPid": string;
  "dspace:consumerPid": string;
  "dspace:offer": ContractOffer;
  "dspace:callbackAddress": string;
}

interface ContractOffer {
  "@type": "odrl:Offer";
  "@id": string;
  "odrl:target": string; // Asset or Service ID
  "odrl:assigner": string;
  "odrl:assignee": string;
  "odrl:permission": Permission[];
  "odrl:prohibition"?: Prohibition[];
  "odrl:obligation"?: Duty[];
}
```

**Response:**
```typescript
interface ContractNegotiation {
  "@context": string | object;
  "@type": "dspace:ContractNegotiation";
  "@id": string;
  "dspace:providerPid": string;
  "dspace:consumerPid": string;
  "dspace:state": NegotiationState;
  "dct:created": string;
  "dct:modified": string;
}

type NegotiationState = 
  | "dspace:REQUESTED" 
  | "dspace:OFFERED" 
  | "dspace:ACCEPTED" 
  | "dspace:AGREED" 
  | "dspace:VERIFIED" 
  | "dspace:FINALIZED" 
  | "dspace:TERMINATED";
```

##### GET /dsp/negotiations/{id}
Retrieve negotiation status.

##### POST /dsp/negotiations/{id}/request
Send counter-offer or acceptance.

##### POST /dsp/negotiations/{id}/events
Handle negotiation events (offers, acceptances, terminations).

#### 3. Agreement API

##### POST /dsp/agreements
Finalize a negotiated agreement.

**Request:**
```typescript
interface ContractAgreementMessage {
  "@context": string | object;
  "@type": "dspace:ContractAgreementMessage";
  "@id": string;
  "dspace:providerPid": string;
  "dspace:consumerPid": string;
  "dspace:agreement": ContractAgreement;
}

interface ContractAgreement {
  "@type": "odrl:Agreement";
  "@id": string;
  "odrl:target": string;
  "odrl:assigner": string;
  "odrl:assignee": string;
  "odrl:permission": Permission[];
  "odrl:prohibition"?: Prohibition[];
  "odrl:obligation"?: Duty[];
  "dct:created": string;
  "dspace:timestamp": string;
  "dspace:contractStart": string;
  "dspace:contractEnd"?: string;
}
```

##### GET /dsp/agreements/{id}
Retrieve agreement details.

##### POST /dsp/agreements/{id}/verification
Verify agreement integrity.

#### 4. Transfer Process API

##### POST /dsp/transfers
Initiate a data transfer or service invocation.

**Request:**
```typescript
interface TransferRequestMessage {
  "@context": string | object;
  "@type": "dspace:TransferRequestMessage";
  "@id": string;
  "dspace:providerPid": string;
  "dspace:consumerPid": string;
  "dspace:agreementId": string;
  "dspace:format": string;
  "dct:format"?: string;
  "dspace:dataDestination"?: DataAddress;
  "dspace:transferType": TransferType;
}

interface DataAddress {
  "@type": "dspace:DataAddress";
  "dspace:endpointType": string;
  "dspace:endpoint": string;
  "dspace:endpointProperties"?: Record<string, any>;
}

type TransferType = "dspace:HttpData" | "dspace:HttpProxy" | "dspace:StreamingData" | "dspace:ServiceInvocation";
```

**Response:**
```typescript
interface TransferProcess {
  "@context": string | object;
  "@type": "dspace:TransferProcess";
  "@id": string;
  "dspace:providerPid": string;
  "dspace:consumerPid": string;
  "dspace:state": TransferState;
  "dspace:dataDestination"?: DataAddress;
  "dct:created": string;
  "dct:modified": string;
}

type TransferState = 
  | "dspace:REQUESTED" 
  | "dspace:STARTED" 
  | "dspace:COMPLETED" 
  | "dspace:SUSPENDED" 
  | "dspace:TERMINATED";
```

##### GET /dsp/transfers/{id}
Retrieve transfer status.

##### POST /dsp/transfers/{id}/start
Start the transfer process.

##### POST /dsp/transfers/{id}/completion
Signal transfer completion.

##### POST /dsp/transfers/{id}/termination
Terminate the transfer.

### Extended DSP API (Connector-Specific)

#### 5. Subscriptions API

##### POST /dsp/subscriptions
Create a standing subscription for real-time data.

**Request:**
```typescript
interface SubscriptionRequest {
  "@context": string | object;
  "@type": "connector:SubscriptionRequest";
  "@id": string;
  "connector:agreementId": string;
  "connector:selector": Selector;
  "connector:mode": SubscriptionMode;
  "connector:schedule"?: string; // RRULE format
  "connector:since"?: string;
  "connector:until"?: string;
  "connector:callbackUrl": string;
}

interface Selector {
  "@type": "connector:Selector";
  "connector:assetIds"?: string[];
  "connector:tags"?: string[];
  "connector:query"?: string; // SPARQL or JSONPath
  "connector:temporal"?: TemporalCoverage;
}

type SubscriptionMode = "periodic" | "push" | "stream";
```

##### GET /dsp/subscriptions/{id}
Retrieve subscription status.

##### DELETE /dsp/subscriptions/{id}
Cancel subscription.

#### 6. Tickets API

##### POST /dsp/tickets
Generate short-lived access tokens.

**Request:**
```typescript
interface TicketRequest {
  "@context": string | object;
  "@type": "connector:TicketRequest";
  "@id": string;
  "connector:agreementId": string;
  "connector:assetId"?: string;
  "connector:since"?: string;
  "connector:mode": TransferMode;
}

type TransferMode = "pull" | "push" | "stream" | "service";
```

**Response:**
```typescript
interface Ticket {
  "@context": string | object;
  "@type": "connector:Ticket";
  "@id": string;
  "connector:token": string; // DPoP-bound JWT
  "connector:endpoint": string;
  "connector:expiresAt": string;
  "connector:constraints": ConstraintKV[];
}
```

#### 7. Usage API

##### GET /dsp/usage/{agreementId}
Retrieve usage statistics for an agreement.

**Response:**
```typescript
interface UsageReport {
  "@context": string | object;
  "@type": "connector:UsageReport";
  "@id": string;
  "connector:agreementId": string;
  "connector:period": {
    "connector:start": string;
    "connector:end": string;
  };
  "connector:counters": UsageCounter[];
  "connector:quotas": QuotaStatus[];
}

interface UsageCounter {
  "@type": "connector:UsageCounter";
  "connector:metric": string; // "requests", "bytes", "duration"
  "connector:value": number;
  "connector:unit": string;
}
```

## Administrative API Specification

### Base Configuration
- **Base URL:** `https://{connector-host}/admin`
- **Content Type:** `application/json`
- **Authentication:** mTLS or API Key
- **Access:** Internal/administrative only

### Asset Management

#### POST /admin/assets
Create or update an asset.

**Request:**
```typescript
interface AssetCreateRequest {
  id?: string;
  title: string;
  description: string;
  contentType: string;
  keywords: string[];
  themes: string[];
  dataAddress: DataAddress;
  properties: Record<string, any>;
  privateProperties?: Record<string, any>;
}
```

#### GET /admin/assets
List assets with filtering and pagination.

#### GET /admin/assets/{id}
Retrieve specific asset.

#### PATCH /admin/assets/{id}/publish
Publish asset to catalog.

#### PATCH /admin/assets/{id}/deprecate
Deprecate asset.

### Service Management

#### POST /admin/services
Register a service offering.

**Request:**
```typescript
interface ServiceCreateRequest {
  id?: string;
  title: string;
  description: string;
  endpointUrl: string;
  endpointDescription: string; // OpenAPI/AsyncAPI URL
  serviceType: string;
  sla?: ServiceLevelAgreement;
  pricing?: PricingModel;
  properties: Record<string, any>;
}
```

### Policy Management

#### POST /admin/policies
Create a policy.

**Request:**
```typescript
interface PolicyCreateRequest {
  id?: string;
  title: string;
  description: string;
  odrl: ODRLPolicy;
  version: string;
  tags: string[];
  parameters?: PolicyParameter[];
}
```

#### POST /admin/policies/{id}/assign
Assign policy to assets/services.

#### POST /admin/policy-packs
Create policy pack (bundle of related policies).

### Trust Management

#### POST /admin/trust-anchors
Add trusted certificate authority or issuer.

#### GET /admin/trust-anchors
List trust anchors.

#### POST /admin/trust-anchors/{id}/revoke
Revoke trust anchor.

### Evidence and Audit

#### GET /admin/evidence/{agreementId}
Generate evidence bundle for agreement.

**Response:**
```typescript
interface EvidenceBundle {
  "@context": string | object;
  "@type": "connector:EvidenceBundle";
  "@id": string;
  "connector:agreementId": string;
  "connector:policyHash": string;
  "connector:dutyReceipts": DutyReceipt[];
  "connector:usageRecords": UsageRecord[];
  "connector:telemetryExcerpts": TelemetryRecord[];
  "connector:generatedAt": string;
  "connector:signature": string;
}
```

## Internal Service Interfaces

### Core Domain Interfaces

```typescript
// Repository Pattern Interfaces
interface Repository<T, ID> {
  findById(id: ID): Promise<T | null>;
  findAll(criteria?: QueryCriteria): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: ID): Promise<void>;
  count(criteria?: QueryCriteria): Promise<number>;
}

// Service Layer Interfaces
interface CatalogService {
  publishAsset(asset: Asset, policy: Policy): Promise<Offer>;
  publishService(service: Service, policy: Policy): Promise<Offer>;
  searchOffers(query: SearchQuery): Promise<SearchResult>;
  validateOffer(offer: Offer): Promise<ValidationResult>;
  federateWithPeer(peerUrl: string): Promise<void>;
}

interface NegotiationService {
  initiateNegotiation(offer: ContractOffer): Promise<ContractNegotiation>;
  processCounterOffer(negotiationId: string, offer: ContractOffer): Promise<ContractNegotiation>;
  acceptOffer(negotiationId: string): Promise<ContractAgreement>;
  terminateNegotiation(negotiationId: string, reason: string): Promise<void>;
}

interface TransferService {
  initiateTransfer(request: TransferRequest): Promise<TransferProcess>;
  executeTransfer(transferId: string): Promise<TransferResult>;
  monitorTransfer(transferId: string): Promise<TransferStatus>;
  terminateTransfer(transferId: string): Promise<void>;
}

// Policy Engine Interfaces
interface PolicyDecisionPoint {
  evaluate(request: AuthorizationRequest): Promise<PolicyDecision>;
  validatePolicy(policy: ODRLPolicy): Promise<ValidationResult>;
  resolveConflicts(policies: ODRLPolicy[]): Promise<ODRLPolicy>;
}

interface PolicyAdministrationPoint {
  createPolicy(policy: ODRLPolicy): Promise<string>;
  updatePolicy(id: string, policy: ODRLPolicy): Promise<void>;
  deletePolicy(id: string): Promise<void>;
  assignPolicy(policyId: string, targets: string[]): Promise<void>;
}

// Transport Adapter Interfaces
interface TransportAdapter {
  readonly id: string;
  readonly supportedSchemes: string[];
  
  init(config: AdapterConfig): Promise<void>;
  plan(request: TransferPlanRequest): Promise<TransferPlan>;
  execute(plan: TransferPlan, context: EnforcementContext): Promise<TransferResult>;
  stop(): Promise<void>;
}

interface DutyExecutor {
  readonly supportedDuties: string[];
  
  canExecute(duty: Duty): boolean;
  execute(duty: Duty, context: ExecutionContext): Promise<DutyReceipt>;
  validate(duty: Duty): Promise<ValidationResult>;
}

// Identity and Trust Interfaces
interface VerifiableCredentialVerifier {
  verifyPresentation(vp: string, challenge: string): Promise<VerificationResult>;
  extractClaims(vp: string): Promise<ClaimSet>;
  checkRevocation(credential: VerifiableCredential): Promise<RevocationStatus>;
}

interface DIDResolver {
  resolve(did: string): Promise<DIDDocument>;
  supports(did: string): boolean;
}

// Observability Interfaces
interface TelemetryCollector {
  collectEvent(event: TelemetryEvent): Promise<void>;
  collectMetric(metric: Metric): Promise<void>;
  collectTrace(trace: TraceSpan): Promise<void>;
}

interface EvidenceGenerator {
  generateBundle(agreementId: string): Promise<EvidenceBundle>;
  verifyBundle(bundle: EvidenceBundle): Promise<VerificationResult>;
  exportBundle(bundle: EvidenceBundle, format: string): Promise<Buffer>;
}
```

### Event System Interfaces

```typescript
// Event-Driven Architecture
interface EventBus {
  publish<T>(event: DomainEvent<T>): Promise<void>;
  subscribe<T>(eventType: string, handler: EventHandler<T>): Promise<void>;
  unsubscribe(eventType: string, handler: EventHandler<T>): Promise<void>;
}

interface DomainEvent<T = any> {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  data: T;
  metadata: EventMetadata;
  occurredAt: Date;
}

interface EventHandler<T> {
  handle(event: DomainEvent<T>): Promise<void>;
}

// Common Events
interface NegotiationStartedEvent {
  negotiationId: string;
  providerId: string;
  consumerId: string;
  offer: ContractOffer;
}

interface AgreementFinalizedEvent {
  agreementId: string;
  negotiationId: string;
  agreement: ContractAgreement;
}

interface TransferCompletedEvent {
  transferId: string;
  agreementId: string;
  bytesTransferred: number;
  duration: number;
}
```

### Configuration Interfaces

```typescript
interface ConnectorConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  security: SecurityConfig;
  observability: ObservabilityConfig;
  adapters: AdapterConfig[];
  policies: PolicyConfig;
}

interface ServerConfig {
  host: string;
  port: number;
  tls: TLSConfig;
  cors: CORSConfig;
  rateLimit: RateLimitConfig;
}

interface SecurityConfig {
  jwt: JWTConfig;
  did: DIDConfig;
  trustAnchors: TrustAnchorConfig[];
  encryption: EncryptionConfig;
}
```

This comprehensive API specification provides the foundation for implementing the Lightweight Dataspace Connector with clear contracts for both external DSP protocol compliance and internal service architecture.
# Feature Analysis - Lightweight Dataspace Connector

## Identified Features from PRD

### Must-Have Features (MVP - 12 weeks)

#### Core DSP Control Plane (F1.1-F1.4)

- **F1.1** Catalog for dataset and service offers with semantic filters and pagination
- **F1.2** Contract negotiation: proposal → counter-offer → agreement (idempotent, resumable)
- **F1.3** Transfer creation for data or service invocation with observable states
- **F1.4** Self-descriptions and Gaia-X credential publishing

#### Trust & Identity (F2.1-F2.3)

- **F2.1** Verify VPs via OID4VP (SD-JWT VC + JSON-LD VC) with did:web baseline
- **F2.2** Role/attribute VCs (Data Provider, Service Provider, sector roles) with cache & revocation
- **F2.3** Bind presented attributes/roles into PDP context for authorization

#### Contracting & Policy (F3.1-F3.7)

- **F3.1** Offers/Agreements as ODRL with permissions/prohibitions/duties
- **F3.2** Common constraints: purpose, time window, count, geo, retention, sublicensing, must-delete/notify
- **F3.3** Conflict detection + counter-offer suggestions
- **F3.4** Execute obligations in DP (notify, delete with receipt, watermark, logging)
- **F3.5** Policies assignable by reference (URI), composable and parameterized
- **F3.6** Output policy: service provider may attach policy to result assets
- **F3.7** Agreement linking: reciprocalOf IRI with evidence bundles

#### Catalog & Semantics (F4.1-F4.3)

- **F4.1** JSON-LD metadata with DCAT-AP (datasets) and optional NGSI-LD
- **F4.2** SHACL validation for offers/payload metadata with fail fast
- **F4.3** Content negotiation by profile in DP

#### Data Plane Core (F5.1-F5.7)

- **F5.1** Transfer modes: pull, push, stream, service
- **F5.2** Provider-initiated results under governing agreement
- **F5.3** Return-asset identity with cataloged assets/operations
- **F5.4** Standing Agreements with Selectors (IDs, tags/semantics, query, temporal)
- **F5.5** Tickets API: short-lived, PoP-bound tokens
- **F5.6** Subscriptions API: periodic pull/push/stream with watermarks
- **F5.7** Usage/quota counters with GET /dsp/usage/{agreementId}

#### Services as First-Class Citizens (F5.8-F5.11)

- **F5.9** Service Offers with OpenAPI/AsyncAPI URLs, SLAs, pricing models
- **F5.10** Invocation tokens bound to Agreement ID + constraints
- **F5.11** Compute-to-Data: job runner with result-sharing under policy

#### Observability & Audit (F6.1-F6.3)

- **F6.1** Emit DSP state telemetry to internal bus with configurable sinks
- **F6.2** Export contract-bound activity records (billing/clearing/notary)
- **F6.3** Privacy controls: redaction, aggregated counters, policy-governed access

#### Compatibility & Interop (F7.1-F7.2)

- **F7.1** Pass DSP TCK; interop with EDC/Tractus-X, TNO TSG, FIWARE
- **F7.2** Gaia-X: publish/consume credentials with optional label evidence

### Should-Have Features (R2 - Post-MVP)

#### Advanced Data Plane

- AsyncAPI/gRPC support
- Kafka streams integration
- Compute-to-data job runner
- Watermarker/anonymizer duties

#### Enhanced Trust & Compliance

- Gaia-X credential publication
- TCK badge + IDSA AL1 evidence kit
- Advanced obligations (geo-fence, retention re-checks)

### Nice-to-Have Features (R3 - Future)

#### Advanced Semantics & Storage

- NGSI-LD profile support
- Triplestore + SPARQL queries
- Optional TEE (Trusted Execution Environment)
- Gaia-X label evidence
- IDSA AL2 preparation

## Feature Categorization by Domain

### Control Plane Features

1. DSP Protocol Implementation
2. Contract Negotiation Engine
3. Policy Decision Point (PDP)
4. Catalog Service
5. Identity & Trust Management
6. Agreement Management
7. Observability Bus

### Data Plane Features

1. Transfer Execution Engine
2. Transport Adapters (HTTP, S3, MQTT, Kafka, etc.)
3. Policy Enforcement Points
4. Service Invocation Proxy
5. Streaming Support
6. Compute-to-Data Runtime

### Cross-Cutting Features

1. Security & Authentication
2. Monitoring & Telemetry
3. Configuration Management
4. Extension/Plugin System
5. API Gateway & Routing

## Technical Complexity Assessment

### High Complexity

- ODRL policy engine with conflict resolution
- DSP state machine implementation
- Verifiable Credentials verification (OID4VP)
- Multi-protocol data plane adapters
- Real-time streaming with backpressure

### Medium Complexity

- JSON-LD semantic processing
- SHACL validation engine
- Standing agreements with selectors
- Observability and telemetry
- Container orchestration

### Low Complexity

- REST API endpoints
- Basic CRUD operations
- Configuration management
- Health checks and monitoring
- Documentation and examples

## Feature Implementation Mapping

### Stage 1: Foundation & Core DSP (6 weeks)

**Features Implemented:**

- F1.1: Basic catalog endpoint
- F1.2: Contract negotiation state machine
- F1.3: Transfer process creation
- F1.4: Basic self-descriptions
- Core infrastructure and DSP protocol basics

**Complexity Focus:** Medium to High

- DSP protocol implementation
- State machine for negotiations
- Basic JSON-LD processing

### Stage 2: Trust & Identity (7 weeks)

**Features Implemented:**

- F2.1: OID4VP verification (SD-JWT VC + JSON-LD VC)
- F2.2: Role/attribute VCs with caching
- F2.3: Claims binding to PDP context
- F3.1: ODRL policy parsing
- F3.2: Basic constraint evaluation
- F3.3: Conflict detection

**Complexity Focus:** High

- Verifiable Credentials verification
- ODRL policy engine
- Trust chain validation

### Stage 3: Data Plane & Adapters (7 weeks)

**Features Implemented:**

- F5.1: All transfer modes (pull, push, stream, service)
- F5.2: Provider-initiated results
- F5.3: Return-asset identity
- F3.4: Obligation execution in DP
- F4.1: JSON-LD metadata with DCAT-AP
- F4.2: SHACL validation
- F4.3: Content negotiation
- Transport adapters (HTTP, S3, MQTT, Kafka)

**Complexity Focus:** High to Medium

- Multi-protocol adapters
- Policy enforcement points
- Semantic catalog with validation

### Stage 4: Advanced Features & Production (6 weeks)

**Features Implemented:**

- F5.4: Standing Agreements with Selectors
- F5.5: Tickets API
- F5.6: Subscriptions API
- F5.7: Usage/quota counters
- F5.9-F5.11: Service offers and invocation
- F6.1-F6.3: Complete observability
- F7.1-F7.2: Interoperability and compliance

**Complexity Focus:** Medium to High

- Real-time features
- Advanced policy features
- Production observability
- Compliance and interoperability

## Feature Dependencies

### Critical Path Features

1. **DSP Protocol (F1.1-F1.4)** → Foundation for all other features
2. **Policy Engine (F3.1-F3.3)** → Required for authorization
3. **Transport Adapters (F5.1)** → Essential for data plane
4. **VC Verification (F2.1-F2.3)** → Required for trust

### Feature Interdependencies

- **Catalog (F4.1-F4.3)** depends on **DSP Protocol (F1.1)**
- **Policy Enforcement (F3.4)** depends on **Policy Engine (F3.1-F3.3)**
- **Service Invocation (F5.9-F5.11)** depends on **Transfer Modes (F5.1)**
- **Standing Agreements (F5.4)** depends on **Agreement Management (F1.2)**
- **Observability (F6.1-F6.3)** integrates with all other features

## Implementation Priority Matrix

### High Priority (MVP Critical)

- DSP Protocol endpoints
- Contract negotiation
- VC verification
- Basic policy engine
- Core transport adapters
- Catalog with SHACL validation

### Medium Priority (MVP Important)

- Advanced policy features
- Service invocation
- Real-time subscriptions
- Usage tracking
- Observability

### Lower Priority (Post-MVP)

- Advanced adapters (gRPC, AsyncAPI)
- Compute-to-data
- Advanced obligations
- TEE support
- NGSI-LD profile

## Quality Attributes by Feature

### Performance Requirements

- **Catalog (F4.1)**: <100ms response time for queries
- **Policy Engine (F3.1-F3.3)**: <50ms decision time
- **Transport Adapters (F5.1)**: ≥2 Gbps throughput
- **Streaming (F5.6)**: <200ms latency

### Security Requirements

- **VC Verification (F2.1)**: Cryptographic signature validation
- **Policy Enforcement (F3.4)**: Runtime access control
- **Transport Security**: TLS 1.3 minimum
- **Audit Logging (F6.2)**: Tamper-evident logs

### Scalability Requirements

- **Catalog (F4.1)**: Support 10K+ assets
- **Policy Engine (F3.1)**: 1K+ concurrent decisions
- **Data Plane (F5.1)**: Horizontal scaling
- **Observability (F6.1)**: High-volume telemetry

This feature analysis provides a comprehensive breakdown of all requirements from the PRD, organized by implementation stages and complexity, enabling systematic development planning and progress tracking.

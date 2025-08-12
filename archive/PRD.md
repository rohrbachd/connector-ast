
# Product Requirements Document (PRD)

## 1) Vision & Scope

**Goal.** Build a lightweight, standards-first connector to participate in IDSA/Gaia‑X-aligned dataspaces with minimal footprint and maximum developer ergonomics. The connector must interoperate via the Dataspace Protocol (DSP), use verifiable credentials (VCs) for trust, treat **applications/services as first‑class assets**, and keep a hard separation of control- vs. data-plane. It must be cloud/edge/on‑prem friendly and easy to extend for any industry.

**Non‑goals.** Replacing DSP, the EUDI Wallet, or Gaia‑X Federation Services (GXFS/XFSC); designing new cryptography; baking-in sector-specific semantics.

**Core principles.**

- **Simplicity over ceremony.** Fewer moving parts, clear interfaces, reference defaults.
    
- **Interoperability first.** Conform to DSP; align with Gaia‑X Trust Framework and DSBA Blueprint; use W3C VC 2.0 + OID4VP/OID4VCI; build ODRL policies for contracts.
    
- **Decentralized by default.** No mandatory central broker; federated catalogs and peer‑to‑peer capability.
    
- **Apps and Services are first‑class.** Besides “data provider,” model “**service provider**” (application/API/compute‑to‑data) with the same lifecycle as datasets.
    
- **Semantic by design.** JSON‑LD/RDF for metadata; SHACL for shapes; optional NGSI‑LD profile.
    
- **Security & sovereignty.** End‑to‑end authZ via policies, privacy‑preserving VC flows, auditability/observability.
    

## 2) Roles & Terminology

- **Participant**: Legal entity in a dataspace.
    
- **Connector**: This product. Implements DSP control plane, data plane adapters, policy engine, and wallet/verifier integration.
    
- **Data Provider**: Exposes datasets or streams.
    
- **Service Provider (first‑class)**: Exposes services/applications/APIs (e.g., analytics, simulation, ML‑as‑a‑service) under usage policies.
    
- **Data Consumer / Service Consumer**: Counterpart that negotiates agreements and consumes data/services.
    
- **Federation Services** (optional): Identity/Trust, Federated Catalog, Compliance (GXFS/XFSC).
    
- **Wallet**: EUDI‑conformant (or equivalent) holding VCs for participants, roles, and attributes.
    

## 3) Standards & Compliance Baseline

- **Interoperability**: Conformant **Dataspace Protocol** endpoints, state machines, and payloads.
    
- **Trust & Identity**: **W3C VC 2.0**, **OID4VP/OID4VCI**; DID support (did:web minimum; pluggable others). Support SD‑JWT VC and ISO mDL/mdoc via profile.
    
- **Gaia‑X**: Publish/consume **Gaia‑X credentials** for offerings; optional label-readiness (L1→L3).
    
- **Contracts**: **ODRL** policy model and profile for usage control; map to DSP negotiation and agreement objects.
    
- **Semantics**: JSON‑LD contexts; optional **DCAT‑AP** for datasets; **NGSI‑LD** profile for context data; **SHACL** shapes for validation.
    
- **Observability**: Contract/activity state observability as per IDSA guidance; optional clearing/billing hooks.
    

## 4) High‑Level Architecture

### 4.1 Control Plane (CP)

- **CP‑Gateway (HTTP/REST)**: Exposes DSP endpoints: Catalog, Contract Negotiation, Agreement, Transfer initiation, Participant metadata.
    
- **Identity & Trust Adapter**: Integrates with OID4VP/OID4VCI, verifies VPs from wallets, and manages trust anchors (Gaia‑X, sector schemes). DID resolution (did:web default).
    
- **Policy Service**: ODRL parsing/validation; conflict resolution; policy decision point (PDP) issuing permit/deny/obligations; transformation to runtime guards.
    
- **Catalog Service**: Semantic catalog for datasets **and** services. Supports DCAT‑AP/NGSI‑LD/JSON‑LD; full‑text + SPARQL (optional); profile‑aware discovery.
    
- **Agreement Service**: DSP state machine for proposals/counter‑offers/agreements; persists signed offers; binds VCs and obligations.
    
- **Observability Bus**: Emits contract/transfer telemetry (OpenTelemetry events + JSON‑LD activity records) to internal store and optional external observers.
    

### 4.2 Data Plane (DP)

- **DP‑Gateway**: Executes agreed transfers/invocations. Enforces PDP decisions and obligations (rate/time/geo/purpose/count).
    
- **Adapters**:
    
    - **Pull/Push data**: HTTP(S), S3/Blob/MinIO, WebDAV, NFS, MQTT, Kafka.
        
    - **Compute‑to‑Data / Service calls**: HTTP APIs (OpenAPI), AsyncAPI (MQTT/Kafka), OPC‑UA (optional), gRPC (optional).
        
    - **Streaming**: WebSub/MQTT/Kafka with token‑bound access.
        
- **Guards/Proxies**: Inline enforcement for ODRL duties (e.g., deletion after T, notify webhook, watermark, geo‑fencing via IP/claims, count‑limited tokens).
    

### 4.3 Persistence

- **Metadata store**: Document DB or triplestore (RDF/JSON‑LD).
    
- **Agreements & Logs**: Append‑only store with hash‑chain receipts; exportable to external notaries.
    

### 4.4 Deployment

- **Footprints**:
    
    1. **Edge/On‑prem single‑node**: CP+DP in one process; in‑memory or embedded DB.
        
    2. **Standard**: CP and DP pods; stateless CP; DP near data.
        
    3. **Scale‑out**: Separate adapters and PDP; horizontal autoscaling; multi‑zone.
        

## 5) Detailed Requirements

### 5.1 Functional

**F1. DSP Control Plane**

- F1.1 Implement DSP Catalog: publish/search dataset **and service** offers; semantic filters; pagination.
    
- F1.2 Implement DSP Contract Negotiation: proposal → counter‑offer → agreement; resumable; idempotent.
    
- F1.3 Implement DSP Transfer: create transfer processes for data or service invocation; surface states.
    
- F1.4 Participant/connector self‑descriptions; publish Gaia‑X credentials when configured.

**F2. Trust & Identity (Wallet‑centric)**

- F2.1 Verify VPs from EUDI or equivalent wallets via **OID4VP**; support SD‑JWT VC and JSON‑LD VC; did:web resolution baseline.
    
- F2.2 Obtain role/attribute VCs (e.g., “Data Provider,” “Service Provider,” sector roles). Cache & revocation check.
    
- F2.3 **AuthZ binding**: Map presented attributes/roles into policy evaluation context.
    

**F3. ODRL‑based Contracts**

- F3.1 Accept/issue offers as ODRL policies (Offer/Agreement classes) with permissions/prohibitions/duties.
    
- F3.2 Support common constraints: purpose, purpose class, time window, number‑of‑uses, geo region, retention, sub‑licensing, must‑delete, must‑notify.
    
- F3.3 Policy conflict detection & counter‑offer suggestions.
    
- F3.4 Obligations execution via DP guards (duty webhooks, watermarking, logging, proof‑of‑deletion receipts).
    

**F4. Services as First‑Class Citizens**

- F4.1 Service Offers include service descriptors (OpenAPI/AsyncAPI URLs), SLAs, pricing models (optional), and ODRL.
    
- F4.2 Invocation tokens are generated by CP, bound to Agreement ID + constraints; DP proxy enforces obligations.
    
- F4.3 Compute‑to‑Data: optional job runner invokes provider‑side functions with result‑sharing under policy.
    

**F5. Semantics**

- F5.1 JSON‑LD metadata; DCAT‑AP profile for datasets; NGSI‑LD profile for live context.
    
- F5.2 **SHACL** validation for offers and payload metadata; reject offers that don’t match shapes.
    
- F5.3 Content negotiation by profile (Accept‑Profile) for DP where applicable.
    

**F6. Observability & Audit**

- F6.1 Emit DSP state telemetry (catalog, negotiation, transfer) to an internal bus; configurable sinks (file, OTLP, webhook).
    
- F6.2 Export contract‑bound activity records for billing/clearing/notary.
    
- F6.3 Privacy controls: redact participants; aggregate counters; policy‑governed observer access.
    

**F7. Compatibility & Interop**

- F7.1 Pass DSP TCK; interop with EDC/Tractus‑X, TNO‑TSG, FIWARE connectors where possible.
    
- F7.2 Gaia‑X: publish/consume Gaia‑X credentials; optional label‑evidence packaging.
    

### 5.2 Non‑Functional

- **N1. Security**: TLS 1.3; mTLS optional; JOSE/COSE validation; secure key storage (HSM/TPM optional).
    
- **N2. Performance**: CP <150ms median for negotiation ops; DP ≥2 Gbps on commodity; streaming latency < 200ms local.
    
- **N3. Footprint**: Edge build <200MB image; RAM baseline <300MB; single binary deployment option.
    
- **N4. Reliability**: CP stateless; retries/idempotency; DP back‑pressure; at‑least‑once delivery for streams; health/readiness endpoints.
    
- **N5. Observability**: OpenTelemetry traces/metrics/logs; contract activity ledger export.
    
- **N6. Privacy**: Data‑minimizing logs; configurable PII scrubbing; sealed secrets.
    
- **N7. Compliance**: GDPR roles documentation; Data Processing Agreement (DPA) templates; records of processing activities (ROPA) hooks.
    

## 6) Minimal, Clean Technical Architecture (TypeScript‑first)

### 6.1 Tech Choices (recommended defaults)

- **Runtime**: Node.js (LTS) + TypeScript.
    
- **HTTP**: fastify (or express) with Zod schemas; OpenAPI; OAuth/OIDC flows for OID4VP bridging.
    
- **VC/OIDC**: openid‑client; sd‑jwt libraries; did‑key/did‑web via did‑jwt; pluggable verifiers.
    
- **Semantics**: jsonld, rdf‑ext, n3; rdf‑validate‑shacl; optional triplestore (Jena/Fuseki) or lightweight graph (quadstore).
    
- **Policy**: ODRL JSON‑LD model + PDP engine (custom, ~small) with SHACL shapes; duty executors as plugins.
    
- **Storage**: SQLite/PG; file‑based append‑only log; optional S3‑compatible.
    
- **Telemetry**: OpenTelemetry SDK; OTLP exporter.
    
- **Packaging**: Docker images; Helm chart; systemd service for on‑prem/edge.
    

### 6.2 Module Breakdown

- `cp-gateway`: DSP endpoints, request validation, idempotency keys.
    
- `identity-bridge`: OID4VP/OID4VCI verifier/issuer integration; DID resolution; trust store.
    
- `catalog`: JSON‑LD/DCAT store; SPARQL optional; SHACL validators.
    
- `policy-pdp`: ODRL parse/validate/evaluate; conflict detection; recommendation engine.
    
- `agreements`: Negotiation state machine; signatures; receipts.
    
- `dp-gateway`: Token‑bound guard; adapter orchestration; duty executors.
    
- `adapters/*`: HTTP, S3/Blob, WebDAV, MQTT, Kafka, OPC‑UA (optional), gRPC (optional).
    
- `observability`: Event bus; sinks (file, webhook, OTLP); redaction.
    
- `cli/admin`: Bootstrap keys, register trust anchors, publish offerings, run TCK.
    

### 6.3 Extension Model

- **Adapters**: `Adapter` interface (init, plan, execute, stop); config via JSON; hot‑pluggable.
    
- **Duties**: `DutyExecutor` interface (supports ODRL duty URI, validate, enforce, prove).
    
- **Identity Providers**: `Verifier`/`Issuer` interfaces for EUDI, enterprise IdPs, did:ebsi, etc.
    
- **Semantics**: Register JSON‑LD contexts; SHACL shape packs per industry.
    

## 7) Policy & Contracting Model (ODRL)

- **Profile**: Define a compact **ODRL profile for dataspaces** with URIs for common constraints and duties: `purpose`, `spatial`, `temporal`, `count`, `obligation/notify`, `obligation/delete`, `obligation/watermark`, `no_redistribution`, `sublicense=false`.
    
- **Mapping to runtime**: Each duty maps to an executor (e.g., `duty:notify` → webhook call; `duty:delete` → DP purge + signed receipt; `duty:watermark` → adapter transform filter).
    
- **Negotiation**: Offers carry ODRL; counter‑offers propose constraint tightening; agreements are signed ODRL Sets.
    
- **Evidence**: Store signed policy hash with Agreement ID; emit duty proof events.
    

## 8) Semantics‑driven Data & Services

- **Catalog metadata**: JSON‑LD with DCAT‑AP for datasets; for services, include OpenAPI/AsyncAPI links and semantic tags (SKOS concepts).
    
- **Validation**: SHACL shapes per asset type; reject at publication time.
    
- **Transformation**: Optional “profile adapters” (RDF mapping, SHACL‑AF rules) for format alignment.
    
- **NGSI‑LD profile**: Resource URLs expose NGSI‑LD endpoints when enabled; connector maps context brokers to DSP offers.
    

## 9) Security Architecture

- **Key management**: JWK sets; rotate via JWKS endpoint; HSM/TPM optional.
    
- **Transport**: TLS1.3; mTLS optional for private peering.
    
- **Tokens**: VP/VC verified at CP; DP enforces **token‑bound** context (Agreement ID, constraints, expiry).
    
- **Hardening**:
    
    - Minimal attack surface; strict CORS; input schemas; rate limiting; WAF‑ready.
        
    - Secrets in sealed stores; no long‑lived bearer tokens.
        
- **Supply chain**: SBOM; image signing (cosign); vulnerability scanning.
    

## 10) Deployment & Ops

- **Modes**: single‑binary; docker‑compose; Kubernetes Helm chart; air‑gapped install guide.
    
- **Config**: single `config.yaml` with profiles (edge/standard/scale‑out).
    
- **Monitoring**: OpenTelemetry exporters; Prometheus scrape; healthz/readyz; log correlation IDs.
    
- **Backups**: Metadata/agreements periodic snapshots; key escrow procedures.
    
- **Upgrades**: Blue/green CP; DP rolling; migration scripts.
    

## 11) Compliance & Certification Path

- **DSP**: Integrate and pass TCK in CI; publish conformance badge.
    
- **IDSA**: Map features to certification criteria; provide evidence package templates; target Assurance Level 1 initially; plan for Level 2.
    
- **Gaia‑X**: Publish Gaia‑X credentials; package label evidence (security, data protection, portability) where applicable.
    
- **GDPR & sectoral**: Provide DPA templates; data minimization settings; ROPA hooks; audit logs export.
    

## 12) Interoperability Notes (learning from existing connectors)

- **EDC/Tractus‑X**: Strong separation of CP/DP; extensive Java footprint. Our design offers equivalent separation with smaller footprint and a clearer plugin system. Ensure DSP/TCK compatibility for out‑of‑the‑box interop.
    
- **TNO Security Gateway**: Certified, wallet‑oriented identity. Emulate its clarity in trust integration while simplifying deployment.
    
- **FIWARE Dataspace Connector**: Emphasizes NGSI‑LD and cross‑component suite; we keep NGSI‑LD as an **optional** profile to stay general‑purpose.
    

## 13) Data & Service Onboarding Flows

1. **Bootstrap**: Generate keys; register trust anchors; configure wallet/verifier endpoints.
    
2. **Publish**: Create dataset/service offer (JSON‑LD + ODRL); run SHACL; publish to catalog.
    
3. **Discover**: Other participants query catalog by semantics and capabilities.
    
4. **Negotiate**: Exchange ODRL offers/counter‑offers → Agreement. Sign & store.
    
5. **Transfer/Invoke**: DP executes with guardrails; duty proofs emitted.
    
6. **Observe**: Contract telemetry exported to observers/clearing.
    

## 14) Example Artifacts (to deliver with MVP)

- **OpenAPI** for CP‑Gateway (DSP endpoints + admin APIs).
    
- **JSON‑LD Contexts**: Connector vocabulary; service descriptors.
    
- **ODRL Profile**: JSON‑LD context + SHACL shapes; examples (purpose/time/geo/count/no-redistribution).
    
- **SHACL Pack**: DCAT‑AP shapes; NGSI‑LD shapes; service-offer shapes.
    
- **Helm Chart**: CP/DP images; secrets; ingress; storage classes.
    
- **Quickstarts**:
    
    - Edge (single binary + config.yaml)
        
    - Kubernetes (minikube + Helm)
        
    - Interop with EDC / TNO TSG.
        

## 15) Roadmap

**MVP (≤12 weeks)**

- DSP CP endpoints; basic negotiation/transfer
    
- VC/OID4VP verification (did:web, SD‑JWT VC); role‑based authZ
    
- ODRL profile + PDP with common constraints/duties
    
- DP adapters: HTTP(S), S3/Blob, MQTT
    
- Catalog (JSON‑LD + DCAT‑AP), SHACL validation
    
- OpenTelemetry + contract activity log
    
- Helm chart + single‑binary edge build
    

**R2**

- AsyncAPI/gRPC adapters, Kafka streams
    
- Compute‑to‑Data job runner + sandbox
    
- Gaia‑X credential publication
    
- TCK badge + IDSA AL1 evidence kit
    
- Policy duty plugins (watermark, anonymize)
    

**R3**

- NGSI‑LD profile; triplestore backend; SPARQL
    
- Advanced obligations (geo‑fencing, retention re‑checks)
    
- Confidential compute option (TEE) for DP
    
- Gaia‑X label evidence packs; IDSA AL2 prep
    

## 16) Documentation & DX

- **One‑hour setup** guides for edge/K8s
    
- **Recipes**: “Publish a service,” “Negotiate an agreement,” “Enforce a duty,” “Use EUDI wallet”
    
- **Reference examples**: interop with EDC/Tractus‑X/TNO/FIWARE
    
- **SDK**: TypeScript client & admin CLI; code samples
    

## 17) Risks & Mitigations

- **Spec churn** → Track DSP/DCP/OID4VC releases; adapter isolation; conformance tests in CI.
    
- **Wallet diversity** → OID4VP/OID4VCI baseline; HAIP profile support; pluggable verifiers.
    
- **Over‑customization** → Shapes & profiles to contain variance; keep core minimal.
    
- **Performance at edge** → Single‑binary build; zero‑copy adapters; back‑pressure; async IO.
    

## 18) Acceptance Criteria (MVP)

- Pass DSP TCK core suite; interop demo with at least **EDC** and **TNO TSG**.
    
- Verify **two** distinct VC formats (SD‑JWT VC + JSON‑LD VC) via OID4VP.
    
- Publish/consume **service** offers with ODRL contracts; enforce ≥4 duties.
    
- Run on **3 footprints** (edge, K8s, on‑prem VM) with the same artifacts.
    
- Telemetry & contract activity export enabled; privacy redaction toggles.
    

---

**Appendix A – Data Model Sketches** (to be delivered with artifacts)

- ODRL profile JSON‑LD context
    
- Service Offer (@type ServiceOffer) with OpenAPI link, SLA, ODRL policy
    
- Agreement record with policy hash and duty receipts
    
- Contract activity event JSON‑LD shape
    

**Appendix B – Example ODRL snippets** (purpose/time/geo/count/no‑redistribution)

**Appendix C – SHACL shapes** for DCAT‑AP dataset, service‑offer, and agreement

## 19) Personas & Scenario‑Driven Requirements

### 19.1 Personas

- **P1 – Service/App Developer (Provider‑side)**: Builds and offers compute‑to‑data apps/APIs. Comfortable with TypeScript/Node and OpenAPI.
    
- **P2 – Data Product Owner (Provider‑side)**: Curates datasets/streams; wants governed sharing with minimal ops overhead.
    
- **P3 – Service/Data Consumer (Analyst/Engineer)**: Wants to discover, negotiate, and invoke services or pull data with clear usage rights.
    
- **P4 – Dataspace Operator**: Runs policies, trust anchors, conformance and interop testing for a domain/region.
    
- **P5 – Platform/Cloud‑Edge Operator**: Deploys and operates the connector on K8s, VMs, and edge gateways.
    
- **P6 – Security & Compliance Officer**: Requires auditability, GDPR/ROPA hooks, and evidence for IDSA/Gaia‑X compliance.
    
- **P7 – Enterprise IAM Admin**: Manages wallet/verifier integration, key rotation, and role attributes.
    

### 19.2 Persona Goals & Success Metrics

- **P1**: Publish a service in ≤30 minutes; zero custom crypto; ≤1 YAML file; have a curlable endpoint with policy enforcement. **KPI:** Time‑to‑First‑Service (TTFS) ≤ 30 min.
    
- **P2**: Publish a dataset/stream with SHACL validation and ODRL in ≤45 minutes. **KPI:** Time‑to‑First‑Dataset (TTFD) ≤ 45 min.
    
- **P3**: Find an offer by semantic tag and complete negotiation in ≤10 minutes using defaults. **KPI:** Negotiation Path ≤ 5 API calls.
    
- **P4**: Onboard a participant (trust anchor + policies) in ≤15 minutes; run DSP TCK nightly. **KPI:** Zero manual steps after bootstrap.
    
- **P5**: Install upgrade in < 5 minutes with Helm or single binary; roll back safely. **KPI:** MTTR < 15 minutes.
    
- **P6**: Export an evidence bundle for a random agreement in < 2 minutes. **KPI:** 100% duty receipts traceability.
    
- **P7**: Rotate keys and update trust anchors without downtime. **KPI:** Key rotation under 60s, no DP interruption.
    

### 19.3 Persona‑Driven User Stories & Acceptance Criteria

#### P1 – Service/App Developer

- **US‑P1‑1**: _As a Service Developer, I want to publish my HTTP API as a Service Offer with an ODRL policy so that consumers can negotiate access._
    
    - **Acceptance**:
        
        - `spctl publish service` accepts `service.yaml` with OpenAPI URL + ODRL block.
            
        - Catalog shows the offer with JSON‑LD context and SHACL‑validated shape.
            
        - A default counter‑offer template is auto‑generated if constraints conflict.
            
- **US‑P1‑2**: _I want the DP to enforce rate limits and purpose constraints for my service._
    
    - **Acceptance**:
        
        - DP injects a sidecar/proxy that verifies invocation tokens bound to Agreement ID and performs configurable rate limiting.
            
        - Duties `notify` and `count` generate receipts written to the activity log.
            
- **US‑P1‑3**: _I want a local dev loop._
    
    - **Acceptance**: `docker compose up` launches CP+DP and a mock verifier; `spctl dev issue‑token` mints test tokens.
        

#### P2 – Data Product Owner

- **US‑P2‑1**: _Publish a dataset with DCAT‑AP metadata and ODRL policy; validate via SHACL._
    
    - **Acceptance**: `spctl publish dataset dataset.yaml` fails fast on shape violations; success creates a catalog entry and versioned offer.
        
- **US‑P2‑2**: _Expose S3 and MQTT sources through adapters with minimal config._
    
    - **Acceptance**: S3/MQTT adapters configured in ≤20 lines YAML; DP enforces retention and geographic constraints.
        
- **US‑P2‑3**: _Proof of deletion for time‑bounded access._
    
    - **Acceptance**: Duty executor emits signed deletion receipts.
        

#### P3 – Consumer (Analyst/Engineer)

- **US‑P3‑1**: _Discover and negotiate access using defaults._
    
    - **Acceptance**: `GET /dsp/catalog?tag=traffic&purpose=research` returns offers; `POST /dsp/negotiations` with template policy yields agreement in ≤2 round‑trips.
        
- **US‑P3‑2**: _Invoke a remote service (compute‑to‑data) and retrieve results._
    
    - **Acceptance**: `POST /dsp/transfers` with `type=service-invoke` returns invocation token; DP proxy forwards to provider API; results streamed with correlation ID.
        

#### P4 – Dataspace Operator

- **US‑P4‑1**: _Define trust anchors and a policy catalog (allowed purposes, geo, duty packs)._
    
    - **Acceptance**: Admin API `POST /admin/trust‑anchors`, `POST /admin/policy‑packs` with versioning and staged rollout.
        
- **US‑P4‑2**: _Run conformance and publish interop status._
    
    - **Acceptance**: `spctl conformance run` executes DSP TCK; results signed and exportable.
        

#### P5 – Platform/Cloud‑Edge Operator

- **US‑P5‑1**: _Install on K8s and edge with the same artifact._
    
    - **Acceptance**: Helm chart deploys CP/DP with optional adapters; single‑binary tarball for edge installs with systemd unit template.
        
- **US‑P5‑2**: _Upgrade with zero downtime for CP._
    
    - **Acceptance**: Blue/green CP supported; DP preserves transfer state.
        

#### P6 – Security & Compliance Officer

- **US‑P6‑1**: _Produce an evidence bundle for an agreement._
    
    - **Acceptance**: `GET /admin/evidence/{agreementId}` returns policy hash, duty receipts, and telemetry excerpts.
        
- **US‑P6‑2**: _PII‑aware logging._
    
    - **Acceptance**: Redaction rules declarative; default on; audit log includes who, what, when, why (purpose), where (geo).
        

#### P7 – Enterprise IAM Admin

- **US‑P7‑1**: _Integrate EUDI wallet/verifier and map attributes to roles._
    
    - **Acceptance**: OID4VP verifier config with trust store; mapping file translates claims to roles (`ServiceProvider`, `DataProvider`, `ResearchOrg`).
        
- **US‑P7‑2**: _Rotate keys and expose JWKS._
    
    - **Acceptance**: `POST /admin/keys/rotate` updates active key; DP validates via JWKS cache; JWKS endpoint supports `kid` pinning.
        

---

## 20) End‑to‑End Flows (How It Works in Practice)

### 20.1 Service Provider – Offer & Invocation

1. **Bootstrap**: `spctl init` → generates keys, registers wallet/verifier.
    
2. **Describe**: `service.yaml` with:
    
    ```yaml
    kind: ServiceOffer
    id: urn:svc:anomaly-detector:1.0
    openapi: https://provider.example.com/openapi.json
    sla: { rps: 50, latency_ms: 200 }
    odrl:
      permission:
        - action: use
          constraint:
            - leftOperand: purpose
              operator: isAnyOf
              rightOperand: [research]
            - leftOperand: count
              operator: lteq
              rightOperand: 1000
      duty:
        - assigner: did:web:provider
          action: notify
          target: webhook://notify/agreements
    ```
    
3. **Publish**: `spctl publish service service.yaml` → SHACL validate → catalog entry.
    
4. **Negotiate** (consumer‑initiated via DSP): CP suggests counter‑offers if needed.
    
5. **Invoke**: `POST /dsp/transfers { type: "service-invoke", agreementId, operation: "/predict" }` → returns invocation token; DP proxy enforces duties.

6. “When the service needs to send results back, the CP either (A) mints a ticket under the single dual-direction Agreement, or (B) uses the reciprocal Agreement link to mint a return ticket.    

### 20.2 Data Provider – Dataset & Stream

1. **Describe**: `dataset.yaml` (DCAT‑AP JSON‑LD + ODRL) referencing S3 bucket and MQTT topic.
    
2. **Publish**: Validate via SHACL; create offer with adapters `s3`, `mqtt`.
    
3. **Transfer**: Upon agreement, CP mints a **token‑bound URL**; DP gateway checks count/time/purpose; receipts written.
    

### 20.3 Consumer – Discover → Agree → Use

1. **Discover**: `GET /dsp/catalog?tag=energy&profile=dcat-ap`.
    
2. **Negotiate**: `POST /dsp/negotiations` with selected policy template.
    
3. **Use**: For data: signed URL/stream token; for service: invocation token.
6. “When the service needs to send results back, the CP either (A) mints a ticket under the single dual-direction Agreement, or (B) uses the reciprocal Agreement link to mint a return ticket.    

### 20.4 Operator – Policy Packs & Trust Anchors

- **Policy Packs**: Bundles of approved constraints/duties (e.g., research‑only, EU‑only, 30‑day retention).
    
- **Trust Anchors**: Gaia‑X/IDSA lists, sectoral lists; rotated via admin API.
    

---

## 21) API Surface (Draft OpenAPI Sketch)

```
POST   /dsp/negotiations                   # start negotiation (DSP)
GET    /dsp/negotiations/{id}              # state
POST   /dsp/agreements                     # finalize agreement (DSP)
POST   /dsp/transfers                      # start transfer or service invocation (DSP)
GET    /dsp/catalog                        # catalog query (DSP)
POST   /admin/trust-anchors                # add/rotate anchors
POST   /admin/policy-packs                 # register pack
POST   /admin/keys/rotate                  # rotate signing key
GET    /admin/evidence/{agreementId}       # export evidence bundle
```

**Notes**: All DSP endpoints accept/produce JSON‑LD; admin endpoints are local‑only or mTLS‑guarded.

---

## 22) CLI & DX

- **Install**: `curl -sSL get.spcn.io | bash` (example) → installs `spctl`.
    
- **Quickstart Service**: `spctl quickstart service --openapi ./openapi.yaml --policy ./policy.jsonld`.
    
- **Conformance**: `spctl conformance run --peer https://edc.example`.
    
- **Scaffold**: `spctl scaffold adapter http` → generates TypeScript adapter skeleton with tests.
    

---

## 23) Deployment Playbooks

### 23.1 Kubernetes (Standard)

- Prereqs: Ingress, cert‑manager, Prometheus, OTLP collector.
    
- `helm repo add spcn https://charts.spcn.io && helm install spcn spcn/connector -f values.yaml`
    
- Values toggles: `profile=edge|standard|scaleout`, adapters enabled, secrets from sealed‑secrets.
    

### 23.2 Edge (Single Binary)

- Download tarball; `./spcn run -c config.yaml`.
    
- Systemd unit provided; local SQLite + file‑log; MQTT/S3 adapters optional.
    

### 23.3 On‑Prem VM

- Docker Compose with CP+DP; bind mounts for keys and logs; mTLS between CP and DP optional.
    

---

## 24) Extension Interfaces (TypeScript)

```ts
export interface TransportAdapter {
  readonly id: string;
  init(cfg: unknown): Promise<void>;
  plan(req: TransferPlanRequest): Promise<TransferPlan>; // validate constraints
  execute(plan: TransferPlan, ctx: EnforcementContext): Promise<RunResult>;
  stop(): Promise<void>;
}

export interface DutyExecutor {
  supports(uri: string): boolean; // e.g., odrl:delete, ids:notify
  validate(policy: Policy): ValidationResult;
  enforce(ctx: EnforcementContext): Promise<DutyReceipt>;
}
```

---

## 25) Simplicity & Operability KPIs

- **Config size**: Edge `config.yaml` ≤ 60 lines for a 2‑adapter setup.
    
- **Binary/image**: Edge image < 200MB; K8s CP pod RSS < 250MB idle; DP < 300MB idle.
    
- **TTFS/TTFD**: ≤ 30/45 min (see 19.2).
    
- **Upgrade**: CP blue/green in < 5 minutes.
    

---

## 26) Threat Model & Controls (Abbrev.)

- **Threats**: Token theft, replay, policy bypass, catalog poisoning, duty evasion, adapter exploit.
    
- **Controls**: Short‑lived, audience‑bound, agreement‑bound tokens; nonce + proof‑of‑possession; schema validation; JSON‑LD context whitelisting; SBOM + cosign; duty receipts with hash‑chain; strict adapter sandboxing.
    

---

## 27) Interop Profiles & Migrations

- **EDC/Tractus‑X**: DSP interop mode; supports HTTP pull/push; map ODRL profile to EDC policy model. Provide a `migration edc` command to convert assets/offers.
    
- **TNO TSG**: Wallet‑first interop; verify OID4VP compatibility; publish Gaia‑X credentials when enabled.
    
- **FIWARE**: NGSI‑LD profile switch enabling context broker mapping.
    

---

## 28) Documentation Deliverables (Expanded)

- Persona‑based quickstarts (P1/P2/P3/P4/P5).
    
- Admin Guide: trust anchors, policy packs, evidence export.
    
- Developer Guide: adapters, duty executors, policy recipes.
    
- Ops Guide: K8s/edge playbooks, backups, upgrades, troubleshooting.
    

## 29) Real‑Time & Standing Agreements (Subscriptions, Multi‑Asset, Token Refresh)

### 29.1 Agreement Types

- **One‑shot Agreement**: Single transfer/invocation; default.
    
- **Standing Agreement** _(new)_: A durable contract bound to a **Selector** that may authorize **many transfers** over time without renegotiation until expiry or revocation.
    
    - **Selector** (any of):
        
        - **By IDs**: explicit asset/service IDs.
            
        - **By Tags/Semantics**: JSON‑LD terms, SKOS concepts (e.g., `weather:daily`, `region:DE`).
            
        - **By Query**: SPARQL/JSONPath/NGSI‑LD filters (e.g., `observedProperty=temperature AND date=today`).
            
        - **By Temporal Coverage**: new assets whose `dct:temporal` overlaps the agreed window are **auto‑covered**.
            
    - **Policy Hash Freeze**: Agreement records the policy hash; policy _updates_ create a new version and optional **renewal proposal**.
        

### 29.2 Transfer Modes under a Standing Agreement

- **Batch (Periodic Pull)**: Connector issues short‑lived **tickets** to retrieve available assets since the last watermark.
    
- **Push/Notify**: Provider CP posts **New‑Asset Notifications** (webhook) when Selector matches newly published assets.
    
- **Streaming**: MQTT/Kafka under the same Agreement; topic binding recorded in the Agreement.
    
- **Request/Response Service Invocations**: Invocation tickets minted per call; usage/quota metered against Agreement.
    

### 29.3 Tickets, Watermarks & Usage

- **Ticket**: A signed, short‑lived token (DPoP or mTLS‑bound) for a single transfer or invocation derived from `{agreementId, selector, obligations}`.
    
- **Watermark**: Per Agreement, the DP maintains a **cursor** (e.g., last `temporal.end`, last object ID). Consumers can pass `since` to page incrementally.
    
- **Quota & Counters**: ODRL `count`, `time`, `purpose` constraints enforced; `GET /dsp/usage/{agreementId}` exposes live counters.
    

### 29.4 Subscriptions API

- **Create**: `POST /dsp/subscriptions` `{ agreementId, selectorRef, mode: periodic|push|stream, schedule?: RRULE, since?, until? }`
    
- **Manage**: `GET /dsp/subscriptions/{id}` state; `DELETE` to cancel; events emitted on execution/failure.
    
- **Tickets**: `POST /dsp/tickets` `{ agreementId, assetId? | since?, mode }` → `{ ticket, expiry }`.
    

### 29.5 Renewal & Revocation

- **Auto‑Renewal Proposal**: When nearing expiry or hitting quota, CP can issue a **counter‑offer** to extend or adjust constraints.
    
- **Emergency Stop**: Revocation immediately invalidates tickets; DP rejects with `revoked` code; duty `notify` informs counterpart.
    

### 29.6 Acceptance Criteria (Real‑Time)

- Create a standing agreement for **daily weather data** covering `region=DE` with 365‑day validity.
    
    - Retrieve today’s asset with **no renegotiation**: **(1)** `POST /dsp/tickets` → **(2)** `GET <signed URL>`.
        
    - Schedule periodic pulls at 05:00 CET via `POST /dsp/subscriptions` with `RRULE:FREQ=DAILY;BYHOUR=5;BYMINUTE=0`.
        
- For **PV production forecasting** (non‑streaming batches hourly): watermarked pulls every hour with duty receipts; late/missed runs are caught up using `since`.
    

---

## 30) Policy Catalog, Composition & Assignment

### 30.1 Policy Objects

- **Named Policies**: First‑class objects with semantic metadata and **semver** (`policy:research‑eu@1.2.0`).
    
- **Composition**: Policies are **composable**: `base + purpose‑pack + duty‑pack + geo‑pack`. Deterministic merge with precedence `offer‑local > assigned pack > base`.
    
- **Parameters**: Policy templates with variables (e.g., `$retentionDays`, `$regions`).
    

### 30.2 Assign by Reference

- Offers reference policies by **URI** (`odrl:hasPolicy → urn:policy:research‑eu@1.2.0`). Existing Agreements keep the **policy hash**.
    
- **Bulk Assignment**: Assign a policy to all assets matching a selector (tags, provider namespace, service kind) with one command.
    

### 30.3 Versioning & Rollout

- **Immutable Agreements**: Existing agreements pinned to the **old policy hash** remain valid.
    
- **Staged Rollout**: `canary=10%` of new negotiations use the new policy; rollback supported.
    

### 30.4 APIs & CLI

- `POST /admin/policies` (create), `GET /admin/policies`, `POST /admin/policies/{id}/assign` (bulk), `POST /admin/policy‑packs` (bundle).
    
- `spctl policy create|compose|assign|preview` with **what‑if** diff and SHACL validation.
    

### 30.5 Acceptance Criteria (Policies)

- Create three reusable policies: _Research‑EU‑30d_, _Commercial‑Global‑NoRedistribution_, _Telemetry‑Pseudonymized_.
    
- Assign different mixes to **10 datasets** and **3 services** in < **2 minutes** via bulk assignment.
    
- Rolling replace _Research‑EU‑30d v1.2.0 → v1.3.0_ with zero downtime; existing Agreements untouched.
    

---

## 31) Persona Additions (Realtime & Policies)

### P2 – Data Product Owner

- **US‑P2‑4**: _Define a standing agreement selector for my “weather‑daily” family and let consumers retrieve new files every day without renegotiation._
    
    - **Acceptance**: Selector by tag `weather:daily`; subscription succeeds; duty receipts per retrieval.
        
- **US‑P2‑5**: _Attach a reusable policy pack to a set of 25 offers._
    
    - **Acceptance**: Bulk assignment by tag finishes < 60s and validates against SHACL.
        

### P1 – Service/App Developer

- **US‑P1‑4**: _Expose an hourly inference API under a standing agreement with 10k calls/day quota._
    
    - **Acceptance**: Quota enforced by DP proxy; `GET /dsp/usage/{agreementId}` shows decrements.
        

### P3 – Consumer (Analyst/Engineer)

- **US‑P3‑3**: _Subscribe to PV forecast batches every 60 minutes and recover missed runs._
    
    - **Acceptance**: Scheduler executes hourly (±30s); missed window triggers catch‑up using `since` watermark.
        

### P4 – Dataspace Operator

- **US‑P4‑3**: _Roll out a new default “research‑only” policy to all new negotiations next week._
    
    - **Acceptance**: Staged rollout configured; audit shows proportion applied; rollback possible.
        

### P5 – Platform/Cloud‑Edge Operator

- **US‑P5‑3**: _Run the built‑in scheduler HA._
    
    - **Acceptance**: Leader election across CP pods; at‑least‑once execution; idempotent transfers.
        

### P6 – Security & Compliance Officer

- **US‑P6‑3**: _Generate a monthly evidence report for a standing agreement._
    
    - **Acceptance**: Evidence bundle includes list of executions, tickets, duty receipts, and usage counters.
        

---

## 32) API Surface (Extensions)

```
POST   /dsp/subscriptions                   # create standing subscription (pull/push/stream)
GET    /dsp/subscriptions/{id}              # inspect state / last watermark
DELETE /dsp/subscriptions/{id}              # cancel
POST   /dsp/tickets                         # mint short‑lived transfer/invocation ticket
GET    /dsp/usage/{agreementId}             # live counters/quota status
POST   /admin/policies                      # create/update named policies
POST   /admin/policies/{id}/assign          # bulk assign policy to offers by selector
GET    /dsp/agreements/{id}/links → { reciprocalOf?: string[], governsAssets: string[] }
```

**Notes**: Tickets are PoP‑bound (DPoP or mTLS). Subscriptions can define **RRULE** or `mode=push` with webhook registration. All payloads remain JSON‑LD.

---

## 33) Operational Semantics & SLOs (Realtime)

- **Scheduler Drift**: < ±30s under light load; < ±2m under heavy load.
    
- **Ticket TTL**: Default 5 minutes (configurable). Clock‑skew tolerance ±60s.
    
- **Catch‑up**: Watermark ensures no gaps/duplication; transfers are idempotent by `(agreementId, assetId)`.
    
- **Throughput**: ≥ 1k tickets/min issuance on CP node (baseline hardware), DP ≥ 2 Gbps sustained for batch pulls.
    
- **HA**: CP stateless; DP maintains watermarks in a replicated store.
    

---

## 34) Examples (YAML)

### 34.1 Standing Agreement Subscription – Daily Weather

```yaml
kind: Subscription
agreementId: urn:agreements:weather‑de‑2025
selectorRef: urn:selector:weather‑daily‑de
mode: periodic
schedule: RRULE:FREQ=DAILY;BYHOUR=5;BYMINUTE=0;BYSECOND=0;TZID=Europe/Berlin
since: 2025‑08‑01T00:00:00+02:00
until: 2026‑07‑31T23:59:59+02:00
obligations:
  - action: notify
    target: https://consumer.example.com/hooks/duty
```

### 34.2 Policy Pack – Research EU 30d

```json
{
  "@context": ["https://www.w3.org/ns/odrl.jsonld"],
  "@id": "urn:policy:research-eu@1.2.0",
  "profile": "urn:odrl:profile:dataspaces-basic",
  "permission": [{
    "target": "urn:selector:tag:researchable",
    "action": "use",
    "constraint": [
      {"leftOperand": "purpose", "operator": "isAnyOf", "rightOperand": ["research"]},
      {"leftOperand": "spatial", "operator": "isAnyOf", "rightOperand": ["EU"]}
    ]
  }],
  "duty": [
    {"action": "notify"},
    {"action": "delete", "constraint": [{"leftOperand": "elapsedTime", "operator": "lteq", "rightOperand": "P30D"}]}
  ]
}
```

---

## 35) Changes to Functional Requirements (Addenda)

- **F1.5**: Support **standing agreements** bound to selectors; no renegotiation needed for assets matching selector until expiry.
    
- **F1.6**: Provide **Subscriptions API** and HA scheduler for periodic pulls and push notifications.
    
- **F1.7**: Provide **Tickets API** for token‑bound, short‑lived access under an existing agreement.
- **F1.8** Reciprocal agreements (two-way use-case). The connector MUST support two patterns for bidirectional exchanges:
(A) Single Agreement, Dual-Direction: one Agreement that enumerates both inbound and return assets/services; or
(B) Reciprocal Agreements: a primary Agreement (DP→SP) and a linked reciprocal Agreement (SP→DP) for return data or service callbacks. The link is recorded as {agreementId} ↔ {reciprocalAgreementId}.

- **F1.9** Provider-initiated results. Under an existing Agreement (single or reciprocal), the service/data provider MAY initiate transfers to deliver results (push, stream, or “service-callback”). Tickets/PoP tokens MUST be agreement-bound.

- **F1.10** Return-asset identity. Return data or result streams MUST be catalogued as assets (or service operations) with their own IDs and policies, to avoid implicit reuse of the inbound policy.
-     
- **F3.5**: Policies are **assignable by reference** (URI), with composition and parameterization; Agreements pin policy hash.
- **F3.6** Output policy. The service provider MAY attach an ODRL policy to result assets (e.g., “no redistribution,” “retain ≤ 30 days,” “EU only”). The consumer MUST accept or counter-offer before receiving results, unless already covered by a single dual-direction Agreement.

- **F3.7** Agreement linking. Agreements include spcn:reciprocalOf (IRI). Evidence bundles MUST capture both sides when present.

- **F6.4**: Expose **usage/quota counters** per Agreement via API and evidence bundles.
    

---

## 36) Simplicity KPIs (Realtime)

- Subsequent retrieval under an existing agreement: **≤ 2 API calls** (ticket → fetch).
    
- Bulk policy assignment to ≥ 20 offers in **< 2 minutes**.
    
- Create + activate a daily subscription in **< 60 seconds** using CLI.
    

## 37) Extension Interfaces — Deep Dive

**Purpose.** Keep the core tiny but extensible. Adapters move bytes; Duty Executors enforce ODRL; Identity bridges verify/issue credentials. Below are the concrete shapes the SDK exposes.

```ts
// Common primitives
export type TransferMode = "pull" | "push" | "stream" | "service";
export interface ConstraintKV { key: string; op: string; value: unknown }

export interface EnforcementContext {
  agreementId: string;
  policyHash: string;        // pinned in the Agreement
  subjectDid: string;        // counterparty DID
  purpose?: string;          // e.g., research
  constraints: ConstraintKV[]; // expanded from ODRL
  token: string;             // PoP-bound invocation/transfer token
  now: Date;                 // clock reference
  watermark?: string;        // pagination/catch-up cursor
  counters?: Record<string, number>; // usage/quota view
  audit: (e: object) => void; // emit activity events (duty receipts, etc.)
}

// Adapter contracts (data and service)
export interface TransferPlanRequest {
  mode: TransferMode;        // pull/push/stream/service
  assetId?: string;          // datasets/streams
  service?: { id: string; operation?: string; inputSchemaRef?: string };
  constraints: ConstraintKV[];
}

export interface TransferPlan {
  transportAdapterId: string;
  steps: Array<{ kind: "httpGet"|"httpPost"|"s3"|"mqtt"|"kafka"|"grpc"; cfg: any }>;
  obligations: string[];     // URIs of duties enforced inline by this plan
}

export interface TransportAdapter  {
  readonly id: string;
  init(cfg: unknown): Promise<void>;
  plan(req: TransferPlanRequest): Promise<TransferPlan>; // validate constraints & build plan
  execute(plan: TransferPlan, ctx: EnforcementContext): Promise<{ status: "ok"|"error"; receipt?: object }>;
  stop(): Promise<void>;
}

// Duty executors (ODRL duties → runtime effects)
export interface DutyExecutor {
  supports(odrlUri: string): boolean;   // e.g., odrl:delete, odrl:notify, ds:watermark
  validate(ctx: EnforcementContext): { ok: boolean; reason?: string };
  enforce(ctx: EnforcementContext): Promise<{ proof?: string; details?: object }>;
}

// Identity bridges (wallet/verifier integration)
export interface Verifier {
  verifyPresentation(vpToken: string): Promise<{ did: string; claims: any; trustLevel: "gx"|"idsa"|"local" }>; 
  jwks(): Promise<any>; // for DP token validation
}
```

**Notes**

- Adapters stay pure I/O; **no policy logic** other than enforcing duties that require data-plane access.
    
- All plugin points are discoverable via DI (e.g., `spcn.adapters`, `spcn.duties`).
    

---

## 38) Offer Authoring — YAML vs JSON‑LD

**Why YAML in examples?** It’s a **developer-friendly authoring format** (familiar from Kubernetes). The **ground truth** stored and exchanged over APIs is **JSON‑LD**. The CLI (`spctl`) converts YAML ↔ JSON‑LD losslessly.

- Use **JSON‑LD** for any API call (`Content-Type: application/ld+json`).
    
- Use **YAML** locally if you prefer readability and comments.
    

**Mapping example** (excerpt from §20.1):

YAML authoring:

```yaml
kind: ServiceOffer
id: urn:svc:anomaly-detector:1.0
openapi: https://provider.example.com/openapi.json
odrl:
  permission:
    - action: use
      constraint:
        - leftOperand: purpose
          operator: isAnyOf
          rightOperand: [research]
```

JSON‑LD sent to the API:

```json
{
  "@context": [
    "https://www.w3.org/ns/odrl.jsonld",
    "https://spcn.example/contexts/connector-v1.jsonld"
  ],
  "@type": "ServiceOffer",
  "@id": "urn:svc:anomaly-detector:1.0",
  "spcn:openapi": "https://provider.example.com/openapi.json",
  "odrl:permission": [{
    "odrl:action": "odrl:use",
    "odrl:constraint": [{
      "odrl:leftOperand": "spcn:purpose",
      "odrl:operator": "odrl:isAnyOf",
      "odrl:rightOperand": ["spcn:research"]
    }]
  }]
}
```

---

## 39) Provider/Admin API — Assets, Policies, Selectors & Offers

**DSP covers inter‑connector negotiation/transfer.** For **authoring and lifecycle** of assets/services/policies/selectors/offers we expose a **Provider/Admin API**. Secure it via mTLS or private network.

```
# Assets & Services (draftable, versioned)
POST   /admin/assets                         # create dataset asset (DCAT‑AP JSON‑LD)
POST   /admin/services                       # create service asset (OpenAPI/AsyncAPI ref)
GET    /admin/assets|services                 # list (filter by tag, state, version)
GET    /admin/assets/{id}                     # get
PATCH  /admin/assets/{id}                     # update metadata (draft)
POST   /admin/assets/{id}/publish             # publish vX → catalog
POST   /admin/assets/{id}/deprecate           # mark as deprecated (keeps catalog entry)

# Policies & Packs
POST   /admin/policies                        # create/update named policy (JSON‑LD ODRL)
GET    /admin/policies                        # list
POST   /admin/policies/{id}/assign            # assign by selector (bulk)

# Selectors (for standing agreements & bulk ops)
POST   /admin/selectors                       # define selector (by ids/tags/query/temporal)
GET    /admin/selectors                        # list/get

# Offers (compose asset/service + policy + terms)
POST   /admin/offers                          # create contract offer (draft)
POST   /admin/offers/{id}/publish             # publish offer to DSP catalog
GET    /admin/offers                           # list/search
GET    /admin/offers/{id}                      # get
```

**Data models (abridged)**

```json
// Asset (dataset) — DCAT‑AP profile
{
  "@context": ["https://www.w3.org/ns/dcat.jsonld", "https://spcn.example/contexts/dataspace.jsonld"],
  "@type": "dcat:Dataset",
  "@id": "urn:asset:weather:daily:de:2025",
  "dct:title": "Daily Weather DE",
  "dcat:distribution": [{
    "@type": "dcat:Distribution",
    "dcat:accessService": "urn:svc:s3:provider-bucket",
    "spcn:adapter": "s3"
  }],
  "spcn:tags": ["weather:daily", "region:DE"],
  "spcn:state": "draft"
}

// Offer
{
  "@context": ["https://www.w3.org/ns/odrl.jsonld", "https://spcn.example/contexts/connector-v1.jsonld"],
  "@type": "ContractOffer",
  "@id": "urn:offer:weather-daily-de@1",
  "spcn:asset": "urn:asset:weather:daily:de:2025",
  "odrl:hasPolicy": {"@id": "urn:policy:research-eu@1.2.0"},
  "spcn:terms": {"currency": "EUR", "price": 0}
}
```

**States**: `draft → published → deprecated`. Published items appear in the **DSP catalog**; deprecated stay visible for existing agreements.

---

## 40) Draft→Publish Workflow & Versioning

- **Immutable versions**: Publishing creates a new immutable version ID (`urn:asset:...:v3`).
    
- **Offers bind versions**: An offer references exact asset/service version + policy hash.
    
- **Breaking change?** Publish `v4`; keep `v3` until all Agreements expire/migrate.
    
- **Bulk ops**: Use selectors to (re)assign policy packs or deprecate a family of offers.
    

---

## 41) End‑to‑End via Admin API (Concrete Calls)

1. **Create asset (dataset)**
    

```http
POST /admin/assets
Content-Type: application/ld+json
{ "@type":"dcat:Dataset", "@id":"urn:asset:weather:daily:de", "spcn:tags":["weather:daily","region:DE"], ... }
```

2. **Create policy**
    

```http
POST /admin/policies
Content-Type: application/ld+json
{ "@id":"urn:policy:research-eu@1.2.0", "@context":["https://www.w3.org/ns/odrl.jsonld"], "permission":[...] }
```

3. **Create offer**
    

```http
POST /admin/offers
{ "@type":"ContractOffer", "spcn:asset":"urn:asset:weather:daily:de:v1", "odrl:hasPolicy":{"@id":"urn:policy:research-eu@1.2.0"} }
```

4. **Publish offer** → appears in DSP catalog
    

```http
POST /admin/offers/urn:offer:weather-daily-de@1/publish
```

5. **Consumer negotiates** via standard **DSP** (`/dsp/negotiations`, `/dsp/agreements`).
    

---

## 42) Where “Contract Offers” Live

- **Authoring**: Provider/Admin API (`/admin/offers`) to compose and version offers.
    
- **Discovery**: DSP **Catalog** endpoint exposes **published** `ContractOffer` resources.
    
- **Negotiation**: DSP **Negotiations** reference those offers by ID; Agreements pin policy hash and versioned asset/service IDs.
    

---

## 43) Authoring Formats — Recommendation

- **APIs**: Always **JSON‑LD**.
    
- **CLI/Files**: YAML or JSON‑LD (team’s choice). We ship converters and SHACL validation either way.
    
- **Docs**: Examples will show both forms for each artifact (asset, service, policy, offer, selector).
    

---

## 44) Acceptance Criteria (Admin Authoring)

- Create **3 assets**, **2 services**, **4 policies** and **5 offers** via Admin API; publish all in ≤ 10 API calls.
    
- Bulk‑assign a policy pack to all `weather:*` offers in < 60s.
    
- Deprecate `weather‑daily‑de@1` without affecting existing Agreements; new negotiations see `@2`.
    

## 45) Standards Crosswalk & Compliance (IDSA RAM 4, Rulebook, Gaia‑X)

### 45.1 IDSA RAM 4 Mapping

- **Business layer**: Roles covered: _Participant, Connector, Broker/Catalog, Vocabulary Provider, App Provider_; we explicitly adopt **Service Provider** alongside _Data Provider/Consumer_ (RAM §3–§3.1). Governance contracts align with usage contracts. ✔ Reference: RAM layers & roles.
    
- **Functional layer**: Components aligned: **Connector** (CP/DP), **App Runtime** (compute‑to‑data), **Catalog/Broker** (DSP Catalog), **Identity Provider/Wallet/Attestation**, **Clearing/Evidence** (our Evidence Bundle). ✔
    
- **Information layer**: **JSON‑LD** baseline; **DCAT‑AP** for datasets, **ODRL** for usage control; IDS Usage Control Object can be represented as our Policy JSON‑LD envelope. ✔
    
- **Process layer**: We follow DSP negotiation/transfer; add **standing agreements** and **tickets** as process specializations. ✔
    
- **System layer**: Hardening, mTLS/DPoP, audit, SBOM/cosign, operator SLOs. ✔
    
- **Perspectives**: Security (policy enforcement + PoP tokens), Certification (TCK + conformance), Governance (Rulebook roles & policy packs). ✔
    

### 45.2 IDSA Rulebook Alignment

- **Roles & Responsibilities**: Dataspace Operator, Participant, Service Providers captured as personas; onboarding uses trust anchors and VC evidence; rules are documented as **Policy Packs** and **Operator Handbook**.
    
- **Governance & Processes**: Draft→Publish lifecycle for assets/offers; **evidence bundle** covers duty receipts & telemetry to act as “clearing/evidence” record; catalog discovery via DSP.
    
- **Legal/Contractual**: **ODRL policy** embedded in ContractOffer; Agreements pin **policy hash**; renewals & revocations modeled.
    

### 45.3 Gaia‑X Compliance & Trust Framework

- **Self‑Description/VCs**: Participants/services expose **Gaia‑X VCs**; we treat these as mandatory claims in the trust store (Standard Compliance) with optional **Label L1–L3** provisioning. Our Admin API publishes SD/VCs and keeps proofs.
    
- **Trust Anchors**: Configurable **Clearing House** or trusted verifiers; we store received conformance VCs and expose to peers.
    
- **Catalog Hooks**: Optional push to **Credential Event Service** to support federated catalogs; we ingest peer SDs for discovery.
    

---

## 46) Assessment of EDC & What We’d Do Differently

### 46.1 What EDC does well that we keep

- **Strict CP/DP separation**, DSP‑first negotiation/transfer and rich **policy model** with ODRL roots. We keep these tenets.
    
- **Federated Catalog** concept and TargetNodeDirectory abstraction. We keep the _idea_, but ship a leaner implementation. (EDC docs & code show FC crawler/cache and TargetNodeDirectory.)
    
- **Streaming & enterprise adapters** (Kafka/HTTP); sample flows show DP controllers and transfer types. We adopt the **adapter pattern**, but flatten the extension surface.
    

### 46.2 Where EDC feels over‑engineered (for our goals)

- **Explosion of SPIs & micro‑modules** across policy, identity, catalog, transfer, vaults, etc., raising cognitive & ops cost.
    
- **Complex state machines** and provisioning/de‑provisioning phases coupled to transfer lifecycle.
    
- **Federated Catalog crawler** as a separate, stateful runtime with eventual consistency guarantees that many apps don’t need by default.
    
- **Multiple launchers/identity hub/issuer services** inside the same codebase leading to “big‑bang” architecture for simple deployments.
    

### 46.3 Our simplifications

- **One small runtime** (CP) + **one DP** by default; all else optional. Extension points only where needed: _transport adapters_, _duty executors_, _verifier bridge_.
    
- **Tickets + standing agreements** to avoid renegotiation for recurring data (simpler than custom state machines).
    
- **Lean Catalog**: default **peer query** + optional **mini‑index**; external federated catalog remains an add‑on.
    
- **Identity**: OID4VP/OID4VCI integration with EUDI/Business wallets as the path, no custom identity hub by default; pluggable if required.
    
- **Authoring**: YAML authoring → **JSON‑LD** over the wire; SHACL everywhere; bulk policy assignment.
    

---

## 47) Concrete Deltas to the PRD (based on EDC code review)

1. **Catalog**: mark the Federated Catalog as an optional component with a _stateless_ crawler and _bounded staleness_; default is on‑demand DSP catalog query. Add SLOs and an _in‑memory index_ option for small spaces.
    
2. **Transfer lifecycle**: keep DSP states only; provisioning/de‑provisioning is delegated to adapters, not the core state machine.
    
3. **Module boundaries**: collapse plugin surface to three interfaces (TransportAdapter, DutyExecutor, Verifier). Remove any requirement for separate SPI packages per concern in our MVP.
    
4. **Streaming**: keep `Kafka`, `MQTT`, `HTTP` adapters, but standardize transfer types (`stream`, `batch`, `service`) and unify controller logic.
    
5. **Ops**: ship a **single Helm chart** and a **single‑binary edge**; no separate launchers by default.
    
6. **Evidence/Clearing**: add an _Evidence Export_ that bundles negotiation → tickets → duty receipts, suitable for Rulebook clearing/audit.
    

---

## 48) Compliance Traceability Additions

- **RAM 4**: Add a table in the appendix linking each RAM layer capability to a PRD section and test.
    
- **Rulebook**: Operator Handbook template + default policies (research‑only, EU‑only) shipped as Policy Packs.
    
- **Gaia‑X**: Admin API to ingest/export **Gaia‑X Conformance VCs**; expose conformance level in catalog entries; webhook to push to **Credential Event Service**.
    

---

## 49) Updated Acceptance Criteria

- **AC‑RAM‑1**: A connector instance can generate a **Self‑Description** and obtain a **Gaia‑X Conformance VC**; the VC is published in the catalog entry.
    
- **AC‑RULEBOOK‑1**: Operator can export an **evidence bundle** that meets Rulebook clearing/audit needs for any Agreement.
    
- **AC‑CAT‑1**: Default catalog query returns peer offers without running a separate crawler. Optional mini‑index can be enabled and is consistent within **T+60s** staleness.
    

---

## 50) References in Code & Docs (why we changed things)

- EDC’s **federated catalog** describes crawler/cache/TargetNodeDirectory and warns of **inconsistent results** during crawl; we avoid shipping this by default and offer a lighter index.
    
- EDC’s **Kafka** sample shows custom DataFlowController, transfer type strings, and per‑flow code; we unify under one adapter abstraction.
    
- Decision record proposes additional `*ING` states and wrapping provisioning; we keep DSP states and push provisioning into adapters.
    
- EDC Helm chart & serverless‑transfer decision show ops complexity; we ship a single chart and make serverless an adapter.
    

---

## 51) What stays unchanged (core principles)

- **DSP‑first**, **ODRL usage control**, **JSON‑LD semantics**, **VC‑based trust**, **CP/DP split**, **standing agreements & tickets**, **apps as first‑class services**.
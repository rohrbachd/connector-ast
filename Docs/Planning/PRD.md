# Lightweight Dataspace Connector — Product Requirements (Reorganized vNext)

> **How to use this document**
> Each major section starts with a short **Primer** (why it matters), followed by crisp **Requirements** and, when needed, **Design Notes**. Deep detail (personas, extended examples) moved to appendices to keep the core readable without losing substance.

---

## 1. Executive Summary

**Goal.** Build a lightweight, standards‑first connector to participate in IDSA/Gaia‑X‑aligned dataspaces with minimal footprint and maximum developer ergonomics. The connector interoperates via the **Dataspace Protocol (DSP)**, uses **verifiable credentials (VCs)** for trust, treats **applications/services as first‑class assets**, and keeps a strict **control‑ vs data‑plane** split. Cloud/edge/on‑prem friendly; extensible across industries.

**Non‑goals.** We do **not** replace DSP, the EUDI Wallet, or Gaia‑X Federation Services (GXFS/XFSC); we don't invent new crypto; we don't bake in sector semantics.

**Core principles.**

- **Simplicity over ceremony.** Fewer moving parts, clear interfaces, reference defaults.
- **Interoperability first.** Conform to DSP; align with Gaia‑X Trust Framework and DSBA Blueprint; use W3C VC 2.0 + OID4VP/OID4VCI; build ODRL policies for contracts.
- **Decentralized by default.** No mandatory central broker; federated catalogs and peer‑to‑peer capability.
- **Apps and Services are first‑class.** Besides "data provider," model "**service provider**" (application/API/compute‑to‑data) with the same lifecycle as datasets.
- **Semantic by design.** JSON‑LD/RDF for metadata; SHACL for shapes; optional NGSI‑LD profile.
- **Security & sovereignty.** End‑to‑end authZ via policies, privacy‑preserving VC flows, auditability/observability.

---

## 2. Roles & Interop Baseline

**Primer.** Clear roles + shared standards reduce ambiguity and speed interop.

- **Participant**: Legal entity in a dataspace.
- **Connector**: This product. Implements DSP control plane, data plane adapters, policy engine, and wallet/verifier integration.
- **Data Provider**: Exposes datasets or streams.
- **Service Provider (first‑class)**: Exposes services/applications/APIs (e.g., analytics, simulation, ML‑as‑a‑service) under usage policies.
- **Data Consumer / Service Consumer**: Counterpart that negotiates agreements and consumes data/services.
- **Federation Services** (optional): Identity/Trust, Federated Catalog, Compliance (GXFS/XFSC).
- **Wallet**: EUDI‑conformant (or equivalent) holding VCs for participants, roles, and attributes.

**Standards Baseline.**

- **Interoperability**: Conformant **Dataspace Protocol** endpoints, state machines, and payloads.
- **Trust & Identity**: **W3C VC 2.0**, **OID4VP/OID4VCI**; DID support (did:web minimum; pluggable others). Support SD‑JWT VC and ISO mDL/mdoc via profile.
- **Gaia‑X**: Publish/consume **Gaia‑X credentials** for offerings; optional label-readiness (L1→L3).
- **Contracts**: **ODRL** policy model and profile for usage control; map to DSP negotiation and agreement objects.
- **Semantics**: JSON‑LD contexts; optional **DCAT‑AP** for datasets; **NGSI‑LD** profile for context data; **SHACL** shapes for validation.
- **Observability**: Contract/activity state observability as per IDSA guidance; optional clearing/billing hooks.

## 3) High‑Level Architecture

### 3.1 Control Plane (CP)

- **CP‑Gateway (HTTP/REST)**: Exposes DSP endpoints: Catalog, Contract Negotiation, Agreement, Transfer initiation, Participant metadata.
- **Identity & Trust Adapter**: Integrates with OID4VP/OID4VCI, verifies VPs from wallets, and manages trust anchors (Gaia‑X, sector schemes). DID resolution (did:web default).
- **Policy Service**: ODRL parsing/validation; conflict resolution; policy decision point (PDP) issuing permit/deny/obligations; transformation to runtime guards.
- **Catalog Service**: Semantic catalog for datasets **and** services. Supports DCAT‑AP/NGSI‑LD/JSON‑LD; full‑text + SPARQL (optional); profile‑aware discovery.
- **Agreement Service**: DSP state machine for proposals/counter‑offers/agreements; persists signed offers; binds VCs and obligations.
- **Observability Bus**: Emits contract/transfer telemetry (OpenTelemetry events + JSON‑LD activity records) to internal store and optional external observers.

### 3.2 Data Plane (DP)

- **DP‑Gateway**: Executes agreed transfers/invocations. Enforces PDP decisions and obligations (rate/time/geo/purpose/count).
- **Adapters**:
  - **Pull/Push data**: HTTP(S), S3/Blob/MinIO, WebDAV, NFS, MQTT, Kafka.
  - **Compute‑to‑Data / Service calls**: HTTP APIs (OpenAPI), AsyncAPI (MQTT/Kafka), OPC‑UA (optional), gRPC (optional).
  - **Streaming**: WebSub/MQTT/Kafka with token‑bound access.
- **Guards/Proxies**: Inline enforcement for ODRL duties (e.g., deletion after T, notify webhook, watermark, geo‑fencing via IP/claims, count‑limited tokens).

### 3.3 Persistence

- **Metadata store**: Document DB or triplestore (RDF/JSON‑LD).
- **Agreements & Logs**: Append‑only store with hash‑chain receipts; exportable to external notaries.

### 3.4 Deployment

- **Footprints**:
  1. **Edge/On‑prem single‑node**: CP+DP in one process; in‑memory or embedded DB.
  2. **Standard**: CP and DP pods; stateless CP; DP near data.
  3. **Scale‑out**: Separate adapters and PDP; horizontal autoscaling; multi‑zone.

---

## 4. Functional Requirements (by domain)

**Primer.** Grouped by concern to avoid repetition and ease implementation planning.

### 4.1 DSP Control Plane

- **F1.1** Catalog for dataset **and service** offers; semantic filters; pagination.
- **F1.2** Contract negotiation: proposal → counter‑offer → agreement; idempotent; resumable.
- **F1.3** Transfer creation for **data** or **service invocation**; observable states.
- **F1.4** Self‑descriptions; publish Gaia‑X credentials when configured.

### 4.2 Trust & Identity (Wallet‑centric)

- **F2.1** Verify VPs via OID4VP (SD‑JWT VC + JSON‑LD VC); did\:web baseline.
- **F2.2** Role/attribute VCs (Data Provider, Service Provider, sector roles); cache & revocation.
- **F2.3** Bind presented attributes/roles into PDP context for authorization.

### 4.3 Contracting & Policy (ODRL)

- **F3.1** Offers/Agreements as ODRL with permissions/prohibitions/duties.
- **F3.2** Common constraints: purpose, time window, count, geo, retention, sublicensing, must‑delete/notify.
- **F3.3** Conflict detection + counter‑offer suggestions.
- **F3.4** Execute obligations in DP (notify, delete with receipt, watermark, logging).
- **F3.5** Policies assignable **by reference** (URI); composable and parameterized; agreements pin **policy hash**.
- **F3.6** **Output policy:** service provider may attach policy to **result assets**; consumer accepts or counters unless covered by a dual‑direction agreement.
- **F3.7** **Agreement linking:** `reciprocalOf` IRI; evidence bundles capture both sides.

### 4.4 Catalog & Semantics

- **F4.1** JSON‑LD metadata; DCAT‑AP (datasets); NGSI‑LD optional.
- **F4.2** SHACL validation for offers/payload metadata; fail fast.
- **F4.3** Content negotiation by profile in DP (where applicable).

### 4.5 Transfers, Services & Bidirectional Exchange

- **F5.1** Modes: `pull | push | stream | service`.
- **F5.2** **Provider‑initiated results:** provider may initiate return flows (push/stream/callback) under the governing agreement.
- **F5.3** **Return‑asset identity:** results are cataloged assets/operations with their own IDs and policies.
- **F5.4** **Standing Agreements:** durable contracts bound to **Selectors** (by IDs, tags/semantics, query, temporal coverage) authorizing multiple transfers without renegotiation.
- **F5.5** **Tickets API:** short‑lived, PoP‑bound tokens derived from `{agreementId, selector, obligations}`.
- **F5.6** **Subscriptions API:** periodic pull/push/stream with watermarks; HA scheduler.
- **F5.7** Usage/quota counters: `GET /dsp/usage/{agreementId}`; exposed in evidence bundles.

- **F5.8** Services as First‑Class Citizens\*\*

- **F5.9** Service Offers include service descriptors (OpenAPI/AsyncAPI URLs), SLAs, pricing models (optional), and ODRL.
- **F5.10** Invocation tokens are generated by CP, bound to Agreement ID + constraints; DP proxy enforces obligations.
- **F5.11** Compute‑to‑Data: optional job runner invokes provider‑side functions with result‑sharing under policy.

**F5.11 Semantics**

- **F5.12** JSON‑LD metadata; DCAT‑AP profile for datasets; NGSI‑LD profile for live context.
- **F5.13** **SHACL** validation for offers and payload metadata; reject offers that don't match shapes.
- **F5.14** Content negotiation by profile (Accept‑Profile) for DP where applicable.

### 4.6 Observability & Audit

- **F6.1** Emit DSP state telemetry to internal bus; sinks configurable.
- **F6.2** Export contract‑bound activity records (billing/clearing/notary).
- **F6.3** Privacy controls: redaction; aggregated counters; policy‑governed observer access.

### 4.7 Compatibility & Interop

- **F7.1** Pass DSP TCK; interop with EDC/Tractus‑X, TNO TSG, FIWARE.
- **F7.2** Gaia‑X: publish/consume credentials; optional label evidence.

---

## 5. Non‑Functional Requirements (NFRs)

**Primer.** Keep targets explicit for sizing and trade‑offs.

- **Security:** TLS1.3; optional mTLS; JOSE/COSE validation; secure key storage (HSM/TPM optional).
- **Performance:** CP <150ms median negotiation ops; DP ≥2 Gbps batch; streaming latency <200ms (local).
- **Footprint:** Edge image <200MB; baseline RAM <300MB; single‑binary option.
- **Reliability:** CP stateless; retries/idempotency; DP back‑pressure; at‑least‑once streams; health/ready.
- **Observability:** OpenTelemetry traces/metrics/logs; activity ledger export.
- **Privacy:** Minimal logs; PII scrubbing; sealed secrets.
- **Compliance:** GDPR roles; DPA templates; ROPA hooks.

---

## 6. API Surface (Consolidated)

**Primer.** One place to find the external surface: DSP + Admin + Extensions.

**DSP**

```
POST /dsp/negotiations
GET  /dsp/negotiations/{id}
POST /dsp/agreements
POST /dsp/transfers
GET  /dsp/catalog
```

**Extensions (Realtime & Links)**

```
POST /dsp/subscriptions
GET  /dsp/subscriptions/{id}
DELETE /dsp/subscriptions/{id}
POST /dsp/tickets
GET  /dsp/usage/{agreementId}
GET  /dsp/agreements/{id}/links   # { reciprocalOf?: string[], governsAssets: string[] }
```

**Admin/Provider**

```
POST /admin/assets | /admin/services
GET  /admin/assets|services
PATCH/POST /admin/assets/{id}/publish|deprecate
POST /admin/policies
POST /admin/policies/{id}/assign
POST /admin/selectors
POST /admin/offers ; POST /admin/offers/{id}/publish
POST /admin/trust-anchors ; POST /admin/policy-packs
POST /admin/keys/rotate
GET  /admin/evidence/{agreementId}
```

**Notes.** JSON‑LD everywhere on DSP; Admin is private/mTLS. Tickets are PoP‑bound (DPoP or mTLS).

---

## 7. Extension Model & SDK

**Primer.** Keep the core tiny; push variability to plugins.

**Interfaces.**

```ts
export type TransferMode = 'pull' | 'push' | 'stream' | 'service';
export interface ConstraintKV {
  key: string;
  op: string;
  value: unknown;
}

export interface EnforcementContext {
  agreementId: string;
  policyHash: string;
  subjectDid: string;
  purpose?: string;
  constraints: ConstraintKV[];
  token: string;
  now: Date;
  watermark?: string;
  counters?: Record<string, number>;
  audit: (e: object) => void;
}

export interface TransferPlanRequest {
  mode: TransferMode;
  assetId?: string;
  service?: { id: string; operation?: string; inputSchemaRef?: string };
  constraints: ConstraintKV[];
}

export interface TransferPlan {
  transportAdapterId: string;
  steps: Array<{ kind: 'httpGet' | 'httpPost' | 's3' | 'mqtt' | 'kafka' | 'grpc'; cfg: any }>;
  obligations: string[];
}

export interface TransportAdapter {
  readonly id: string;
  init(cfg: unknown): Promise<void>;
  plan(req: TransferPlanRequest): Promise<TransferPlan>;
  execute(
    plan: TransferPlan,
    ctx: EnforcementContext,
  ): Promise<{ status: 'ok' | 'error'; receipt?: object }>;
  stop(): Promise<void>;
}

export interface DutyExecutor {
  /* odrl:delete|notify|watermark… */
}
export interface Verifier {
  /* OID4VP */
}
```

**Design Notes.** Adapters are I/O only; duty enforcement happens inline where required. DI namespaces: `spcn.transportAdapters`, `spcn.duties`, `spcn.verifiers`.

- **Adapters**: `TransportAdapter` interface (init, plan, execute, stop); config via JSON; hot‑pluggable.
- **Duties**: `DutyExecutor` interface (supports ODRL duty URI, validate, enforce, prove).
- **Identity Providers**: `Verifier`/`Issuer` interfaces for EUDI, enterprise IdPs, did:ebsi, etc.
- **Semantics**: Register JSON‑LD contexts; SHACL shape packs per industry.

---

## 8. Authoring & Lifecycle (Assets ▸ Policies ▸ Offers)

**Primer.** Author in YAML if you like; APIs speak JSON‑LD. Strong shapes prevent drift.

**Workflow.** `draft → publish → deprecated`. Publishing creates immutable versions; offers bind exact asset/service versions + pinned policy hash. Bulk ops via **Selectors**.

**Examples.** (abridged)

**Service Offer (YAML authoring)**

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

**Policy Pack (JSON‑LD)**

```json
{
  "@context": ["https://www.w3.org/ns/odrl.jsonld"],
  "@id": "urn:policy:research-eu@1.2.0",
  "permission": [
    {
      "action": "use",
      "constraint": [
        { "leftOperand": "purpose", "operator": "isAnyOf", "rightOperand": ["research"] },
        { "leftOperand": "spatial", "operator": "isAnyOf", "rightOperand": ["EU"] }
      ]
    }
  ],
  "duty": [{ "action": "notify" }]
}
```

---

## 9. Operationalization (Deploy, Configure, Observe)

**Primer.** Same artifact in edge, K8s, on‑prem; minimal config; strong telemetry.

- **Modes:** single‑binary; docker‑compose; Helm chart; air‑gapped guide.
- **Config:** single `config.yaml` with profiles (edge|standard|scale‑out).
- **Monitoring:** OTLP exporters; Prometheus scrape; healthz/readyz; correlation IDs.
- **Backups/Upgrades:** Snapshot metadata/agreements; key escrow; CP blue/green; DP rolling.

---

## 10. Roadmap & Acceptance

**MVP (≤12 weeks)**
DSP CP endpoints; VC/OID4VP verification (did\:web, SD‑JWT); ODRL + PDP with common constraints/duties; DP adapters (HTTP, S3, MQTT); Catalog (JSON‑LD + DCAT‑AP) + SHACL; OpenTelemetry + activity log; Helm + single‑binary.

**R2**
AsyncAPI/gRPC; Kafka streams; compute‑to‑data job runner; Gaia‑X credential publication; TCK badge + IDSA AL1 evidence kit; watermarker/anonymizer duties.

**R3**
NGSI‑LD profile; triplestore + SPARQL; advanced obligations (geo‑fence, retention re‑checks); optional TEE; Gaia‑X label evidence; IDSA AL2 prep.

**Acceptance (MVP).**

- Pass DSP TCK; interop demo with **EDC** and **TNO TSG**.
- Verify two VC formats via OID4VP.
- Publish/consume **service** offers; enforce ≥4 duties.
- Run on **edge, K8s, on‑prem** with the same artifacts.
- Telemetry & activity export; privacy redaction toggles.

**KPIs.** Config ≤60 lines (edge, 2 adapters) • TTFS ≤30m; TTFD ≤19m • Image <200MB • CP blue/green <5m.

---

## 11. Compliance & Certification

**Primer.** Traceability from requirement → test → evidence.

- **DSP:** Conformance in CI; badge publication.
- **IDSA:** Map features to RAM/Rulebook; evidence bundle templates; target AL1 → AL2.
- **Gaia‑X:** Publish/consume SD/VCs; expose conformance level in catalog; optional Credential Event Service hooks.

---

## 12. Security & Threats (Abbrev.)

**Threats.** Token theft; replay; policy bypass; catalog poisoning; duty evasion; adapter exploits.
**Controls.** Short‑lived, audience‑bound, agreement‑bound tokens; DPoP/mTLS; strict schema/contexts; SBOM + cosign; duty receipts with hash‑chain; adapter sandboxing.
**Key management**: JWK sets; rotate via JWKS endpoint; HSM/TPM optional.

- **Transport**: TLS1.3; mTLS optional for private peering.
- **Tokens**: VP/VC verified at CP; DP enforces **token‑bound** context (Agreement ID, constraints, expiry).
- **Hardening**:
  - Minimal attack surface; strict CORS; input schemas; rate limiting; WAF‑ready.
  - Secrets in sealed stores; no long‑lived bearer tokens.
- **Supply chain**: SBOM; image signing (cosign); vulnerability scanning.

---

## 13. Interop Profiles & Migration

- **EDC/Tractus‑X:** DSP interop; HTTP pull/push; map ODRL profile; `migration edc` converts assets/offers.
- **TNO TSG:** Wallet‑first interop; OID4VP compatible; Gaia‑X credentials.
- **FIWARE:** NGSI‑LD profile switch for context broker mapping.

---

## 14. End‑to‑End Flows (Concise)

**Service Provider — Offer & Invoke**

1. Bootstrap keys & verifier → 2) Publish `ServiceOffer` (SHACL‑validated) → 3) Consumer negotiates → 4) `POST /dsp/transfers {type:"service-invoke"}` returns invocation token → 5) DP proxy enforces duties → 6) Return results via dual‑direction or reciprocal agreement ticket.

**Data Provider — Dataset & Stream**
Publish DCAT‑AP + ODRL; upon agreement, CP mints token‑bound URL; DP enforces constraints; receipts emitted.

**Consumer — Discover → Agree → Use**
Find via catalog; negotiate; use signed URL/stream token or invocation token; if results returned, tickets minted under governing agreement.

---

## 15) Data & Service Onboarding Flows

1. **Bootstrap**: Generate keys; register trust anchors; configure wallet/verifier endpoints.
2. **Publish**: Create dataset/service offer (JSON‑LD + ODRL); run SHACL; publish to catalog.
3. **Discover**: Other participants query catalog by semantics and capabilities.
4. **Negotiate**: Exchange ODRL offers/counter‑offers → Agreement. Sign & store.
5. **Transfer/Invoke**: DP executes with guardrails; duty proofs emitted.
6. **Observe**: Contract telemetry exported to observers/clearing.
7.

## 16) Documentation Deliverables (Expanded)

- Persona‑based quickstarts (P1/P2/P3/P4/P5).
- Admin Guide: trust anchors, policy packs, evidence export.
- Developer Guide: adapters, duty executors, policy recipes.
- Ops Guide: K8s/edge playbooks, backups, upgrades, troubleshooting.

## 17) Real‑Time & Standing Agreements (Subscriptions, Multi‑Asset, Token Refresh)

### 17.1 Agreement Types

- **One‑shot Agreement**: Single transfer/invocation; default.
- **Standing Agreement** _(new)_: A durable contract bound to a **Selector** that may authorize **many transfers** over time without renegotiation until expiry or revocation.
  - **Selector** (any of):
    - **By IDs**: explicit asset/service IDs.
    - **By Tags/Semantics**: JSON‑LD terms, SKOS concepts (e.g., `weather:daily`, `region:DE`).
    - **By Query**: SPARQL/JSONPath/NGSI‑LD filters (e.g., `observedProperty=temperature AND date=today`).
    - **By Temporal Coverage**: new assets whose `dct:temporal` overlaps the agreed window are **auto‑covered**.
  - **Policy Hash Freeze**: Agreement records the policy hash; policy _updates_ create a new version and optional **renewal proposal**.

### 17.2 Transfer Modes under a Standing Agreement

- **Batch (Periodic Pull)**: Connector issues short‑lived **tickets** to retrieve available assets since the last watermark.
- **Push/Notify**: Provider CP posts **New‑Asset Notifications** (webhook) when Selector matches newly published assets.
- **Streaming**: MQTT/Kafka under the same Agreement; topic binding recorded in the Agreement.
- **Request/Response Service Invocations**: Invocation tickets minted per call; usage/quota metered against Agreement.

### 17.3 Tickets, Watermarks & Usage

- **Ticket**: A signed, short‑lived token (DPoP or mTLS‑bound) for a single transfer or invocation derived from `{agreementId, selector, obligations}`.
- **Watermark**: Per Agreement, the DP maintains a **cursor** (e.g., last `temporal.end`, last object ID). Consumers can pass `since` to page incrementally.
- **Quota & Counters**: ODRL `count`, `time`, `purpose` constraints enforced; `GET /dsp/usage/{agreementId}` exposes live counters.

### 17.4 Subscriptions API

- **Create**: `POST /dsp/subscriptions` `{ agreementId, selectorRef, mode: periodic|push|stream, schedule?: RRULE, since?, until? }`
- **Manage**: `GET /dsp/subscriptions/{id}` state; `DELETE` to cancel; events emitted on execution/failure.
- **Tickets**: `POST /dsp/tickets` `{ agreementId, assetId? | since?, mode }` → `{ ticket, expiry }`.

### 17.5 Renewal & Revocation

- **Auto‑Renewal Proposal**: When nearing expiry or hitting quota, CP can issue a **counter‑offer** to extend or adjust constraints.
- **Emergency Stop**: Revocation immediately invalidates tickets; DP rejects with `revoked` code; duty `notify` informs counterpart.

### 17.6 Acceptance Criteria (Real‑Time)

- Create a standing agreement for **daily weather data** covering `region=DE` with 365‑day validity.
  - Retrieve today's asset with **no renegotiation**: **(1)** `POST /dsp/tickets` → **(2)** `GET <signed URL>`.
  - Schedule periodic pulls at 05:00 CET via `POST /dsp/subscriptions` with `RRULE:FREQ=DAILY;BYHOUR=5;BYMINUTE=0`.
- For **PV production forecasting** (non‑streaming batches hourly): watermarked pulls every hour with duty receipts; late/missed runs are caught up using `since`.

---

## 18) Policy Catalog, Composition & Assignment

### 18.1 Policy Objects

- **Named Policies**: First‑class objects with semantic metadata and **semver** (`policy:research‑eu@1.2.0`).
- **Composition**: Policies are **composable**: `base + purpose‑pack + duty‑pack + geo‑pack`. Deterministic merge with precedence `offer‑local > assigned pack > base`.
- **Parameters**: Policy templates with variables (e.g., `$retentionDays`, `$regions`).

### 18.2 Assign by Reference

- Offers reference policies by **URI** (`odrl:hasPolicy → urn:policy:research‑eu@1.2.0`). Existing Agreements keep the **policy hash**.
- **Bulk Assignment**: Assign a policy to all assets matching a selector (tags, provider namespace, service kind) with one command.

### 18.3 Versioning & Rollout

- **Immutable Agreements**: Existing agreements pinned to the **old policy hash** remain valid.
- **Staged Rollout**: `canary=10%` of new negotiations use the new policy; rollback supported.

### 18.4 APIs & CLI

- `POST /admin/policies` (create), `GET /admin/policies`, `POST /admin/policies/{id}/assign` (bulk), `POST /admin/policy‑packs` (bundle).
- `spctl policy create|compose|assign|preview` with **what‑if** diff and SHACL validation.

### 18.5 Acceptance Criteria (Policies)

- Create three reusable policies: _Research‑EU‑18d_, _Commercial‑Global‑NoRedistribution_, _Telemetry‑Pseudonymized_.
- Assign different mixes to **10 datasets** and **3 services** in < **2 minutes** via bulk assignment.
- Rolling replace _Research‑EU‑30d v1.2.0 → v1.3.0_ with zero downtime; existing Agreements untouched.

---

## 19) Standards Crosswalk & Compliance (IDSA RAM 4, Rulebook, Gaia‑X)

### 19.1 IDSA RAM 4 Mapping

- **Business layer**: Roles covered: _Participant, Connector, Broker/Catalog, Vocabulary Provider, App Provider_; we explicitly adopt **Service Provider** alongside _Data Provider/Consumer_ (RAM §3–§3.1). Governance contracts align with usage contracts. ✔ Reference: RAM layers & roles.
- **Functional layer**: Components aligned: **Connector** (CP/DP), **App Runtime** (compute‑to‑data), **Catalog/Broker** (DSP Catalog), **Identity Provider/Wallet/Attestation**, **Clearing/Evidence** (our Evidence Bundle). ✔
- **Information layer**: **JSON‑LD** baseline; **DCAT‑AP** for datasets, **ODRL** for usage control; IDS Usage Control Object can be represented as our Policy JSON‑LD envelope. ✔
- **Process layer**: We follow DSP negotiation/transfer; add **standing agreements** and **tickets** as process specializations. ✔
- **System layer**: Hardening, mTLS/DPoP, audit, SBOM/cosign, operator SLOs. ✔
- **Perspectives**: Security (policy enforcement + PoP tokens), Certification (TCK + conformance), Governance (Rulebook roles & policy packs). ✔

### 19.2 IDSA Rulebook Alignment

- **Roles & Responsibilities**: Dataspace Operator, Participant, Service Providers captured as personas; onboarding uses trust anchors and VC evidence; rules are documented as **Policy Packs** and **Operator Handbook**.
- **Governance & Processes**: Draft→Publish lifecycle for assets/offers; **evidence bundle** covers duty receipts & telemetry to act as "clearing/evidence" record; catalog discovery via DSP.
- **Legal/Contractual**: **ODRL policy** embedded in ContractOffer; Agreements pin **policy hash**; renewals & revocations modeled.

### 19.3 Gaia‑X Compliance & Trust Framework

- **Self‑Description/VCs**: Participants/services expose **Gaia‑X VCs**; we treat these as mandatory claims in the trust store (Standard Compliance) with optional **Label L1–L3** provisioning. Our Admin API publishes SD/VCs and keeps proofs.
- **Trust Anchors**: Configurable **Clearing House** or trusted verifiers; we store received conformance VCs and expose to peers.
- **Catalog Hooks**: Optional push to **Credential Event Service** to support federated catalogs; we ingest peer SDs for discovery.

---

# Appendices

## A. Personas & User Stories (Full)

### Personas

P1 Service/App Developer • P2 Data Product Owner • P3 Consumer • P4 Dataspace Operator • P5 Platform/Edge Operator • P6 Security & Compliance • P7 Enterprise IAM Admin.

### Representative User Stories & Acceptance

- **P1‑1** Publish HTTP API

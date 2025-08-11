# Implementation Plan for connector-ast (Node/TypeScript)

> This document preserves the structure and intent of the original Implementation plan while expanding it with **Node.js + TypeScript** specifics, fine‑grained tasks, and the additional capabilities agreed in the PRD: **standing agreements, subscriptions & tickets**, **bidirectional exchange (Agreement Sets)**, **Admin/Provider API**, and **evidence bundles**.

---

## 1. Feature Analysis

### Must‑Have
- [ ] DSP Control Plane (catalog, negotiations, agreements, transfers)
- [ ] Trust & Identity (OID4VP/OID4VCI; W3C VC 2.0; did:web)
- [ ] ODRL‑based contracts (constraints + duties → PDP + executors)
- [ ] Data Plane Gateway (HTTP, S3/Blob, MQTT) with inline enforcement
- [ ] Semantic metadata + SHACL (JSON‑LD/DCAT‑AP; NGSI‑LD optional)
- [ ] Observability & audit (OpenTelemetry + JSON‑LD activity log)
- [ ] Persistence (agreements/logs; metadata store)
- [ ] Deployment footprints (edge/single‑binary, K8s)

### Should‑Have
- [ ] Services as first‑class assets (OpenAPI/AsyncAPI + invocation tokens)
- [ ] Interop & Compliance (DSP TCK, Gaia‑X credentials)
- [ ] Guards/Proxies (delete/notify/watermark/geo/rate/count)
- [ ] Extra adapters (Kafka, WebDAV, NFS)

### Nice‑to‑Have
- [ ] Compute‑to‑data hooks (sandbox)
- [ ] NGSI‑LD profile & triplestore backend
- [ ] Advanced watermarking/anonymization

### New (from PRD alignment)
- [ ] Standing agreements + subscriptions + tickets (real‑time, no renegotiation)
- [ ] Bidirectional exchange (Agreement Sets: inbound contribution + outbound return)
- [ ] Admin/Provider API (assets, services, policies, selectors, offers; draft→publish; bulk policy assignment)
- [ ] Evidence bundle export (policy hashes, duty receipts, watermarks, usage counters)

---

## 2. Recommended Tech Stack (Node/TS)

- [ ] **Runtime**: Node.js 20 LTS, TypeScript 5.x, pnpm
- [ ] **Web**: Fastify + zod; OpenAPI (swagger) for CP Admin endpoints
- [ ] **Auth/VC**: `openid-client`, `jose`, `did-jwt`, `sd-jwt-vc` (or equivalent)
- [ ] **JSON‑LD/Semantics**: `jsonld`, `rdf-ext`, `n3`, `rdf-validate-shacl`; **quadstore** (LevelDB) for dev; optional **Apache Jena/Fuseki** backend
- [ ] **Storage**: PostgreSQL (agreements, counters, evidence), SQLite for edge; S3‑compatible for file blobs
- [ ] **Messaging (optional)**: Kafka, MQTT (Mosquitto/Aedes)
- [ ] **Observability**: OpenTelemetry SDK + OTLP exporter
- [ ] **Packaging**: Docker (distroless), Helm chart; single‑binary via `pkg` (optional)

---

## 3. Repository & Packages

Monorepo using **pnpm workspaces**:

```
/connector-ast
├─ packages/
│  ├─ cp-gateway           # DSP endpoints + Admin API
│  ├─ dp-gateway           # Data plane + enforcement
│  ├─ identity-bridge      # OID4VP/OID4VCI, VC verification
│  ├─ policy-pdp           # ODRL parse/validate/evaluate
│  ├─ catalog              # JSON-LD/DCAT store + SHACL
│  ├─ agreements           # Negotiation FSM + Agreement Sets
│  ├─ adapters/http        # HTTP(S) adapter
│  ├─ adapters/s3          # S3/Blob adapter
│  ├─ adapters/mqtt        # MQTT adapter
│  ├─ duties/core          # notify, delete, count, rate, retention
│  ├─ duties/watermark     # optional watermark executor
│  ├─ subscriptions        # scheduler + tickets + watermarks + usage
│  ├─ evidence             # activity log + hash-chain + bundle export
│  ├─ cli-spctl            # CLI (YAML↔JSON-LD, admin ops)
│  └─ ui                   # React admin
├─ infra/helm              # Helm chart(s)
├─ scripts                 # tooling
└─ docs                    # design/spec assets
```

Checklist:
- [ ] Initialize pnpm workspaces & base configs
- [ ] Create package skeletons above

---

## 4. Implementation Stages

> Follow these stages sequentially. Each stage lists **tasks** with checkboxes and a **Definition of Done (DoD)**.

### Stage 0 — Monorepo, CI & Local DX (≈ 1 week)
- [ ] Initialize repo, pnpm workspaces, tsconfig, eslint/prettier, commitlint
- [ ] CI: build, typecheck, lint, unit tests, Docker multi‑arch images
- [ ] Security: npm audit/osv, secret scanning, SBOM (Syft) artifact
- [ ] Dev stack: docker‑compose (Postgres, MinIO, Mosquitto), `.env` templates
- [ ] Observability baseline (OTel env wiring)
- [ ] Docs: CONTRIBUTING, coding standards, API versioning policy
**DoD:**
- [ ] CI green, local `docker compose up` starts dependencies
- [ ] Images build for cp/dp

### Stage 1 — Control Plane MVP (≈ 2–3 weeks)
**CP‑Gateway**
- [ ] Fastify app + JSON‑LD content negotiation middleware
- [ ] DSP endpoints: `/dsp/catalog`, `/dsp/negotiations`, `/dsp/agreements`, `/dsp/transfers`
- [ ] Error model + idempotency keys

**Catalog Service**
- [ ] JSON‑LD expand/compact utils
- [ ] DCAT‑AP & ServiceOffer contexts
- [ ] SHACL validators (dataset, service‑offer)
- [ ] Semantic filters (tags, purpose, region)

**Negotiation & Agreements**
- [ ] DSP FSM + persistence (PG)
- [ ] Pin policy hash in agreements
- [ ] Counter‑offer suggestions (tighten constraints)

**Identity & Trust**
- [ ] OID4VP/OID4VCI verifier (`openid-client`)
- [ ] did:web resolution + trust store
- [ ] Role → authZ context mapping
- [ ] JWKS endpoint for DP verification

**Admin/Provider API**
- [ ] CRUD: assets, services, policies, selectors, offers (draft→publish)
- [ ] Bulk policy assignment by selector
- [ ] Versioning rules & deprecations

**Telemetry**
- [ ] OTel traces/logs + correlation IDs

**DoD:**
- [ ] Create asset → policy → offer via Admin API
- [ ] Publish offer to catalog; run negotiation to agreement
- [ ] Identity verification (OID4VP) succeeds

### Stage 2 — Data Plane MVP (≈ 2–3 weeks)
**DP‑Gateway**
- [ ] Token verification (DPoP/mTLS-bound) + agreement context assembly
- [ ] EnforcementContext builder (agreementId, policyHash, purpose, counters)

**Adapters**
- [ ] HTTP(S) pull/push
- [ ] S3/Blob pull/push (MinIO for dev)
- [ ] MQTT stream (subscribe/publish)

**Duties (Core)**
- [ ] `notify` (webhook)
- [ ] `delete` (retention + signed receipt)
- [ ] `count` (quota enforcement)
- [ ] `rate` (leaky bucket)

**Activity Log**
- [ ] JSON‑LD activity events
- [ ] Hash‑chain receipts (append‑only in PG)

**DoD:**
- [ ] Transfer executes; duties produce receipts; counters update
- [ ] Activity log stores verifiable receipts

### Stage 3 — Policy Engine & Semantics (≈ 2 weeks)
**ODRL + PDP**
- [ ] Parse ODRL permissions/prohibitions/duties
- [ ] Constraint evaluators: purpose, spatial, temporal, count
- [ ] Conflict detection + human‑readable explain

**SHACL Packs**
- [ ] Dataset (DCAT‑AP), ServiceOffer, Agreement shapes

**CLI Tooling**
- [ ] `spctl policy create|compose|assign|preview` (YAML↔JSON‑LD)
- [ ] “What‑if” diff; SHACL validation

**DoD:**
- [ ] Policies validate against shapes; PDP decisions & duty routing work

### Stage 4 — Real‑Time (Standing Agreements, Subscriptions & Tickets) (≈ 2 weeks)
**Selectors & Standing Agreements**
- [ ] Selector types: ids/tags/query/temporal
- [ ] Agreements pin policy hash

**Tickets API**
- [ ] Short‑lived signed tickets with `{agreementId, selector?, claims}`

**Subscriptions Service**
- [ ] Modes: periodic RRULE, push/webhook, stream binding
- [ ] HA scheduler (advisory locks/Redis)
- [ ] Watermark cursors per agreement

**Usage & Quotas**
- [ ] `/dsp/usage/{agreementId}` endpoint; persisted counters

**DoD:**
- [ ] Daily weather standing agreement: **ticket → fetch** (≤ 2 calls)
- [ ] Missed runs catch up via `since` watermark

### Stage 5 — Bidirectional Exchange (Agreement Sets) (≈ 2 weeks)
**Agreement Sets**
- [ ] Model `{groupId, inboundAgreementId, outboundAgreementId}`
- [ ] Tokens carry `dir: inbound|outbound`

**Auto Return‑Negotiation**
- [ ] Bootstrap outbound (return) offer from provider template during service negotiation

**Direction‑aware Pipelines**
- [ ] Inbound guards: size limits, optional AV hook, retention
- [ ] Outbound guards: watermark/anonymize, redistribution checks

**Evidence Bundle**
- [ ] Export includes per‑direction receipts, counters, watermarks

**DoD:**
- [ ] Push input (inbound ticket) → compute → push back results (outbound ticket) without renegotiation
- [ ] Evidence shows both directions

### Stage 6 — Interop & Compliance (≈ 1–2 weeks)
- [ ] DSP TCK harness in CI; golden payloads
- [ ] Gaia‑X VC ingest/publish + SD in catalog
- [ ] GDPR: ROPA hooks, DPA templates, log redaction

**DoD:**
- [ ] TCK core passes; Gaia‑X VC attached; evidence meets Rulebook audit

### Stage 7 — UI & CLI (parallel, ≈ 2–3 weeks)
**UI**
- [ ] Authoring: Asset/Service YAML editor with JSON‑LD preview + SHACL validation
- [ ] Compose & publish Offers
- [ ] Policies/Packs management + bulk assignment
- [ ] Subscriptions (RRULE, last watermark)
- [ ] Agreement Sets view (inbound/outbound)
- [ ] Usage counters; Evidence download
- [ ] Trust anchors & Gaia‑X credentials status

**CLI**
- [ ] `spctl init|publish (asset|service|offer)`
- [ ] `spctl policy (compose|assign)`
- [ ] `spctl conformance run`
- [ ] `spctl evidence get {agreementId}`

**DoD:**
- [ ] End‑to‑end flows usable from UI and CLI

### Stage 8 — Ops, Performance & Hardening (≈ 1–2 weeks)
- [ ] Helm chart (single CP/DP); sealed‑secrets examples; blue/green CP
- [ ] Perf: CP p50 < 150ms; DP ≥ 2 Gbps; streaming latency < 200ms
- [ ] Security: key rotation, JWKS cache, strict CORS/WAF; SBOM + cosign
- [ ] Docs: runbooks, backup/restore, upgrade guide

**DoD:**
- [ ] SLOs met in perf tests; secure by default; production‑ready deployment

---

## 5. Detailed Task Backlog (by package)

### packages/cp-gateway
- [ ] Fastify server; JSON‑LD middleware; OpenAPI generator
- [ ] DSP endpoints: Catalog/Negotiations/Agreements/Transfers
- [ ] Admin endpoints: assets/services/policies/selectors/offers (draft→publish), evidence export, keys rotate, trust‑anchors
- [ ] Idempotency keys; error mapping

### packages/dp-gateway
- [ ] Token validator (DPoP/mTLS); EnforcementContext assembly
- [ ] Router to adapters; duty pipeline; receipts writer
- [ ] Inbound/outbound pipelines; rate limiting; geo check

### packages/identity-bridge
- [ ] OID4VP/OID4VCI verifier; VC parsing (SD‑JWT & JSON‑LD)
- [ ] did:web resolution; trust anchors store; JWKS endpoint

### packages/policy-pdp
- [ ] ODRL JSON‑LD → internal AST; constraint evaluators (purpose/spatial/temporal/count)
- [ ] Conflict detector; recommendations; duty routing

### packages/catalog
- [ ] JSON‑LD utils; DCAT‑AP & ServiceOffer vocab
- [ ] Semantic filters; minimal in‑memory index; SHACL validation

### packages/agreements
- [ ] DSP FSM; persistence; policy hash pinning
- [ ] Agreement Sets model + linking (groupId)

### packages/adapters/http|s3|mqtt
- [ ] Plan/Execute; retries/back‑pressure; signed URL support
- [ ] Watermark support for batch modes

### packages/duties/core|watermark
- [ ] `notify`, `delete`, `count`, `rate`, `retention`, `watermark` executors
- [ ] Proof receipts (hash‑chain links)

### packages/subscriptions
- [ ] Tickets API; scheduler (RRULE) with HA locking
- [ ] Watermarks; `/dsp/usage/{agreementId}` counters

### packages/evidence
- [ ] Append‑only activity log; hash‑chain receipts
- [ ] Evidence bundle export (JSON‑LD) with redaction options

### packages/cli-spctl
- [ ] Auth to Admin API; YAML↔JSON‑LD; SHACL validate; quickstarts
- [ ] Conformance runner; evidence fetch

### packages/ui
- [ ] React admin pages for CRUD, publish, subscriptions, evidence, usage, trust anchors

---

## 6. Data & Schema Artifacts
- [ ] JSON‑LD contexts: connector vocab; service descriptors; ODRL profile
- [ ] SHACL shapes: DCAT‑AP dataset; service‑offer; agreement; policy
- [ ] OpenAPI: CP (DSP + Admin), DP (local control endpoints)

---

## 7. Testing Strategy
- [ ] Unit: vitest for PDP, adapter planners, duty execs
- [ ] Contract: supertest on CP/DP; JSON‑LD round‑trip; SHACL validation tests
- [ ] Interop: DSP TCK runner; golden files
- [ ] Performance: k6/gatling; scheduler drift tests
- [ ] Security: token replay; PoP binding; key rotation; OWASP baseline

---

## 8. Definition of Done (global)
- [ ] Lint/typecheck/tests pass; ≥80% coverage on critical packages
- [ ] Docker images published; Helm chart deploys (K8s) + single‑binary edge run
- [ ] PRD MVP ACs met: TCK core, two VC formats verified, service offers with ≥4 duties enforced, 3 deployment footprints

---

## 9. Future (Rust optimization path)
- [ ] Re‑implement hot DP adapters in Rust (through FFI) when profiling dictates
- [ ] Keep Node CP; preserve adapter/duty/identity interfaces
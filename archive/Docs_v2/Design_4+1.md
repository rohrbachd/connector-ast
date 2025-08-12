# Design — 4+1 Architectural Views

> This document describes each major feature using the 4+1 model: **Logical**, **Development**, **Process**, **Physical**, and **Scenarios**.

## Feature A — DSP Control Plane
### Logical
- Components: CP‑Gateway, Catalog, Agreements, Identity‑Bridge, Policy‑PDP
- Interfaces: DSP Catalog/Negotiation/Agreements/Transfers; Admin Authoring API
### Development
- Packages: `cp-gateway`, `catalog`, `agreements`, `identity-bridge`, `policy-pdp`
- Key classes: `NegotiationService`, `AgreementRepo`, `PolicyEvaluator`
### Process
- Sequence: negotiation start → offer check → VC verify → PDP decision → agreement persist
- Concurrency: CP stateless, DB transactions per negotiation step
### Physical
- Deployment: K8s pod (CP), autoscaled; DB: Postgres; optional Fuseki for semantics
### Scenarios
- Success: Consumer proposes → counter‑offer → accept → agreement ID returned
- Failure: VC invalid → 401; policy conflict → 409 with suggestions

## Feature B — Identity & Trust (OID4VP/OID4VCI)
### Logical
- Verifier accepts VP tokens, resolves did:web, checks trust anchors
### Development
- Package: `identity-bridge`; uses `openid-client`, `jose`, `did-jwt`
- JWKS endpoint for DP token verification
### Process
- VP presentation → verify → roles mapped → authZ context attached
### Physical
- Co‑located with CP; keys in sealed secrets/HSM optional
### Scenarios
- Expired VP → 401; unknown trust anchor → 403

## Feature C — Policy PDP (ODRL)
### Logical
- Parse ODRL; evaluate constraints; select duty executors
### Development
- Package: `policy-pdp`; AST + evaluators; registry of `DutyExecutor`s
### Process
- Input: policy JSON‑LD + context → decision (Permit/Deny) + obligations
### Physical
- In‑process library; scales horizontally with CP
### Scenarios
- Purpose mismatch → Deny; Count exceeded → Deny; Time window → Permit with duties

## Feature D — Data Plane + Adapters
### Logical
- DP‑Gateway, Adapters (HTTP/S3/MQTT), Duty pipeline
### Development
- Packages: `dp-gateway`, `adapters/*`, `duties/*`
### Process
- Token verify → plan adapter → execute → emit receipts
### Physical
- Separate pod near data; bandwidth SLO ≥ 2 Gbps
### Scenarios
- HTTP pull → ETag + count duty → receipt stored; S3 push with retention delete duty

## Feature E — Real‑Time: Standing Agreements, Subscriptions & Tickets
### Logical
- Selectors, Standing Agreements, Tickets, Subscriptions, Usage
### Development
- Packages: `subscriptions`, `agreements`, `cp-gateway`
### Process
- Create standing agreement → schedule subscription → issue tickets → watermark update
### Physical
- HA scheduler (advisory locks/Redis); persisted watermarks
### Scenarios
- Daily pull succeeds; missed window catch-up via `since`

## Feature F — Bidirectional Exchange (Agreement Sets)
### Logical
- Agreement Set linking inbound/outbound; direction‑aware tokens
### Development
- Packages: `agreements`, `cp-gateway`, `dp-gateway`
### Process
- Service negotiation → bootstrap return agreement → inbound upload → outbound push
- Evidence bundles per direction
### Physical
- Same CP/DP; separate ingress/egress guard chains
### Scenarios
- Input upload denied by inbound policy; outbound push watermarked

## Feature G — Admin/Provider API
### Logical
- Author assets/services/policies/selectors/offers; draft→publish
### Development
- Packages: `cp-gateway`, `catalog`
### Process
- CRUD → SHACL validate → publish to catalog
### Physical
- Private/mTLS‑guarded endpoints
### Scenarios
- Bulk policy assignment by selector; deprecate old offer version

## Feature H — Evidence & Observability
### Logical
- JSON‑LD activity log; hash‑chain; bundle export
### Development
- Packages: `evidence`, `dp-gateway`, `cp-gateway`
### Process
- On duty execution → receipt stored → bundle assembled on request
### Physical
- Postgres append‑only table; export gzip JSON‑LD
### Scenarios
- Evidence requested for audit; PII‑redacted view exported
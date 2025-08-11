# Technical Specification

This specification details API contracts, data models, tokens, states, shapes, and SLOs for the connector.

## 1. APIs

### 1.1 DSP (inter‑connector)
- `GET /dsp/catalog` — JSON‑LD; filters: `tag`, `purpose`, `profile`
- `POST /dsp/negotiations` — start negotiation; body references ContractOffer ID
- `GET /dsp/negotiations/{id}` — status
- `POST /dsp/agreements` — finalize agreement (if separate endpoint used)
- `POST /dsp/transfers` — `{ agreementId, type: data|service|stream, direction?: inbound|outbound, ... }`

### 1.2 Subscriptions & Tickets (real‑time)
- `POST /dsp/subscriptions` — `{ agreementId, selectorRef, mode, schedule?, since?, until? }`
- `GET /dsp/subscriptions/{id}` — state + last watermark
- `DELETE /dsp/subscriptions/{id}`
- `POST /dsp/tickets` — `{ agreementId, assetId? | since?, mode, direction? } → { ticket, expiry }`
- `GET /dsp/usage/{agreementId}` — counters/quota

### 1.3 Admin/Provider (authoring)
- Assets: `POST /admin/assets`, `GET /admin/assets`, `PATCH /admin/assets/{id}`, `POST /admin/assets/{id}/publish`, `POST /admin/assets/{id}/deprecate`
- Services: `POST /admin/services`, `GET /admin/services`, `PATCH /admin/services/{id}`, `POST /admin/services/{id}/publish`
- Policies: `POST /admin/policies`, `GET /admin/policies`, `POST /admin/policies/{id}/assign`
- Selectors: `POST /admin/selectors`, `GET /admin/selectors`
- Offers: `POST /admin/offers`, `GET /admin/offers`, `POST /admin/offers/{id}/publish`
- Evidence: `GET /admin/evidence/{agreementId}`
- Keys/Trust: `POST /admin/keys/rotate`, `POST /admin/trust-anchors`

## 2. Data Models (abridged JSON‑LD)

### 2.1 Asset (Dataset, DCAT‑AP)
- `@type: dcat:Dataset`
- `dcat:distribution.dcat:accessService` → adapter reference
- `spcn:tags` (SKOS compatible); `spcn:state: draft|published|deprecated`

### 2.2 ServiceOffer
- `@type: ServiceOffer`
- `spcn:openapi|asyncapi` link; `odrl:hasPolicy` → policy URI

### 2.3 ContractOffer & Agreement
- `@type: ContractOffer` → references asset/service + `odrl:hasPolicy`
- Agreement stores `spcn:policyHash` and versioned asset/service IDs

### 2.4 Agreement Set
- `{ groupId, inboundAgreementId, outboundAgreementId }`

### 2.5 Policy (ODRL profile)
- Permissions, Prohibitions, Duties; constraints: purpose, spatial, temporal, count, retention, redistribution
- Duty examples: `odrl:notify`, `odrl:delete`, `spcn:watermark`

## 3. Tokens

### 3.1 Tickets
- JOSE signed; PoP (DPoP) or mTLS bound
- Claims: `sub` (consumer DID), `agr` (agreementId), `dir` (inbound|outbound), `cnt` (count alloc), `exp`, `nbf`, `aud`

### 3.2 Invocation Tokens (services)
- Include `op` (operation), `agr`, `purpose`, `cnt`, `exp`

## 4. States & FSM
- Negotiation: proposal → counter‑offer → accepted → agreement
- Transfer: requested → in‑progress → completed/failed (DSP states)
- Subscription: scheduled → running → paused/cancelled

## 5. SHACL Shapes
- Dataset (DCAT‑AP), ServiceOffer, ContractOffer, Agreement, Policy
- Validation errors return HTTP 422 with shape violations

## 6. Observability & Evidence
- Activity event JSON‑LD: `who/what/when/why/where` + duty proof
- Hash‑chain: previous hash + current record to ensure integrity
- Evidence bundle: compressed JSON‑LD with policy hash, receipts, telemetry excerpts

## 7. Security & Privacy
- TLS 1.3; optional mTLS; strict CORS; rate limits
- Secrets: sealed secrets; key rotation; JWKS endpoint with `kid` pinning
- Logs: PII redaction; data minimization

## 8. Performance & SLOs
- CP p50 negotiation operations < 150 ms
- DP throughput ≥ 2 Gbps (batch) on commodity
- Streaming latency < 200 ms local
- Scheduler drift: < ±30 s (light), < ±2 min (heavy)

## 9. Compliance
- DSP TCK in CI; Gaia‑X VCs in catalog entries; Rulebook audit evidence available
- GDPR: DPA templates, ROPA hooks, retention duties enforced
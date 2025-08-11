# UI/UX Overview (expanded)

The admin console enables authoring, publishing, monitoring, and evidence export. It complements CLI tooling and is optional for headless deployments.

## 1. Navigation
- [ ] **Dashboard** — health, recent agreements, upcoming renewals, usage counters
- [ ] **Assets & Services** — YAML editor, JSON‑LD preview, SHACL validation
- [ ] **Policies & Packs** — named/parameterized policies, composition, staged rollout
- [ ] **Offers** — compose (asset/service + policy + terms), publish/deprecate
- [ ] **Subscriptions** — create/manage RRULE schedules, last watermark
- [ ] **Agreement Sets** — inbound/outbound view, direction‑aware counters
- [ ] **Usage** — live counters per agreement; quota status
- [ ] **Evidence** — bundle export (policy hashes, receipts, telemetry excerpts)
- [ ] **Trust** — Gaia‑X credentials & trust anchors
- [ ] **Settings** — keys, JWKS, identities, adapters

## 2. Screens & States
- [ ] Asset/Service Create — YAML editor with live JSON‑LD; SHACL pass/fail
- [ ] Policy Compose — add packs; parameter inputs; preview merged ODRL
- [ ] Offer Compose — select asset/service version + policy; draft→publish
- [ ] Subscription Create — RRULE builder; mode: periodic|push|stream
- [ ] Agreement Set — linked inbound/outbound; evidence tabs per direction
- [ ] Evidence Detail — receipts list, export JSON‑LD; redaction options
- [ ] Usage Detail — counters, reset options (admin‑only), charts

## 3. UX Guidelines
- [ ] Consistent JSON‑LD/YAML diff view for transparency
- [ ] Inline help linking to PRD and API docs
- [ ] Pessimistic updates with toasts; retry on network errors
- [ ] Accessibility: keyboard nav, ARIA labels, contrast ≥ 4.5:1
- [ ] i18n hooks (en/de); date/time in Europe/Berlin by default

## 4. Components
- [ ] SchemaForm (zod) for policies/selectors/offers
- [ ] RRULE builder widget
- [ ] YAML editor (monaco) with JSON‑LD preview
- [ ] Evidence viewer (JSON tree + download)

## 5. Non‑Functional UX
- [ ] Latency targets: < 200 ms UI interactions; optimistic loading where safe
- [ ] Error dictionary with remediation links

## 6. Checklists
- [ ] Wire OpenAPI client
- [ ] Hook SHACL validation service
- [ ] Implement Auth (OIDC) for console
- [ ] E2E tests (Playwright) for authoring & publish flows
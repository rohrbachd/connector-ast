# Project Structure (expanded)

This document extends the original structure with explicit packages, interfaces, and conventions while preserving the CP/DP split.

## 1. Root Layout
```
/connector-ast
├─ packages/                 # All runtime + libraries (pnpm workspaces)
│  ├─ cp-gateway             # Control Plane (DSP + Admin API)
│  ├─ dp-gateway             # Data Plane (enforcement + adapters)
│  ├─ identity-bridge        # OID4VP/OID4VCI + VC verification
│  ├─ policy-pdp             # ODRL PDP + constraint evaluators
│  ├─ catalog                # JSON-LD/DCAT + SHACL validation
│  ├─ agreements             # DSP FSM + Agreement Sets
│  ├─ adapters/http          # HTTP adapter
│  ├─ adapters/s3            # S3/Blob adapter
│  ├─ adapters/mqtt          # MQTT adapter
│  ├─ duties/core            # notify/delete/count/rate/retention
│  ├─ duties/watermark       # watermark
│  ├─ subscriptions          # tickets + scheduler + usage
│  ├─ evidence               # activity log + bundle export
│  ├─ cli-spctl              # CLI tooling
│  └─ ui                     # Admin UI (React)
├─ infra/helm                # Helm charts
├─ scripts                   # DevOps scripts
└─ docs                      # Design/Spec docs (4+1, specs, contexts, shapes)
```

## 2. Conventions
- **Module boundaries** are strict; no cross‑package imports except through published interfaces.
- **Naming**: kebab‑case for folders; camelCase for code; types in PascalCase.
- **Config**: `config.yaml` profiles (`edge|standard|scaleout`), env overrides via `SPCN_*` variables.
- **Secrets**: never committed; use Sealed Secrets on K8s; `.env.example` for local.

## 3. Key Interfaces (TypeScript)
```ts
export type TransferMode = "pull" | "push" | "stream" | "service";

export interface EnforcementContext {
  agreementId: string;
  policyHash: string;
  subjectDid: string;
  purpose?: string;
  constraints: { key: string; op: string; value: unknown }[];
  token: string;
  now: Date;
  watermark?: string;
  counters?: Record<string, number>;
  audit: (e: object) => void;
}

export interface Adapter {
  readonly id: string;
  init(cfg: unknown): Promise<void>;
  plan(req: { mode: TransferMode; assetId?: string; service?: { id: string; operation?: string } ; constraints: any[] }): Promise<any>;
  execute(plan: any, ctx: EnforcementContext): Promise<{ status: "ok"|"error"; receipt?: object }>;
  stop(): Promise<void>;
}

export interface DutyExecutor {
  supports(odrlUri: string): boolean;
  validate(ctx: EnforcementContext): { ok: boolean; reason?: string };
  enforce(ctx: EnforcementContext): Promise<{ proof?: string; details?: object }>;
}
```

## 4. Scripts
- `pnpm dev` – start CP + DP in watch mode
- `pnpm test` – unit tests
- `pnpm tck` – DSP TCK harness
- `pnpm build:images` – Docker images
- `pnpm helm:install` – install on K8s

## 5. Folder Ownership
- Each package owns its data models and migrations.
- Shared typing lives in a small `@connector-ast/types` (add when needed).

## 6. Checklists
- [ ] Create all package skeletons
- [ ] Wire tsconfig path aliases
- [ ] Enforce eslint import rules between packages
- [ ] Add CODEOWNERS per folder
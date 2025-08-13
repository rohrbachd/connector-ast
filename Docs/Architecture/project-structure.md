# Project Structure - Lightweight Dataspace Connector

## Root Directory Structure

```
connector-ast/
├── apps/                           # Application entry points
│   ├── control-plane/             # Control Plane application
│   └── data-plane/                # Data Plane application
├── packages/                      # Shared packages/libraries
│   ├── core/                      # Core domain models and interfaces
│   ├── dsp-protocol/              # DSP protocol implementation
│   ├── identity/                  # Identity and trust management
│   ├── policy/                    # Policy engine and ODRL
│   ├── catalog/                   # Catalog and semantic services
│   ├── transport/                 # Transport adapters
│   ├── observability/             # Monitoring and telemetry
│   └── common/                    # Shared utilities
├── tools/                         # Development and build tools
├── docs/                          # Documentation
├── deployment/                    # Deployment configurations
├── tests/                         # Integration and E2E tests
├── scripts/                       # Build and utility scripts
└── config/                        # Configuration files
```

## Detailed Package Structure

### Apps Directory

#### Control Plane (`apps/control-plane/`)

```
apps/control-plane/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.ts                     # Fastify app setup
│   ├── config/                    # Configuration management
│   │   ├── index.ts
│   │   ├── database.ts
│   │   ├── security.ts
│   │   └── observability.ts
│   ├── routes/                    # HTTP route handlers
│   │   ├── dsp/                   # DSP protocol endpoints
│   │   │   ├── catalog.ts
│   │   │   ├── negotiations.ts
│   │   │   ├── agreements.ts
│   │   │   ├── transfers.ts
│   │   │   └── participants.ts
│   │   ├── admin/                 # Administrative endpoints
│   │   │   ├── assets.ts
│   │   │   ├── policies.ts
│   │   │   ├── trust-anchors.ts
│   │   │   └── evidence.ts
│   │   └── health/                # Health check endpoints
│   │       ├── health.ts
│   │       └── ready.ts
│   ├── services/                  # Business logic services
│   │   ├── catalog.service.ts
│   │   ├── negotiation.service.ts
│   │   ├── agreement.service.ts
│   │   ├── identity.service.ts
│   │   └── policy.service.ts
│   ├── middleware/                # Custom middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   └── cors.middleware.ts
│   ├── plugins/                   # Fastify plugins
│   │   ├── database.plugin.ts
│   │   ├── observability.plugin.ts
│   │   └── security.plugin.ts
│   └── types/                     # Application-specific types
│       ├── api.types.ts
│       └── config.types.ts
├── test/                          # Unit tests
├── package.json
├── tsconfig.json
└── Dockerfile
```

#### Data Plane (`apps/data-plane/`)

```
apps/data-plane/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.ts                     # Fastify app setup
│   ├── config/                    # Configuration management
│   ├── routes/                    # HTTP route handlers
│   │   ├── transfer/              # Transfer execution endpoints
│   │   ├── service/               # Service invocation endpoints
│   │   └── health/                # Health check endpoints
│   ├── services/                  # Business logic services
│   │   ├── transfer.service.ts
│   │   ├── enforcement.service.ts
│   │   └── adapter.service.ts
│   ├── guards/                    # Policy enforcement
│   │   ├── policy.guard.ts
│   │   ├── rate-limit.guard.ts
│   │   └── geo.guard.ts
│   ├── executors/                 # Duty executors
│   │   ├── notify.executor.ts
│   │   ├── delete.executor.ts
│   │   └── watermark.executor.ts
│   └── adapters/                  # Transport adapter registry
│       └── registry.ts
├── test/
├── package.json
├── tsconfig.json
└── Dockerfile
```

### Packages Directory

#### Core Package (`packages/core/`)

```
packages/core/
├── src/
│   ├── index.ts                   # Package exports
│   ├── domain/                    # Domain models
│   │   ├── asset.ts
│   │   ├── agreement.ts
│   │   ├── offer.ts
│   │   ├── participant.ts
│   │   ├── policy.ts
│   │   └── transfer.ts
│   ├── interfaces/                # Core interfaces
│   │   ├── repository.interface.ts
│   │   ├── service.interface.ts
│   │   ├── adapter.interface.ts
│   │   └── executor.interface.ts
│   ├── types/                     # Shared types
│   │   ├── dsp.types.ts
│   │   ├── odrl.types.ts
│   │   ├── vc.types.ts
│   │   └── common.types.ts
│   ├── enums/                     # Enumerations
│   │   ├── transfer-state.enum.ts
│   │   ├── negotiation-state.enum.ts
│   │   └── policy-action.enum.ts
│   ├── errors/                    # Custom error classes
│   │   ├── base.error.ts
│   │   ├── validation.error.ts
│   │   ├── policy.error.ts
│   │   └── network.error.ts
│   └── utils/                     # Utility functions
│       ├── id-generator.ts
│       ├── hash.ts
│       └── validation.ts
├── test/
├── package.json
└── tsconfig.json
```

#### DSP Protocol Package (`packages/dsp-protocol/`)

```
packages/dsp-protocol/
├── src/
│   ├── index.ts
│   ├── client/                    # DSP client implementation
│   │   ├── dsp-client.ts
│   │   ├── catalog-client.ts
│   │   ├── negotiation-client.ts
│   │   └── transfer-client.ts
│   ├── server/                    # DSP server implementation
│   │   ├── handlers/
│   │   ├── validators/
│   │   └── serializers/
│   ├── state-machine/             # DSP state machines
│   │   ├── negotiation.state-machine.ts
│   │   └── transfer.state-machine.ts
│   ├── schemas/                   # JSON schemas
│   │   ├── catalog.schema.json
│   │   ├── negotiation.schema.json
│   │   ├── agreement.schema.json
│   │   └── transfer.schema.json
│   └── contexts/                  # JSON-LD contexts
│       ├── dsp.context.json
│       └── odrl.context.json
├── test/
├── package.json
└── tsconfig.json
```

#### Identity Package (`packages/identity/`)

```
packages/identity/
├── src/
│   ├── index.ts
│   ├── verifiers/                 # VC verifiers
│   │   ├── base.verifier.ts
│   │   ├── oid4vp.verifier.ts
│   │   └── sd-jwt.verifier.ts
│   ├── resolvers/                 # DID resolvers
│   │   ├── base.resolver.ts
│   │   ├── web.resolver.ts
│   │   └── registry.ts
│   ├── stores/                    # Trust and credential stores
│   │   ├── trust.store.ts
│   │   ├── credential.store.ts
│   │   └── revocation.store.ts
│   ├── mappers/                   # Claims to roles mapping
│   │   ├── claims.mapper.ts
│   │   └── role.mapper.ts
│   └── utils/
│       ├── crypto.utils.ts
│       └── jwt.utils.ts
├── test/
├── package.json
└── tsconfig.json
```

#### Policy Package (`packages/policy/`)

```
packages/policy/
├── src/
│   ├── index.ts
│   ├── engine/                    # Policy decision engine
│   │   ├── pdp.ts                 # Policy Decision Point
│   │   ├── pap.ts                 # Policy Administration Point
│   │   └── pip.ts                 # Policy Information Point
│   ├── parsers/                   # ODRL parsers
│   │   ├── odrl.parser.ts
│   │   └── json-ld.parser.ts
│   ├── evaluators/                # Policy evaluators
│   │   ├── constraint.evaluator.ts
│   │   ├── permission.evaluator.ts
│   │   └── prohibition.evaluator.ts
│   ├── resolvers/                 # Conflict resolvers
│   │   ├── conflict.resolver.ts
│   │   └── precedence.resolver.ts
│   ├── stores/                    # Policy storage
│   │   ├── policy.store.ts
│   │   └── decision.store.ts
│   └── templates/                 # Policy templates
│       ├── research.template.ts
│       ├── commercial.template.ts
│       └── geo-restricted.template.ts
├── test/
├── package.json
└── tsconfig.json
```

#### Catalog Package (`packages/catalog/`)

```
packages/catalog/
├── src/
│   ├── index.ts
│   ├── services/                  # Catalog services
│   │   ├── catalog.service.ts
│   │   ├── search.service.ts
│   │   └── federation.service.ts
│   ├── repositories/              # Data access
│   │   ├── asset.repository.ts
│   │   ├── offer.repository.ts
│   │   └── service.repository.ts
│   ├── validators/                # SHACL validators
│   │   ├── shacl.validator.ts
│   │   ├── dcat.validator.ts
│   │   └── ngsi-ld.validator.ts
│   ├── transformers/              # Data transformers
│   │   ├── json-ld.transformer.ts
│   │   ├── dcat.transformer.ts
│   │   └── rdf.transformer.ts
│   ├── indexers/                  # Search indexers
│   │   ├── text.indexer.ts
│   │   └── semantic.indexer.ts
│   └── shapes/                    # SHACL shapes
│       ├── dataset.shape.ttl
│       ├── service.shape.ttl
│       └── offer.shape.ttl
├── test/
├── package.json
└── tsconfig.json
```

#### Transport Package (`packages/transport/`)

```
packages/transport/
├── src/
│   ├── index.ts
│   ├── adapters/                  # Transport adapters
│   │   ├── http.adapter.ts
│   │   ├── s3.adapter.ts
│   │   ├── mqtt.adapter.ts
│   │   ├── kafka.adapter.ts
│   │   ├── webdav.adapter.ts
│   │   └── grpc.adapter.ts
│   ├── registry/                  # Adapter registry
│   │   ├── adapter.registry.ts
│   │   └── factory.ts
│   ├── planners/                  # Transfer planners
│   │   ├── transfer.planner.ts
│   │   └── service.planner.ts
│   ├── executors/                 # Transfer executors
│   │   ├── pull.executor.ts
│   │   ├── push.executor.ts
│   │   ├── stream.executor.ts
│   │   └── service.executor.ts
│   └── utils/
│       ├── stream.utils.ts
│       └── retry.utils.ts
├── test/
├── package.json
└── tsconfig.json
```

#### Observability Package (`packages/observability/`)

```
packages/observability/
├── src/
│   ├── index.ts
│   ├── telemetry/                 # OpenTelemetry setup
│   │   ├── tracer.ts
│   │   ├── metrics.ts
│   │   └── logger.ts
│   ├── collectors/                # Event collectors
│   │   ├── event.collector.ts
│   │   ├── audit.collector.ts
│   │   └── performance.collector.ts
│   ├── exporters/                 # Data exporters
│   │   ├── prometheus.exporter.ts
│   │   ├── jaeger.exporter.ts
│   │   └── elasticsearch.exporter.ts
│   ├── evidence/                  # Evidence generation
│   │   ├── evidence.generator.ts
│   │   └── bundle.creator.ts
│   └── health/                    # Health checks
│       ├── health.checker.ts
│       └── readiness.checker.ts
├── test/
├── package.json
└── tsconfig.json
```

#### Common Package (`packages/common/`)

```
packages/common/
├── src/
│   ├── index.ts
│   ├── config/                    # Configuration utilities
│   │   ├── config.loader.ts
│   │   ├── env.validator.ts
│   │   └── schema.ts
│   ├── database/                  # Database utilities
│   │   ├── connection.ts
│   │   ├── migration.ts
│   │   └── transaction.ts
│   ├── cache/                     # Cache utilities
│   │   ├── redis.client.ts
│   │   └── memory.cache.ts
│   ├── http/                      # HTTP utilities
│   │   ├── client.ts
│   │   ├── retry.ts
│   │   └── timeout.ts
│   ├── security/                  # Security utilities
│   │   ├── jwt.ts
│   │   ├── crypto.ts
│   │   └── rate-limiter.ts
│   ├── validation/                # Validation utilities
│   │   ├── json-schema.ts
│   │   ├── zod.schemas.ts
│   │   └── sanitizer.ts
│   └── utils/                     # General utilities
│       ├── async.ts
│       ├── date.ts
│       ├── string.ts
│       └── object.ts
├── test/
├── package.json
└── tsconfig.json
```

## Supporting Directories

### Tools Directory (`tools/`)

```
tools/
├── build/                         # Build tools
│   ├── webpack.config.js
│   ├── tsup.config.ts
│   └── docker-build.sh
├── dev/                           # Development tools
│   ├── dev-server.ts
│   ├── mock-wallet.ts
│   └── test-data-generator.ts
├── cli/                           # Command line tools
│   ├── spctl/                     # Connector CLI tool
│   │   ├── commands/
│   │   └── index.ts
│   └── migration/                 # Database migration tool
│       └── migrate.ts
└── scripts/                       # Utility scripts
    ├── setup-dev.sh
    ├── generate-keys.sh
    └── validate-config.sh
```

### Deployment Directory (`deployment/`)

```
deployment/
├── kubernetes/                    # Kubernetes manifests
│   ├── base/                      # Base configurations
│   │   ├── control-plane/
│   │   ├── data-plane/
│   │   ├── database/
│   │   └── monitoring/
│   ├── overlays/                  # Environment overlays
│   │   ├── development/
│   │   ├── staging/
│   │   └── production/
│   └── helm/                      # Helm charts
│       ├── connector/
│       └── dependencies/
├── docker/                        # Docker configurations
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── docker-compose.test.yml
├── terraform/                     # Infrastructure as Code
│   ├── modules/
│   ├── environments/
│   └── providers/
└── ansible/                       # Configuration management
    ├── playbooks/
    └── roles/
```

### Tests Directory (`tests/`)

```
tests/
├── integration/                   # Integration tests
│   ├── dsp-protocol/
│   ├── end-to-end/
│   └── performance/
├── fixtures/                      # Test data
│   ├── credentials/
│   ├── policies/
│   ├── assets/
│   └── agreements/
├── mocks/                         # Mock implementations
│   ├── wallet.mock.ts
│   ├── storage.mock.ts
│   └── peer.mock.ts
└── utils/                         # Test utilities
    ├── test-setup.ts
    ├── db-setup.ts
    └── helpers.ts
```

### Configuration Directory (`config/`)

```
config/
├── environments/                  # Environment configs
│   ├── development.yaml
│   ├── testing.yaml
│   ├── staging.yaml
│   └── production.yaml
├── schemas/                       # Configuration schemas
│   ├── app.schema.json
│   ├── database.schema.json
│   └── security.schema.json
├── policies/                      # Default policies
│   ├── research.odrl.json
│   ├── commercial.odrl.json
│   └── restricted.odrl.json
└── contexts/                      # JSON-LD contexts
    ├── connector.context.json
    ├── dcat-ap.context.json
    └── gaia-x.context.json
```

## Package Management Strategy

### Monorepo Configuration

- **Tool:** pnpm workspaces for efficient dependency management
- **Shared Dependencies:** Common dependencies hoisted to root
- **Independent Versioning:** Each package can be versioned independently
- **Build Orchestration:** Turborepo for efficient builds and caching

### Package Dependencies

```json
{
  "workspaces": ["apps/*", "packages/*", "tools/*"],
  "dependencies": {
    "@connector/core": "workspace:*",
    "@connector/dsp-protocol": "workspace:*",
    "@connector/identity": "workspace:*",
    "@connector/policy": "workspace:*",
    "@connector/catalog": "workspace:*",
    "@connector/transport": "workspace:*",
    "@connector/observability": "workspace:*",
    "@connector/common": "workspace:*"
  }
}
```

### Build Strategy

- **TypeScript Project References:** Efficient incremental builds
- **Shared tsconfig:** Base configuration with package-specific overrides
- **Bundle Strategy:** Each app bundled separately, packages as libraries
- **Docker Multi-stage:** Optimized container builds

This structure provides clear separation of concerns, enables independent development and testing of components, and supports the scalable architecture defined in the system design.

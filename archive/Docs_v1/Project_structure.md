# Project Structure

The project will be organized into distinct modules to reflect control and data plane separation:

```
/connector-ast
├── cp/                 # Control Plane services (catalog, negotiation, policy)
├── dp/                 # Data Plane services and adapters
├── common/             # Shared utilities and models
├── ui/                 # React-based admin dashboard
├── scripts/            # Deployment and CI/CD scripts
└── docs/               # Documentation and design artifacts
```

Each module will expose a clear API surface and remain independently testable. The `cp` and `dp` modules communicate via defined interfaces to preserve separation of concerns.

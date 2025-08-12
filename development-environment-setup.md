# Development Environment Setup Guide - Lightweight Dataspace Connector

## Prerequisites

### System Requirements

**Minimum Requirements:**
- **OS:** Windows 10/11, macOS 12+, or Linux (Ubuntu 20.04+)
- **RAM:** 8GB (16GB recommended)
- **Storage:** 20GB free space
- **CPU:** 4 cores (8 cores recommended)

**Required Software:**
- **Node.js:** 20.x LTS
- **pnpm:** 8.x
- **Docker:** 24.x with Docker Compose
- **Git:** 2.40+
- **VS Code:** Latest (recommended IDE)

### Development Tools Installation

#### 1. Node.js and pnpm Setup

```bash
# Install Node.js 20 LTS using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20

# Install pnpm globally
npm install -g pnpm@8

# Verify installations
node --version  # Should show v20.x.x
pnpm --version  # Should show 8.x.x
```

#### 2. Docker Installation

**Linux (Ubuntu/Debian):**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

**macOS:**
```bash
# Install Docker Desktop
brew install --cask docker

# Or download from https://www.docker.com/products/docker-desktop
```

**Windows:**
- Download Docker Desktop from https://www.docker.com/products/docker-desktop
- Enable WSL2 integration if using Windows

#### 3. Git Configuration

```bash
# Configure Git (replace with your details)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global init.defaultBranch main

# Optional: Configure Git to use VS Code as editor
git config --global core.editor "code --wait"
```

## Project Setup

### 1. Repository Clone and Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-org/connector-ast.git
cd connector-ast

# Install dependencies
pnpm install

# Copy environment configuration
cp .env.example .env.local

# Generate development certificates (for HTTPS/mTLS testing)
pnpm run setup:certs

# Initialize database
pnpm run db:setup
```

### 2. Environment Configuration

Create and configure your local environment file:

```bash
# .env.local
NODE_ENV=development
LOG_LEVEL=debug

# Database Configuration
DATABASE_URL=postgresql://connector:dev_password@localhost:5432/connector_dev
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=dev_redis_password

# Server Configuration
CP_HOST=localhost
CP_PORT=3000
DP_HOST=localhost
DP_PORT=3001

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-for-development-only
JWT_EXPIRES_IN=1h
ENCRYPTION_KEY=your-32-character-encryption-key-dev

# DID Configuration
CONNECTOR_DID=did:web:localhost:3000
DID_KEY_PATH=./certs/did-private-key.pem
DID_CERT_PATH=./certs/did-certificate.pem

# Trust Configuration
TRUST_ANCHORS_PATH=./config/trust-anchors.json
POLICY_STORE_PATH=./config/policies

# External Services (for testing)
MOCK_WALLET_URL=http://localhost:8080
MOCK_PEER_CONNECTOR_URL=http://localhost:4000

# Observability
ENABLE_METRICS=true
METRICS_PORT=9090
ENABLE_TRACING=true
JAEGER_ENDPOINT=http://localhost:14268/api/traces

# Development Features
ENABLE_SWAGGER=true
ENABLE_PLAYGROUND=true
MOCK_EXTERNAL_SERVICES=true
```

### 3. Docker Development Environment

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: connector-postgres-dev
    environment:
      POSTGRES_DB: connector_dev
      POSTGRES_USER: connector
      POSTGRES_PASSWORD: dev_password
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8"
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U connector -d connector_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: connector-redis-dev
    command: redis-server --requirepass dev_redis_password --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--no-auth-warning", "-a", "dev_redis_password", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  # Apache Jena Fuseki (Optional RDF Store)
  fuseki:
    image: stain/jena-fuseki:latest
    container_name: connector-fuseki-dev
    environment:
      ADMIN_PASSWORD: dev_fuseki_password
    ports:
      - "3030:3030"
    volumes:
      - fuseki_dev_data:/fuseki
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3030/$/ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Mock Wallet Service
  mock-wallet:
    image: node:20-alpine
    container_name: connector-mock-wallet
    working_dir: /app
    command: ["npm", "run", "dev"]
    ports:
      - "8080:8080"
    volumes:
      - ./tools/mock-wallet:/app
      - /app/node_modules
    environment:
      PORT: 8080
      NODE_ENV: development
    depends_on:
      - redis

  # Mock Peer Connector
  mock-peer:
    image: node:20-alpine
    container_name: connector-mock-peer
    working_dir: /app
    command: ["npm", "run", "dev"]
    ports:
      - "4000:4000"
    volumes:
      - ./tools/mock-peer:/app
      - /app/node_modules
    environment:
      PORT: 4000
      NODE_ENV: development

  # Jaeger for Distributed Tracing
  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: connector-jaeger-dev
    ports:
      - "16686:16686"  # Jaeger UI
      - "14268:14268"  # HTTP collector
    environment:
      COLLECTOR_OTLP_ENABLED: true

  # Prometheus for Metrics
  prometheus:
    image: prom/prometheus:latest
    container_name: connector-prometheus-dev
    ports:
      - "9091:9090"  # Avoid conflict with app metrics port
    volumes:
      - ./config/prometheus-dev.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_dev_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  # Grafana for Visualization
  grafana:
    image: grafana/grafana:latest
    container_name: connector-grafana-dev
    ports:
      - "3003:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: dev_grafana_password
    volumes:
      - grafana_dev_data:/var/lib/grafana
      - ./config/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./config/grafana/datasources:/etc/grafana/provisioning/datasources:ro

volumes:
  postgres_dev_data:
  redis_dev_data:
  fuseki_dev_data:
  prometheus_dev_data:
  grafana_dev_data:

networks:
  default:
    name: connector-dev-network
```

### 4. Start Development Environment

```bash
# Start all development services
pnpm run dev:services

# Or manually with Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
pnpm run dev:wait-for-services

# Run database migrations
pnpm run db:migrate

# Seed development data
pnpm run db:seed
```

## Development Workflow

### 1. Daily Development Commands

```bash
# Start development servers (with hot reload)
pnpm run dev

# This starts:
# - Control Plane on http://localhost:3000
# - Data Plane on http://localhost:3001
# - API Documentation on http://localhost:3000/docs

# Run tests
pnpm run test           # All tests
pnpm run test:unit      # Unit tests only
pnpm run test:integration # Integration tests
pnpm run test:e2e       # End-to-end tests
pnpm run test:watch     # Watch mode

# Code quality
pnpm run lint           # ESLint
pnpm run lint:fix       # Fix linting issues
pnpm run type-check     # TypeScript type checking
pnpm run format         # Prettier formatting

# Database operations
pnpm run db:migrate     # Run migrations
pnpm run db:rollback    # Rollback last migration
pnpm run db:reset       # Reset database
pnpm run db:seed        # Seed test data
pnpm run db:studio      # Open Prisma Studio
```

### 2. Package Development

```bash
# Work on specific packages
cd packages/core
pnpm run build
pnpm run test

# Build all packages
pnpm run build:packages

# Build applications
pnpm run build:apps

# Build everything
pnpm run build
```

### 3. Testing Workflow

```bash
# Run tests with coverage
pnpm run test:coverage

# Run specific test suites
pnpm run test packages/core
pnpm run test apps/control-plane

# Run tests matching pattern
pnpm run test -- --grep "policy"

# Debug tests
pnpm run test:debug

# Performance testing
pnpm run test:performance
```

## IDE Configuration

### VS Code Setup

#### 1. Recommended Extensions

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode-remote.remote-containers",
    "ms-vscode.vscode-docker",
    "humao.rest-client",
    "ms-vscode.vscode-jest",
    "orta.vscode-jest",
    "ms-playwright.playwright",
    "prisma.prisma",
    "graphql.vscode-graphql",
    "ms-vscode.vscode-thunder-client"
  ]
}
```

#### 2. VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/coverage": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true,
    "pnpm-lock.yaml": true
  },
  "jest.jestCommandLine": "pnpm test",
  "jest.autoRun": "off",
  "jest.showCoverageOnLoad": true,
  "rest-client.environmentVariables": {
    "local": {
      "baseUrl": "http://localhost:3000",
      "token": "dev-token"
    }
  }
}
```

#### 3. Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Control Plane",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/control-plane/src/main.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      },
      "envFile": "${workspaceFolder}/.env.local",
      "runtimeArgs": ["-r", "tsx/cjs"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Data Plane",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/data-plane/src/main.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      },
      "envFile": "${workspaceFolder}/.env.local",
      "runtimeArgs": ["-r", "tsx/cjs"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vitest",
      "args": ["run", "--reporter=verbose"],
      "env": {
        "NODE_ENV": "test"
      },
      "envFile": "${workspaceFolder}/.env.test",
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    }
  ]
}
```

#### 4. Tasks Configuration

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Dev Services",
      "type": "shell",
      "command": "pnpm",
      "args": ["run", "dev:services"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Run Tests",
      "type": "shell",
      "command": "pnpm",
      "args": ["test"],
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Build All",
      "type": "shell",
      "command": "pnpm",
      "args": ["build"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
```

## Development Scripts

### 1. Package.json Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"pnpm:dev:cp\" \"pnpm:dev:dp\"",
    "dev:cp": "tsx watch apps/control-plane/src/main.ts",
    "dev:dp": "tsx watch apps/data-plane/src/main.ts",
    "dev:services": "docker-compose -f docker-compose.dev.yml up -d",
    "dev:services:stop": "docker-compose -f docker-compose.dev.yml down",
    "dev:wait-for-services": "wait-on tcp:5432 tcp:6379 tcp:3030",
    
    "build": "turbo run build",
    "build:packages": "turbo run build --filter='./packages/*'",
    "build:apps": "turbo run build --filter='./apps/*'",
    
    "test": "vitest run",
    "test:unit": "vitest run --config vitest.unit.config.ts",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:debug": "vitest --inspect-brk --no-coverage",
    "test:performance": "k6 run tests/performance/load-test.js",
    
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    
    "db:migrate": "prisma migrate dev",
    "db:rollback": "prisma migrate reset",
    "db:reset": "prisma migrate reset --force",
    "db:seed": "tsx scripts/seed-dev-data.ts",
    "db:studio": "prisma studio",
    "db:setup": "pnpm db:migrate && pnpm db:seed",
    
    "setup:certs": "tsx scripts/generate-dev-certs.ts",
    "setup:dev": "pnpm install && pnpm setup:certs && pnpm dev:services && pnpm db:setup",
    
    "clean": "rimraf dist coverage .turbo",
    "clean:deps": "rimraf node_modules packages/*/node_modules apps/*/node_modules",
    "clean:all": "pnpm clean && pnpm clean:deps"
  }
}
```

### 2. Development Utilities

Create `scripts/dev-utils.ts`:

```typescript
#!/usr/bin/env tsx

import { Command } from 'commander';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const program = new Command();

program
  .name('dev-utils')
  .description('Development utilities for Connector AST')
  .version('1.0.0');

program
  .command('reset')
  .description('Reset development environment')
  .action(async () => {
    console.log('🔄 Resetting development environment...');
    
    // Stop services
    execSync('docker-compose -f docker-compose.dev.yml down -v', { stdio: 'inherit' });
    
    // Clean build artifacts
    execSync('pnpm clean', { stdio: 'inherit' });
    
    // Reinstall dependencies
    execSync('pnpm install', { stdio: 'inherit' });
    
    // Start services
    execSync('pnpm dev:services', { stdio: 'inherit' });
    
    // Setup database
    execSync('pnpm db:setup', { stdio: 'inherit' });
    
    console.log('✅ Development environment reset complete!');
  });

program
  .command('generate-test-data')
  .description('Generate test data for development')
  .option('-c, --count <number>', 'Number of records to generate', '10')
  .action(async (options) => {
    const count = parseInt(options.count);
    console.log(`📊 Generating ${count} test records...`);
    
    // Generate test participants, assets, policies, etc.
    const testData = generateTestData(count);
    
    // Save to file
    writeFileSync(
      join(process.cwd(), 'tests/fixtures/test-data.json'),
      JSON.stringify(testData, null, 2)
    );
    
    console.log('✅ Test data generated successfully!');
  });

program
  .command('check-services')
  .description('Check if all development services are running')
  .action(async () => {
    const services = [
      { name: 'PostgreSQL', port: 5432 },
      { name: 'Redis', port: 6379 },
      { name: 'Fuseki', port: 3030 },
      { name: 'Jaeger', port: 16686 },
      { name: 'Prometheus', port: 9091 },
      { name: 'Grafana', port: 3003 }
    ];
    
    console.log('🔍 Checking development services...\n');
    
    for (const service of services) {
      try {
        execSync(`nc -z localhost ${service.port}`, { stdio: 'pipe' });
        console.log(`✅ ${service.name} (port ${service.port}) - Running`);
      } catch {
        console.log(`❌ ${service.name} (port ${service.port}) - Not running`);
      }
    }
  });

function generateTestData(count: number) {
  // Implementation for generating test data
  return {
    participants: Array.from({ length: count }, (_, i) => ({
      id: `participant-${i + 1}`,
      did: `did:web:localhost:300${i % 10}`,
      name: `Test Participant ${i + 1}`,
      roles: ['DataProvider', 'ServiceProvider']
    })),
    assets: Array.from({ length: count * 2 }, (_, i) => ({
      id: `asset-${i + 1}`,
      title: `Test Asset ${i + 1}`,
      type: i % 2 === 0 ? 'dataset' : 'service',
      participantId: `participant-${Math.floor(i / 2) + 1}`
    }))
  };
}

program.parse();
```

## Testing Setup

### 1. Test Configuration Files

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/tests/**'
      ]
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@core': resolve(__dirname, './packages/core/src'),
      '@dsp': resolve(__dirname, './packages/dsp-protocol/src'),
      '@identity': resolve(__dirname, './packages/identity/src'),
      '@policy': resolve(__dirname, './packages/policy/src'),
      '@catalog': resolve(__dirname, './packages/catalog/src'),
      '@transport': resolve(__dirname, './packages/transport/src'),
      '@common': resolve(__dirname, './packages/common/src')
    }
  }
});
```

### 2. Test Setup File

Create `tests/setup.ts`:

```typescript
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { Database } from '@common/database';
import { Redis } from 'ioredis';

let database: Database;
let redis: Redis;

beforeAll(async () => {
  // Setup test database
  process.env.DATABASE_URL = 'postgresql://connector:test_password@localhost:5432/connector_test';
  process.env.REDIS_URL = 'redis://localhost:6379/1'; // Use DB 1 for tests
  
  // Initialize connections
  database = new Database(process.env.DATABASE_URL);
  redis = new Redis(process.env.REDIS_URL);
  
  // Run migrations
  execSync('pnpm db:migrate', { env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL } });
});

afterAll(async () => {
  // Cleanup
  await database.close();
  await redis.quit();
});

beforeEach(async () => {
  // Clean database before each test
  await database.query('TRUNCATE TABLE participants, assets, policies, offers, contract_negotiations, contract_agreements, transfer_processes CASCADE');
  
  // Clear Redis
  await redis.flushdb();
});

afterEach(async () => {
  // Additional cleanup if needed
});

// Global test utilities
global.testDatabase = database;
global.testRedis = redis;
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Port Conflicts

```bash
# Check what's using a port
lsof -i :3000
netstat -tulpn | grep :3000

# Kill process using port
kill -9 $(lsof -t -i:3000)

# Use different ports in .env.local
CP_PORT=3010
DP_PORT=3011
```

#### 2. Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs connector-postgres-dev

# Reset database
pnpm db:reset
```

#### 3. Node.js Version Issues

```bash
# Check current version
node --version

# Switch to correct version
nvm use 20

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 4. Docker Issues

```bash
# Check Docker status
docker info

# Restart Docker services
docker-compose -f docker-compose.dev.yml restart

# Clean Docker cache
docker system prune -a
```

### Development Tips

1. **Hot Reload:** Use `tsx watch` for automatic restarts on file changes
2. **Database Inspection:** Use Prisma Studio (`pnpm db:studio`) for visual database inspection
3. **API Testing:** Use Thunder Client or REST Client extensions in VS Code
4. **Debugging:** Set breakpoints in VS Code and use the debug configurations
5. **Performance:** Use the built-in Node.js profiler for performance analysis
6. **Memory Leaks:** Use `--inspect` flag and Chrome DevTools for memory debugging

### Getting Help

- **Documentation:** Check the `/docs` folder for detailed documentation
- **API Reference:** Visit `http://localhost:3000/docs` when running in development
- **Issues:** Create GitHub issues for bugs or feature requests
- **Discussions:** Use GitHub Discussions for questions and community support

This comprehensive development environment setup ensures developers can quickly get up and running with the Lightweight Dataspace Connector project while maintaining consistency across different development machines.
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/control-plane/package.json packages/control-plane/
COPY packages/data-plane/package.json packages/data-plane/
COPY packages/shared/package.json packages/shared/
COPY packages/tools/package.json packages/tools/

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build all packages
RUN pnpm build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy built files from builder
COPY --from=builder /app/packages/control-plane/dist ./control-plane
COPY --from=builder /app/packages/data-plane/dist ./data-plane
COPY --from=builder /app/packages/core/dist ./core
COPY --from=builder /app/packages/shared/dist ./shared
COPY --from=builder /app/packages/tools/dist ./tools

# Copy package.json for runtime dependencies
COPY package.json pnpm-workspace.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/control-plane/package.json packages/control-plane/
COPY packages/data-plane/package.json packages/data-plane/
COPY packages/shared/package.json packages/shared/
COPY packages/tools/package.json packages/tools/

# Install only production dependencies
RUN pnpm install --prod

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000 3001

CMD ["pnpm", "start"]
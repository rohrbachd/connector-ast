# Deployment & DevOps Strategy - Lightweight Dataspace Connector

## Deployment Architecture Overview

The connector supports multiple deployment modes to meet different operational requirements:

1. **Edge/On-premises** - Single-node deployment with embedded components
2. **Standard Cloud** - Separate CP/DP pods with external databases (Target)
3. **Scale-out** - Horizontal scaling with multi-zone deployment

```mermaid
graph TB
    subgraph "Deployment Modes"
        subgraph "Edge/On-prem"
            EdgeNode[Single Node<br/>CP+DP+DB]
        end

        subgraph "Standard Cloud"
            CPPods[CP Pods<br/>Stateless]
            DPPods[DP Pods<br/>Near Data]
            ExtDB[(External DB<br/>PostgreSQL)]
            Cache[(Redis Cache)]
        end

        subgraph "Scale-out"
            CPCluster[CP Cluster<br/>Multi-Zone]
            DPCluster[DP Cluster<br/>Auto-scaling]
            DBCluster[(DB Cluster<br/>HA)]
            CacheCluster[(Redis Cluster)]
        end
    end

    subgraph "Infrastructure"
        K8s[Kubernetes]
        Docker[Docker]
        Helm[Helm Charts]
        Terraform[Terraform]
    end

    EdgeNode --> Docker
    CPPods --> K8s
    DPPods --> K8s
    CPCluster --> K8s
    DPCluster --> K8s

    K8s --> Helm
    ExtDB --> Terraform
    DBCluster --> Terraform
```

## Container Strategy

### 1. Docker Images

#### Multi-stage Build Strategy

```dockerfile
# Base image with Node.js and security updates
FROM node:20-alpine AS base
RUN apk add --no-cache dumb-init
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN corepack enable pnpm

# Dependencies stage
FROM base AS deps
RUN pnpm install --frozen-lockfile --prod

# Build stage
FROM base AS build
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Control Plane production image
FROM base AS control-plane
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist/apps/control-plane ./dist
COPY --from=build /app/dist/packages ./packages
USER node
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

# Data Plane production image
FROM base AS data-plane
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist/apps/data-plane ./dist
COPY --from=build /app/dist/packages ./packages
USER node
EXPOSE 3001
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

# Single-node edge image
FROM base AS edge
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist/packages ./packages
USER node
EXPOSE 3000 3001
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/edge-main.js"]
```

#### Image Optimization

- **Multi-stage builds** to minimize final image size
- **Alpine Linux** base for security and size
- **Non-root user** for security
- **dumb-init** for proper signal handling
- **Layer caching** optimization for faster builds

### 2. Image Security

```yaml
# .github/workflows/security-scan.yml
name: Container Security Scan
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build images
        run: |
          docker build -t connector:cp --target control-plane .
          docker build -t connector:dp --target data-plane .

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'connector:cp'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Sign images with Cosign
        uses: sigstore/cosign-installer@v3
        with:
          cosign-release: 'v2.0.0'

      - name: Sign container images
        run: |
          cosign sign --yes connector:cp
          cosign sign --yes connector:dp
```

## Kubernetes Deployment

### 1. Helm Chart Structure

```
deployment/helm/connector/
├── Chart.yaml
├── values.yaml
├── values-dev.yaml
├── values-staging.yaml
├── values-prod.yaml
├── templates/
│   ├── control-plane/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── configmap.yaml
│   │   ├── secret.yaml
│   │   └── hpa.yaml
│   ├── data-plane/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── configmap.yaml
│   │   └── hpa.yaml
│   ├── database/
│   │   ├── postgresql.yaml
│   │   ├── redis.yaml
│   │   └── migrations-job.yaml
│   ├── monitoring/
│   │   ├── servicemonitor.yaml
│   │   ├── prometheusrule.yaml
│   │   └── grafana-dashboard.yaml
│   ├── networking/
│   │   ├── ingress.yaml
│   │   ├── networkpolicy.yaml
│   │   └── certificate.yaml
│   └── rbac/
│       ├── serviceaccount.yaml
│       ├── role.yaml
│       └── rolebinding.yaml
└── crds/
    └── connector-crd.yaml
```

### 2. Control Plane Deployment

```yaml
# templates/control-plane/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "connector.fullname" . }}-cp
  labels:
    {{- include "connector.labels" . | nindent 4 }}
    app.kubernetes.io/component: control-plane
spec:
  replicas: {{ .Values.controlPlane.replicaCount }}
  selector:
    matchLabels:
      {{- include "connector.selectorLabels" . | nindent 6 }}
      app.kubernetes.io/component: control-plane
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/control-plane/configmap.yaml") . | sha256sum }}
        checksum/secret: {{ include (print $.Template.BasePath "/control-plane/secret.yaml") . | sha256sum }}
      labels:
        {{- include "connector.selectorLabels" . | nindent 8 }}
        app.kubernetes.io/component: control-plane
    spec:
      serviceAccountName: {{ include "connector.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.controlPlane.podSecurityContext | nindent 8 }}
      containers:
        - name: control-plane
          image: "{{ .Values.controlPlane.image.repository }}:{{ .Values.controlPlane.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.controlPlane.image.pullPolicy }}
          ports:
            - name: http
              containerPort: 3000
              protocol: TCP
            - name: metrics
              containerPort: 9090
              protocol: TCP
          env:
            - name: NODE_ENV
              value: {{ .Values.environment }}
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: {{ include "connector.fullname" . }}-secret
                  key: database-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: {{ include "connector.fullname" . }}-secret
                  key: redis-url
          envFrom:
            - configMapRef:
                name: {{ include "connector.fullname" . }}-cp-config
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            {{- toYaml .Values.controlPlane.resources | nindent 12 }}
          securityContext:
            {{- toYaml .Values.controlPlane.securityContext | nindent 12 }}
          volumeMounts:
            - name: config
              mountPath: /app/config
              readOnly: true
            - name: tls-certs
              mountPath: /app/certs
              readOnly: true
      volumes:
        - name: config
          configMap:
            name: {{ include "connector.fullname" . }}-cp-config
        - name: tls-certs
          secret:
            secretName: {{ include "connector.fullname" . }}-tls
      {{- with .Values.controlPlane.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.controlPlane.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.controlPlane.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```

### 3. Horizontal Pod Autoscaler

```yaml
# templates/control-plane/hpa.yaml
{{- if .Values.controlPlane.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "connector.fullname" . }}-cp-hpa
  labels:
    {{- include "connector.labels" . | nindent 4 }}
    app.kubernetes.io/component: control-plane
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "connector.fullname" . }}-cp
  minReplicas: {{ .Values.controlPlane.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.controlPlane.autoscaling.maxReplicas }}
  metrics:
    {{- if .Values.controlPlane.autoscaling.targetCPUUtilizationPercentage }}
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.controlPlane.autoscaling.targetCPUUtilizationPercentage }}
    {{- end }}
    {{- if .Values.controlPlane.autoscaling.targetMemoryUtilizationPercentage }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .Values.controlPlane.autoscaling.targetMemoryUtilizationPercentage }}
    {{- end }}
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
{{- end }}
```

### 4. Network Policies

```yaml
# templates/networking/networkpolicy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "connector.fullname" . }}-netpol
  labels:
    {{- include "connector.labels" . | nindent 4 }}
spec:
  podSelector:
    matchLabels:
      {{- include "connector.selectorLabels" . | nindent 6 }}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  # Allow ingress from ingress controller
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
    - protocol: TCP
      port: 3001
  # Allow ingress from monitoring
  - from:
    - namespaceSelector:
        matchLabels:
          name: monitoring
    ports:
    - protocol: TCP
      port: 9090
  # Allow inter-pod communication
  - from:
    - podSelector:
        matchLabels:
          {{- include "connector.selectorLabels" . | nindent 10 }}
  egress:
  # Allow egress to database
  - to:
    - podSelector:
        matchLabels:
          app: postgresql
    ports:
    - protocol: TCP
      port: 5432
  # Allow egress to Redis
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
  # Allow egress to external services (DNS, HTTPS)
  - to: []
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 80
```

## Infrastructure as Code

### 1. Terraform Configuration

```hcl
# infrastructure/terraform/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
    postgresql = {
      source  = "cyrilgdn/postgresql"
      version = "~> 1.20"
    }
  }
}

# Kubernetes cluster configuration
resource "kubernetes_namespace" "connector" {
  metadata {
    name = var.namespace
    labels = {
      "app.kubernetes.io/name"     = "connector"
      "app.kubernetes.io/instance" = var.instance_name
    }
  }
}

# PostgreSQL database
resource "helm_release" "postgresql" {
  name       = "postgresql"
  repository = "https://charts.bitnami.com/bitnami"
  chart      = "postgresql"
  version    = "12.5.8"
  namespace  = kubernetes_namespace.connector.metadata[0].name

  values = [
    templatefile("${path.module}/values/postgresql.yaml", {
      database_name = var.database_name
      username      = var.database_username
      storage_size  = var.database_storage_size
      storage_class = var.storage_class
    })
  ]

  set_sensitive {
    name  = "auth.postgresPassword"
    value = var.database_password
  }

  set_sensitive {
    name  = "auth.password"
    value = var.database_password
  }
}

# Redis cache
resource "helm_release" "redis" {
  name       = "redis"
  repository = "https://charts.bitnami.com/bitnami"
  chart      = "redis"
  version    = "17.11.3"
  namespace  = kubernetes_namespace.connector.metadata[0].name

  values = [
    templatefile("${path.module}/values/redis.yaml", {
      storage_size  = var.redis_storage_size
      storage_class = var.storage_class
    })
  ]

  set_sensitive {
    name  = "auth.password"
    value = var.redis_password
  }
}

# Connector application
resource "helm_release" "connector" {
  name       = "connector"
  chart      = "../../helm/connector"
  namespace  = kubernetes_namespace.connector.metadata[0].name

  depends_on = [
    helm_release.postgresql,
    helm_release.redis
  ]

  values = [
    templatefile("${path.module}/values/connector-${var.environment}.yaml", {
      image_tag           = var.image_tag
      database_host       = "${helm_release.postgresql.name}-postgresql"
      redis_host          = "${helm_release.redis.name}-redis-master"
      ingress_host        = var.ingress_host
      tls_secret_name     = var.tls_secret_name
      storage_class       = var.storage_class
    })
  ]

  set_sensitive {
    name  = "database.password"
    value = var.database_password
  }

  set_sensitive {
    name  = "redis.password"
    value = var.redis_password
  }
}
```

### 2. Environment-specific Variables

```hcl
# infrastructure/terraform/environments/production/terraform.tfvars
environment   = "production"
namespace     = "connector-prod"
instance_name = "connector-prod"

# Database configuration
database_name         = "connector"
database_username     = "connector"
database_storage_size = "100Gi"

# Redis configuration
redis_storage_size = "20Gi"

# Application configuration
image_tag    = "v1.0.0"
ingress_host = "connector.example.com"

# Infrastructure
storage_class    = "fast-ssd"
tls_secret_name  = "connector-tls"

# Scaling
control_plane_replicas = 3
data_plane_replicas    = 2

# Resources
control_plane_cpu_request    = "500m"
control_plane_memory_request = "1Gi"
control_plane_cpu_limit      = "2000m"
control_plane_memory_limit   = "4Gi"

data_plane_cpu_request    = "1000m"
data_plane_memory_request = "2Gi"
data_plane_cpu_limit      = "4000m"
data_plane_memory_limit   = "8Gi"
```

## CI/CD Pipeline

### 1. GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
    tags: ['v*']
  pull_request:
    branches: [main, develop]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: connector_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run linting
        run: pnpm lint

      - name: Run type checking
        run: pnpm type-check

      - name: Run unit tests
        run: pnpm test:unit
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/connector_test
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/connector_test
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push Control Plane image
        uses: docker/build-push-action@v5
        with:
          context: .
          target: control-plane
          push: true
          tags: ${{ steps.meta.outputs.tags }}-cp
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push Data Plane image
        uses: docker/build-push-action@v5
        with:
          context: .
          target: data-plane
          push: true
          tags: ${{ steps.meta.outputs.tags }}-dp
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: build
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2

      - name: Deploy to staging
        run: |
          cd infrastructure/terraform/environments/staging
          terraform init
          terraform plan -var="image_tag=${{ github.sha }}"
          terraform apply -auto-approve -var="image_tag=${{ github.sha }}"

  deploy-production:
    if: startsWith(github.ref, 'refs/tags/v')
    needs: build
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2

      - name: Deploy to production
        run: |
          cd infrastructure/terraform/environments/production
          terraform init
          terraform plan -var="image_tag=${{ github.ref_name }}"
          terraform apply -auto-approve -var="image_tag=${{ github.ref_name }}"

      - name: Run smoke tests
        run: |
          # Wait for deployment to be ready
          kubectl wait --for=condition=available --timeout=300s deployment/connector-cp
          kubectl wait --for=condition=available --timeout=300s deployment/connector-dp

          # Run smoke tests
          pnpm test:smoke --endpoint=https://connector.example.com
```

## Monitoring and Observability

### 1. Prometheus Configuration

```yaml
# deployment/monitoring/prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s

    rule_files:
      - "connector-rules.yml"

    scrape_configs:
      - job_name: 'connector-cp'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app_kubernetes_io_component]
            action: keep
            regex: control-plane
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            target_label: __address__
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
      
      - job_name: 'connector-dp'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app_kubernetes_io_component]
            action: keep
            regex: data-plane
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true

  connector-rules.yml: |
    groups:
      - name: connector.rules
        rules:
          - alert: ConnectorHighErrorRate
            expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "High error rate detected"
              description: "Error rate is {{ $value }} errors per second"
          
          - alert: ConnectorHighLatency
            expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "High latency detected"
              description: "95th percentile latency is {{ $value }} seconds"
          
          - alert: ConnectorDatabaseConnectionFailure
            expr: up{job="postgresql"} == 0
            for: 1m
            labels:
              severity: critical
            annotations:
              summary: "Database connection failure"
              description: "Cannot connect to PostgreSQL database"
```

### 2. Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Dataspace Connector Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Active Agreements",
        "type": "stat",
        "targets": [
          {
            "expr": "connector_active_agreements_total",
            "legendFormat": "Active Agreements"
          }
        ]
      },
      {
        "title": "Data Transfers",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(connector_transfers_total[5m])",
            "legendFormat": "{{status}}"
          }
        ]
      }
    ]
  }
}
```

## Backup and Disaster Recovery

### 1. Database Backup Strategy

```yaml
# deployment/backup/postgres-backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
spec:
  schedule: '0 2 * * *' # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: postgres-backup
              image: postgres:15
              env:
                - name: PGPASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: postgresql-secret
                      key: password
              command:
                - /bin/bash
                - -c
                - |
                  DATE=$(date +%Y%m%d_%H%M%S)
                  pg_dump -h postgresql -U connector connector > /backup/connector_$DATE.sql
                  # Upload to S3 or other backup storage
                  aws s3 cp /backup/connector_$DATE.sql s3://connector-backups/
                  # Keep only last 30 days of backups locally
                  find /backup -name "connector_*.sql" -mtime +30 -delete
              volumeMounts:
                - name: backup-storage
                  mountPath: /backup
          volumes:
            - name: backup-storage
              persistentVolumeClaim:
                claimName: backup-pvc
          restartPolicy: OnFailure
```

### 2. Disaster Recovery Plan

```bash
#!/bin/bash
# scripts/disaster-recovery.sh

set -e

BACKUP_DATE=${1:-latest}
NAMESPACE=${2:-connector-prod}

echo "Starting disaster recovery for date: $BACKUP_DATE"

# 1. Scale down applications
kubectl scale deployment connector-cp --replicas=0 -n $NAMESPACE
kubectl scale deployment connector-dp --replicas=0 -n $NAMESPACE

# 2. Restore database
if [ "$BACKUP_DATE" = "latest" ]; then
    BACKUP_FILE=$(aws s3 ls s3://connector-backups/ | sort | tail -n 1 | awk '{print $4}')
else
    BACKUP_FILE="connector_${BACKUP_DATE}.sql"
fi

echo "Restoring from backup: $BACKUP_FILE"
aws s3 cp s3://connector-backups/$BACKUP_FILE /tmp/restore.sql

# Create restore job
kubectl create job restore-db --from=cronjob/postgres-backup -n $NAMESPACE
kubectl patch job restore-db -n $NAMESPACE --patch '{
  "spec": {
    "template": {
      "spec": {
        "containers": [{
          "name": "postgres-backup",
          "command": ["/bin/bash", "-c", "psql -h postgresql -U connector connector < /tmp/restore.sql"]
        }]
      }
    }
  }
}'

# Wait for restore to complete
kubectl wait --for=condition=complete job/restore-db -n $NAMESPACE --timeout=600s

# 3
# Scale up applications
kubectl scale
```

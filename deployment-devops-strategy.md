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
  schedule: "0 2 * * *"  # Daily at 2 AM
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
kubectl scale deployment connector-cp --replicas=3 -n $NAMESPACE
kubectl scale deployment connector-dp --replicas=2 -n $NAMESPACE

# 4. Wait for applications to be ready
kubectl wait --for=condition=available deployment/connector-cp -n $NAMESPACE --timeout=300s
kubectl wait --for=condition=available deployment/connector-dp -n $NAMESPACE --timeout=300s

# 5. Run health checks
echo "Running health checks..."
kubectl run health-check --image=curlimages/curl --rm -it --restart=Never -- \
  curl -f http://connector-cp:3000/health

echo "Disaster recovery completed successfully"
```

## Security and Compliance

### 1. Security Scanning Pipeline

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM
  push:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run SAST with CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: typescript
      
      - name: Autobuild
        uses: github/codeql-action/autobuild@v2
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
      
      - name: Run dependency check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'connector'
          path: '.'
          format: 'SARIF'
      
      - name: Upload dependency check results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: reports/dependency-check-report.sarif
      
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/typescript
```

### 2. Compliance Automation

```yaml
# deployment/compliance/policy-as-code.yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: connector-security-policy
spec:
  validationFailureAction: enforce
  background: false
  rules:
    - name: require-security-context
      match:
        any:
        - resources:
            kinds:
            - Pod
            namespaces:
            - connector-*
      validate:
        message: "Security context is required"
        pattern:
          spec:
            securityContext:
              runAsNonRoot: true
              runAsUser: ">0"
    
    - name: require-resource-limits
      match:
        any:
        - resources:
            kinds:
            - Pod
            namespaces:
            - connector-*
      validate:
        message: "Resource limits are required"
        pattern:
          spec:
            containers:
            - name: "*"
              resources:
                limits:
                  memory: "?*"
                  cpu: "?*"
                requests:
                  memory: "?*"
                  cpu: "?*"
    
    - name: disallow-privileged
      match:
        any:
        - resources:
            kinds:
            - Pod
            namespaces:
            - connector-*
      validate:
        message: "Privileged containers are not allowed"
        pattern:
          spec:
            =(securityContext):
              =(privileged): "false"
            containers:
            - name: "*"
              =(securityContext):
                =(privileged): "false"
```

## Performance and Scaling

### 1. Load Testing

```javascript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests under 1s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function() {
  // Test catalog endpoint
  let catalogResponse = http.get(`${BASE_URL}/dsp/catalog`);
  check(catalogResponse, {
    'catalog status is 200': (r) => r.status === 200,
    'catalog response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  // Test negotiation endpoint
  let negotiationPayload = {
    '@context': 'https://w3id.org/dspace/v0.8/context.json',
    '@type': 'dspace:ContractRequestMessage',
    'dspace:providerPid': 'provider-123',
    'dspace:consumerPid': 'consumer-456',
    'dspace:offer': {
      '@type': 'odrl:Offer',
      '@id': 'offer-789',
      'odrl:target': 'asset-123',
      'odrl:permission': [{
        'odrl:action': 'odrl:use',
        'odrl:constraint': [{
          'odrl:leftOperand': 'odrl:purpose',
          'odrl:operator': 'odrl:eq',
          'odrl:rightOperand': 'research'
        }]
      }]
    }
  };

  let negotiationResponse = http.post(
    `${BASE_URL}/dsp/negotiations`,
    JSON.stringify(negotiationPayload),
    {
      headers: {
        'Content-Type': 'application/ld+json',
        'Authorization': 'Bearer ' + __ENV.TEST_TOKEN
      }
    }
  );

  check(negotiationResponse, {
    'negotiation status is 201': (r) => r.status === 201,
    'negotiation response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(1);
}
```

### 2. Auto-scaling Configuration

```yaml
# deployment/scaling/vertical-pod-autoscaler.yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: connector-cp-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: connector-cp
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: control-plane
      minAllowed:
        cpu: 100m
        memory: 128Mi
      maxAllowed:
        cpu: 2
        memory: 4Gi
      controlledResources: ["cpu", "memory"]
---
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: connector-dp-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: connector-dp
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: data-plane
      minAllowed:
        cpu: 200m
        memory: 256Mi
      maxAllowed:
        cpu: 4
        memory: 8Gi
      controlledResources: ["cpu", "memory"]
```

## Edge Deployment

### 1. Single-node Edge Configuration

```yaml
# deployment/edge/docker-compose.yml
version: '3.8'

services:
  connector-edge:
    image: ghcr.io/example/connector:latest-edge
    ports:
      - "3000:3000"  # Control Plane
      - "3001:3001"  # Data Plane
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://connector:password@postgres:5432/connector
      - REDIS_URL=redis://redis:6379
      - LOG_LEVEL=info
    volumes:
      - ./config:/app/config:ro
      - ./certs:/app/certs:ro
      - connector-data:/app/data
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=connector
      - POSTGRES_USER=connector
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U connector"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  # Optional: Local monitoring
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3003:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources:ro
    restart: unless-stopped

volumes:
  connector-data:
  postgres-data:
  redis-data:
  prometheus-data:
  grafana-data:

networks:
  default:
    name: connector-network
```

### 2. Edge Installation Script

```bash
#!/bin/bash
# scripts/install-edge.sh

set -e

INSTALL_DIR=${INSTALL_DIR:-/opt/connector}
SERVICE_USER=${SERVICE_USER:-connector}
CONFIG_DIR=${CONFIG_DIR:-/etc/connector}

echo "Installing Dataspace Connector Edge..."

# Create service user
if ! id "$SERVICE_USER" &>/dev/null; then
    useradd -r -s /bin/false -d "$INSTALL_DIR" "$SERVICE_USER"
fi

# Create directories
mkdir -p "$INSTALL_DIR"
mkdir -p "$CONFIG_DIR"
mkdir -p /var/log/connector
mkdir -p /var/lib/connector

# Download and extract binary
LATEST_VERSION=$(curl -s https://api.github.com/repos/example/connector/releases/latest | grep tag_name | cut -d '"' -f 4)
curl -L "https://github.com/example/connector/releases/download/$LATEST_VERSION/connector-edge-linux-x64.tar.gz" | tar -xz -C "$INSTALL_DIR"

# Set permissions
chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
chown -R "$SERVICE_USER:$SERVICE_USER" /var/log/connector
chown -R "$SERVICE_USER:$SERVICE_USER" /var/lib/connector
chmod +x "$INSTALL_DIR/bin/connector"

# Install systemd service
cat > /etc/systemd/system/connector.service << EOF
[Unit]
Description=Dataspace Connector
After=network.target
Wants=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
ExecStart=$INSTALL_DIR/bin/connector
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=connector
KillMode=mixed
KillSignal=SIGTERM

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/connector /var/lib/connector $CONFIG_DIR
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
EOF

# Create default configuration
cat > "$CONFIG_DIR/config.yaml" << EOF
server:
  host: 0.0.0.0
  port: 3000
  tls:
    enabled: false

database:
  url: postgresql://connector:password@localhost:5432/connector
  pool:
    min: 2
    max: 10

redis:
  url: redis://localhost:6379

logging:
  level: info
  format: json

identity:
  did: did:web:localhost:3000
  keyPath: $CONFIG_DIR/keys/private.pem
  certPath: $CONFIG_DIR/keys/cert.pem

policies:
  defaultPolicy: $CONFIG_DIR/policies/default.json

adapters:
  - type: http
    config:
      timeout: 30000
  - type: file
    config:
      basePath: /var/lib/connector/data
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable connector
systemctl start connector

echo "Connector installed successfully!"
echo "Configuration: $CONFIG_DIR/config.yaml"
echo "Logs: journalctl -u connector -f"
echo "Status: systemctl status connector"
```

## Operational Procedures

### 1. Health Check Endpoints

```typescript
// Health check implementation
export class HealthController {
  constructor(
    private database: Database,
    private redis: Redis,
    private config: Config
  ) {}

  @Get('/health')
  async health(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalServices()
    ]);

    const status = checks.every(check => check.status === 'fulfilled' && check.value.healthy)
      ? 'healthy' : 'unhealthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      version: this.config.version,
      checks: {
        database: checks[0].status === 'fulfilled' ? checks[0].value : { healthy: false, error: checks[0].reason },
        redis: checks[1].status === 'fulfilled' ? checks[1].value : { healthy: false, error: checks[1].reason },
        external: checks[2].status === 'fulfilled' ? checks[2].value : { healthy: false, error: checks[2].reason }
      }
    };
  }

  @Get('/ready')
  async readiness(): Promise<ReadinessStatus> {
    // Check if application is ready to serve traffic
    const ready = await this.checkReadiness();
    
    return {
      ready,
      timestamp: new Date().toISOString()
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    try {
      await this.database.query('SELECT 1');
      return { healthy: true, responseTime: Date.now() };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  private async checkRedis(): Promise<HealthCheck> {
    try {
      await this.redis.ping();
      return { healthy: true, responseTime: Date.now() };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}
```

This comprehensive deployment and DevOps strategy provides multiple deployment options, robust CI/CD pipelines, comprehensive monitoring, and operational procedures to ensure the connector can be deployed and operated reliably in various environments from edge to enterprise scale.
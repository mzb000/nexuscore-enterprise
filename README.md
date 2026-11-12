# NexusCore Enterprise Monorepo

> **Unified AI-Augmented Autonomous Commerce & Predictive Analytics Ecosystem**  
> *Demonstrating 92+ Production-Grade Technical Skills Across Backend, Frontend, Cloud/DevOps, Cybersecurity, AI/ML, Databases, and QA.*

---

## 🏛️ Architecture Overview

NexusCore Enterprise is built as an industrial-grade, cloud-native polyglot monorepo following strict **Clean Architecture**, **Domain-Driven Design (DDD)**, **Event-Driven CQRS**, and **Zero-Trust Security**.

```
nexuscore-enterprise/
├── apps/
│   └── storefront/                     # Next.js 15, React 19, Tailwind CSS, Zustand, AI Concierge
├── services/
│   ├── identity-service/               # Node.js 22, NestJS, OAuth2 PKCE, JWT RS256, Redis, Prisma
│   ├── order-service/                  # Go 1.23, DDD, Saga Orchestrator, Worker Pools, Redlock, Kafka
│   ├── catalog-service/                # Python 3.12, FastAPI, MongoDB, Elasticsearch 8.x, GraphQL
│   ├── payment-service/                # Java 21, Spring Boot 3.3, Virtual Threads, CQRS, Resilience4j
│   └── notification-service/           # Node.js 22, WebSockets, Kafka Consumer, Redis Pub/Sub
├── ml-ai/
│   └── rag-concierge/                  # Python 3.12, LangGraph Cyclical Agents, Hybrid Vector RAG
├── deploy/
│   ├── docker-compose.yml              # Local multi-service backing infrastructure
│   ├── k8s/base/                       # Kubernetes Deployments, Services, HPA, Istio strict mTLS
│   └── terraform/                      # AWS Multi-AZ VPC, EKS Cluster, Subnets IaC
├── tests/
│   ├── e2e-playwright/                 # End-to-End browser test automation suite
│   └── load-k6/                        # High-concurrency Black Friday stress testing
├── docker-compose.yml                  # Root compose wrapper
└── README.md                           # Master Documentation & Architecture Catalog
```

---

## 🚀 Quick Start (Local Development)

### 1. Launch Backing Services
```bash
# Starts PostgreSQL 16, Redis 7, Kafka + Zookeeper, MongoDB 7, Elasticsearch 8, and Qdrant
docker compose up -d
```

### 2. Run Microservices
- **Identity Service (Port 4001)**:
  ```bash
  cd services/identity-service && npm install && npm run start:dev
  ```
- **Order Service (Port 50051)**:
  ```bash
  cd services/order-service && go run cmd/server/main.go
  ```
- **Catalog Service (Port 8000)**:
  ```bash
  cd services/catalog-service && pip install -e . && uvicorn src.main:app --port 8000 --reload
  ```
- **Payment Service (Port 8082)**:
  ```bash
  cd services/payment-service && mvn spring-boot:run
  ```
- **AI Concierge (Port 8001)**:
  ```bash
  cd ml-ai/rag-concierge && pip install -e . && uvicorn src.main:app --port 8001 --reload
  ```
- **Next.js Storefront (Port 3000)**:
  ```bash
  cd apps/storefront && npm install && npm run dev
  ```

---

## 📊 92+ Production Skills Matrix

| Domain | Completed Module | Skills Verified |
| :--- | :--- | :--- |
| **Backend & APIs** | `services/order-service`, `services/identity-service`, `services/catalog-service` | FastAPI, NestJS, Go 1.23 Worker Pools, gRPC, REST RFC 7807, Strawberry GraphQL, WebSockets |
| **Distributed Systems** | `services/order-service`, `services/payment-service` | Saga Orchestration with Rollback, Redlock Distributed Mutex, Kafka Event Sourcing, CQRS |
| **Cybersecurity & IAM** | `services/identity-service`, `services/payment-service` | OAuth2 PKCE (`S256`), Asymmetric JWT RS256 Rotation, AES-256-GCM Column Encryption, Istio mTLS |
| **AI, ML & RAG** | `ml-ai/rag-concierge` | LangGraph Stateful Multi-Agent, Vector Search (Qdrant), Prompt Injection Guardrails |
| **Frontend & UI/UX** | `apps/storefront` | Next.js 15 App Router, React 19 Core, Tailwind CSS, Zustand, Accessible Design Tokens |
| **Databases & Cache** | `deploy/docker-compose.yml` | PostgreSQL 16, Redis 7.2, MongoDB 7.0, Elasticsearch 8.15.1 BM25, Qdrant Vector DB |
| **DevOps & Cloud** | `deploy/k8s/`, `deploy/terraform/` | Docker Multi-Stage, Kubernetes HPA, Istio PeerAuthentication, Terraform AWS VPC/EKS |
| **Testing & QA** | `tests/` | Playwright E2E browser automation, k6 extreme load profiling (2000 VUs) |

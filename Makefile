.PHONY: help up down test lint build clean

help:
	@echo "NexusCore Enterprise Monorepo Task Runner"
	@echo "Usage:"
	@echo "  make up          - Start all backing services (PostgreSQL, Redis, Kafka, MongoDB, ES, Qdrant)"
	@echo "  make down        - Stop all backing services"
	@echo "  make test        - Run test suites across all polyglot microservices"
	@echo "  make lint        - Run linters (Node, Go, Python, Java)"
	@echo "  make build       - Build all microservice containers via Docker"

up:
	docker compose up -d

down:
	docker compose down

test:
	@echo "=== Testing Order Service (Go) ==="
	cd services/order-service && go test -v ./...
	@echo "=== Testing Identity Service (Node) ==="
	cd services/identity-service && npm test --if-present
	@echo "=== Testing Catalog Service (Python) ==="
	cd services/catalog-service && pytest --maxfail=1 -q
	@echo "=== Testing Payment Service (Java) ==="
	cd services/payment-service && mvn test -DskipTests=false

lint:
	cd services/identity-service && npm run lint --if-present
	cd services/order-service && go vet ./...
	cd services/catalog-service && ruff check .

build:
	docker compose -f deploy/docker-compose.yml build

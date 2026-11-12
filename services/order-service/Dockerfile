# ==========================================
# Stage 1: Build & Optimization
# ==========================================
FROM golang:1.23-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates tzdata

COPY go.mod go.sum* ./
RUN go mod download || true

COPY . .

# Static compilation with stripped symbols for micro-footprint
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-s -w -extldflags '-static'" \
    -o /app/bin/order-server \
    ./cmd/server/main.go

# ==========================================
# Stage 2: Distroless Scratch Final Image
# ==========================================
FROM scratch AS runner

WORKDIR /app

# Import CA certs & timezone from builder
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /app/bin/order-server /app/order-server

EXPOSE 50051

ENTRYPOINT ["/app/order-server"]

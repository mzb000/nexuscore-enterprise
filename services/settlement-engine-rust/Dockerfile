# ==========================================
# Stage 1: Build & Optimization with Cargo
# ==========================================
FROM rust:1.82-alpine AS builder

WORKDIR /app

RUN apk add --no-cache musl-dev

COPY Cargo.toml ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release || true

COPY src ./src
RUN cargo build --release

# ==========================================
# Stage 2: Distroless Scratch
# ==========================================
FROM scratch AS runner

WORKDIR /app

COPY --from=builder /app/target/release/settlement-engine-rust /app/settlement-engine

EXPOSE 8085

ENTRYPOINT ["/app/settlement-engine"]

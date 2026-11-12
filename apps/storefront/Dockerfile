# ==========================================
# Stage 1: Dependencies & Build
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

RUN npm run build

# ==========================================
# Stage 2: Standalone Production Image
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -g 1001 -S nexusgroup && \
    adduser -S -u 1001 -G nexusgroup nexususer

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nexususer:nexusgroup /app/.next/standalone ./
COPY --from=builder --chown=nexususer:nexusgroup /app/.next/static ./.next/static

USER nexususer

EXPOSE 3000

CMD ["node", "server.js"]

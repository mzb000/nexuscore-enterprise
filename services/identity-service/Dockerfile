# ==========================================
# Stage 1: Build & Prisma Compilation
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build
RUN npm prune --production

# ==========================================
# Stage 2: Distroless/Hardened Runtime
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4001

RUN apk add --no-cache openssl libc6-compat && \
    addgroup -g 1001 -S nexusgroup && \
    adduser -S -u 1001 -G nexusgroup nexususer

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

USER nexususer

EXPOSE 4001

CMD ["node", "dist/main"]

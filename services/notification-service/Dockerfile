# ==========================================
# Stage 1: Build
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build
RUN npm prune --production

# ==========================================
# Stage 2: Distroless Runtime
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4002

RUN addgroup -g 1001 -S nexusgroup && \
    adduser -S -u 1001 -G nexusgroup nexususer

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

USER nexususer

EXPOSE 4002

CMD ["node", "dist/index.js"]

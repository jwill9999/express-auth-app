# ---- build stage ----
# Pin to a specific digest for supply-chain stability.
# To get the current digest: docker pull node:20-alpine && docker inspect node:20-alpine --format '{{index .RepoDigests 0}}'
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

COPY src ./src

RUN npm run build

# ---- runtime stage ----
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Run as non-root user (built into node:alpine images)
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]

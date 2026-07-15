FROM node:20-alpine AS base

WORKDIR /usr/src/app

# Reduz falhas ECONNRESET / timeout ao falar com registry.npmjs.org (rede instável).
# Cache do npm via BuildKit acelera rebuilds (Docker Compose v2 usa BuildKit por padrão).

FROM base AS contracts
COPY packages/contracts/package.json packages/contracts/package-lock.json* ./packages/contracts/
COPY packages/contracts/tsconfig.json ./packages/contracts/
COPY packages/contracts/src ./packages/contracts/src
WORKDIR /usr/src/app/packages/contracts
RUN npm config set fetch-retries 10 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000
RUN --mount=type=cache,target=/root/.npm \
    npm ci && npm run build && npm prune --omit=dev \
    && npm pkg delete scripts.prepare scripts.build

# Development stage
FROM base AS development
COPY --from=contracts /usr/src/app/packages/contracts ./packages/contracts
COPY package*.json ./
RUN npm config set fetch-retries 10 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Builder stage
FROM base AS builder
COPY --from=contracts /usr/src/app/packages/contracts ./packages/contracts
COPY package*.json ./
RUN npm config set fetch-retries 10 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage
FROM base AS production
COPY --from=contracts /usr/src/app/packages/contracts ./packages/contracts
COPY package*.json ./
RUN npm config set fetch-retries 10 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["npm", "start"]

FROM node:20-alpine AS base

WORKDIR /usr/src/app

COPY package*.json ./

# Reduz falhas ECONNRESET / timeout ao falar com registry.npmjs.org (rede instável).
# Cache do npm via BuildKit acelera rebuilds (Docker Compose v2 usa BuildKit por padrão).

# Development stage
FROM base AS development
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
RUN npm config set fetch-retries 10 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/package*.json ./
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["npm", "start"]

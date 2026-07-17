# syntax=docker/dockerfile:1

ARG NODE_VERSION=22-alpine
ARG PNPM_VERSION=11.1.2

# shared pnpm toolchain
FROM node:${NODE_VERSION} AS pnpm-base
ARG PNPM_VERSION
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# production dependencies
FROM pnpm-base AS deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN --mount=type=cache,id=praktis-frontend-pnpm,target=/pnpm/store \
    PNPM_CONFIG_STRICT_DEP_BUILDS=false \
    pnpm install --frozen-lockfile --store-dir /pnpm/store

# development
FROM pnpm-base AS dev
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV WATCHPACK_POLLING=1000
ENV CHOKIDAR_USEPOLLING=true
ENV CHOKIDAR_INTERVAL=1000
ENV PNPM_CONFIG_STRICT_DEP_BUILDS=false
EXPOSE 3000
CMD ["sh", "-c", "pnpm install --frozen-lockfile --prefer-offline --store-dir /pnpm/store && exec pnpm dev --hostname 0.0.0.0 --webpack"]

# builder
FROM deps AS builder
COPY . .
RUN --mount=type=cache,id=praktis-frontend-next,target=/app/.next/cache \
    pnpm build

# runner
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

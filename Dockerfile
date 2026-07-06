# Multi-stage build producing a minimal self-contained Next.js server.
# Runs anywhere a container runs: Fly.io, Cloud Run, ECS, k8s, a VPS.

FROM node:22-alpine AS base

# --- deps: install with the node-modules linker (Next standalone tracing
# --- doesn't understand Yarn PnP's zip-based layout).
FROM base AS deps
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases .yarn/releases
ENV YARN_NODE_LINKER=node-modules \
    YARN_ENABLE_GLOBAL_CACHE=true
RUN corepack enable && yarn install --immutable

# --- builder: compile the production bundle.
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV YARN_NODE_LINKER=node-modules \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && yarn build

# --- runner: only the standalone output + static assets, non-root user.
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

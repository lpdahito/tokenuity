# syntax=docker/dockerfile:1

# ---- Stage 1: dependencies ----
FROM node:24-bookworm-slim AS deps
WORKDIR /app

RUN corepack enable

# Manifests only — cached until a package.json or the lockfile changes
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/explorer/package.json ./apps/explorer/
COPY packages/evmole/package.json ./packages/evmole/

RUN pnpm install --filter explorer... --frozen-lockfile


# ---- Stage 2: build ----
FROM node:24-bookworm-slim AS builder
WORKDIR /app

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/explorer/node_modules ./apps/explorer/node_modules
COPY --from=deps /app/packages/evmole/node_modules ./packages/evmole/node_modules

COPY . .

# evmole first — explorer's tsc needs its .d.ts to typecheck
RUN pnpm --filter evmole build
RUN pnpm --filter explorer build

# Self-contained production subtree: flat node_modules, prod deps only
RUN pnpm --filter explorer deploy --prod /app/out


# ---- Stage 3: runtime ----
FROM node:24-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/out ./

USER node
CMD ["node", "./dist/app.js"]
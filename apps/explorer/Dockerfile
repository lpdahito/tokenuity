# syntax=docker/dockerfile:1

# ---- Stage 1: dependencies ----
FROM node:24-bookworm-slim AS deps
WORKDIR /app

RUN corepack enable

# Manifests only — this layer caches until a package.json or the lockfile changes
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/explorer/package.json ./apps/explorer/
COPY packages/evmole/package.json ./packages/evmole/
COPY packages/store/package.json ./packages/store/
COPY packages/types/package.json ./packages/types/

RUN pnpm install --filter explorer... --frozen-lockfile


# ---- Stage 2: dev (hot reload) ----
# Stops before the build. Source is bind-mounted by docker-compose.dev.yml
# and tsx watch restarts the process on save.
FROM node:24-bookworm-slim AS dev
WORKDIR /app

RUN corepack enable

COPY --from=deps /app ./
COPY . .

# evmole's dist is baked in — it is a vendored fork and does not change while
# you work, so it is not rebuilt on every edit
RUN pnpm --filter evmole build

ENV NODE_ENV=development
CMD ["pnpm", "--filter", "explorer", "dev"]


# ---- Stage 3: build ----
FROM node:24-bookworm-slim AS builder
WORKDIR /app

RUN corepack enable

# Whole installed tree in one copy — no per-package list to maintain
COPY --from=deps /app ./

COPY . .

# evmole first — the explorer needs its dist to resolve the import
RUN pnpm --filter evmole build

# tsup strips types without checking them, so check separately
RUN pnpm --filter explorer typecheck
RUN pnpm --filter explorer build

# Self-contained production subtree: flat node_modules, prod deps only
RUN pnpm --filter explorer deploy --prod /app/out


# ---- Stage 4: runtime ----
FROM node:24-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/out ./

USER node
CMD ["node", "./dist/app.js"]
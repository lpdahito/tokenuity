@AGENTS.md

# Tokenuity

Momentum-tracking platform for newly launched tokens. Tokenuity watches tokens from the moment they launch and measures whether they are gaining traction: holder count deltas, volume deltas and price, filtered for fake activity (wash trading, holder concentration).

It is **not** a PnL tool and not a smart-contract risk scanner. Tracked tokens come from a launchpad, so contract code is standard and is not analyzed.

## Current scope (MVP)

- **Chain: BSC only.** Multi-chain (Robinhood Chain, Base and others) is planned for later. Don't add chain abstractions, chain-ID switches or config for other chains yet.
- **Launchpad: four.meme only.** Tokens are tracked from creation on four.meme, not from bonding-curve graduation, so holder formation is captured from the first block.
- **Price during the bonding-curve phase is deferred.** Build the core pipeline first. Pre-graduation price will come later from four.meme's own buy/sell events; post-graduation price comes from PancakeSwap swaps.

## Repository layout

```
tokenuity/
├── apps/
│   ├── web/        # Next.js front end (App Router, TypeScript, Tailwind v4)
│   └── explorer/   # Data-gathering service (the pipeline below)
└── packages/       # Code shared between web and explorer
```

- **Shared code belongs in `packages/`**, never duplicated between apps. Priorities for extraction:
  1. MongoDB schemas and TypeScript types (token model, holder, check). Explorer writes them, web reads them.
  2. Shared config (contract addresses, thresholds, intervals).
  3. Reusable engines: chain ingestion, address graph.
- Keep the monorepo-with-internal-packages structure. Don't split things into separate microservices or repos.

## Explorer: pipeline architecture

One service, one Docker image, one entry point (`apps/explorer/app.ts`). Each function runs in **its own container** from that image. An environment variable, whose value matches a function name, selects which function the container runs.

<!-- TODO: fill in the actual env var name -->

| Function           | Interval | Cursor | Purpose |
|--------------------|----------|--------|---------|
| `findPools`        | 10 s     | Yes    | Discover new tokens. Currently detects PancakeSwap v2 `PairCreated` (graduation); being repurposed to detect token launch on four.meme. Graduation must still be recorded as an event on the token. |
| `findSwaps`        | 10 s     | Yes    | Detect whether a token is active and derive price from swaps. No address filter, so every swap on the chain comes back: keep `blockSpread` small. |
| `findTransfers`    | 10 s     | Yes    | Fold ERC-20 `Transfer` logs into holder balances. Never scans past the `findPools` cursor. Holder writes and cursor advance run in one transaction. |
| `computeTokenData` | 30 s     | No     | Aggregate data and write the results onto the token model. |
| `cleanUp`          | 5 min    | No     | Remove holder data for inactive tokens (see Retention). |

### Scanner rules (findPools, findSwaps, findTransfers)

- **One cursor per scanner** in the `cursors` collection (`type`, `lastBlock`). No TTL: this is permanent state. The check records the scanned range as telemetry only.
- **The same `CheckTypes` value** is used for `getLastBlock`, `advanceCursor` and `Check.create`. Mixing them is the easiest bug to introduce when copying a scanner.
- **Range math lives in `nextBlockRange(head, lastBlock, spread)`.** On the first run (null cursor), it looks back one spread from the head.
- **Advance the cursor even when a range has no logs.** Otherwise it gets stuck.
- **Advance only after the range's writes succeed.** On error, don't advance; the range is retried next tick.
- **Writes must be safe to re-run.** Pools and swaps use upserts. Holder balances are *not* idempotent (read + add), so `updateHoldersFromTransfers` and `advanceCursor` share one Mongo transaction.
- **`findTransfers` caps its head at the `findPools` cursor,** so every token exists before its transfers are scanned, including the mint.
- **Jobs called inside a transaction must throw, not swallow errors.** A swallowed error commits partial writes and advances the cursor past lost data.

### Pipeline rules

- **Validate the function env var at startup.** Crash loudly if it is missing or doesn't match a known function. A typo must never produce a container that silently does nothing.
- **Prefer self-scheduling loops over fixed intervals:** do the work, then wait N seconds from completion. This prevents overlapping runs (for example, two `findTransfers` runs writing the same holder documents).
- Every run writes a **check** (see below) that includes the function name, so a lagging function can be identified.

## Data model (MongoDB)

- **Holder**: wallet address + token address + balance.
- **Transfers are never stored.** `findTransfers` reads the logs, updates holder balances and discards the raw transfers. Keep it this way.
- **Check**: run telemetry written when a function finishes, recording the function name, new holders added, transfers processed and duration in ms. Checks have a **TTL index of about 24–25 h**, so no manual deletion is needed.
- **Token**: the model that `compute` writes aggregated metrics and scores onto.

### Indexing

The Mac Mini has a single disk and limited RAM shared with Mongo, and momentum queries are read-heavy over time windows. Index time-windowed collections on `{ tokenAddress, timestamp }`, and index holders on `{ tokenAddress, walletAddress }` and `{ tokenAddress, balance }` for concentration queries.

## Retention

- **Checks**: removed by TTL.
- **Holders**: not TTL'd. Deletion depends on token activity: data for a live token is never deleted.
- **Inactive token**: no trades for about 24 h or more. `cleanup` drops its holder data.
- Revived tokens (pushed on social media after going quiet) are out of scope for the MVP. Keep the database lean.

## Scoring direction

Use several scores instead of one blended number, so divergence stays visible. For example, rising volume with flat holders is a different signal from both rising together.

- **Volume momentum**: swap count and volume deltas.
- **Holder growth**: holder count deltas.
- **Distribution quality**: holder concentration and wash-trade filtering. Apply this as a confidence gate or multiplier on the other two scores rather than averaging it in.

Known design tension: wallet age, native-coin balance and wallet nonce all proxy the same sybil signal. Don't count them as independent inputs. Combine them into one feature or consume them from a shared clustering layer.

## Infrastructure

- Self-hosted on a **Mac Mini** with Docker Compose. This replaces the earlier AWS Fargate + MongoDB Atlas setup.
- Each explorer function runs in its own container. MongoDB runs in its own container as a replica set.
- Services share an **external Docker network**.
- Public exposure goes through a **Cloudflare tunnel**.

## Stack

Node.js, TypeScript, ethers.js, MongoDB, Next.js (App Router), Tailwind CSS v4.

## Front end (apps/web)

- Important: Don't touch design files.

## Deferred or open items (don't build unless asked)

- Bonding-curve price from four.meme buy/sell events.
- Periodic **holder snapshots** per token (token, timestamp, holder count, top-10 concentration). Because transfers aren't stored, historical holder deltas can only come from snapshots.
- A **tombstone** row for dropped tokens (address, last active, peak holders), so a revival can be recognized.
- Multi-chain support.

<!-- TODO: add install / dev / build / test commands and package names once confirmed -->
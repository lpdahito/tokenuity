@AGENTS.md

# Tokenuity — web
 
Next.js frontend and API layer for Tokenuity, a set of blockchain tools and DeFi analytics
covering Base (8453) for now.

## Where this sits
 
`apps/web` is one package in a pnpm monorepo. You are working inside it;
the rest is shown for context only. Do not edit anything outside
`apps/web`.
 
```
tokenuity/
├── apps/
│   ├── explorer/          blockchain scanner — one container per chain
│   └── web/               ← you are here
└── packages/
    ├── types/             shared interfaces — IToken, ITrader, ...
    ├── store/             Mongoose models + query accessors
    ├── chains/            ABIs, addresses, chain registry (web never imports)
    └── evmole/            vendored bytecode analysis fork (explorer only)
```

The explorer writes to MongoDB; web reads from it. They share nothing
but `types` and `store`. Both are already listed in `transpilePackages`
in `next.config.ts` — they ship raw TypeScript, not compiled output.
 
## Data access
 
All database access goes through accessors exported from
`@tokenuity/store`. Never import Mongoose or connect to Mongo directly.
 
```ts
import { getToken, getTokens } from '@tokenuity/store'
import type { IToken } from '@tokenuity/types'
```
 
Accessors handle their own connection — don't call `connect()` from a
page or route handler. If an accessor you need doesn't exist, say so
rather than writing the query here.
 
Composing several accessors into a page-shaped object belongs in `lib/`.
 
## Layout
 
No `src/` directory.
 
```
app/
  page.tsx                  server components
  token/[address]/page.tsx
  api/v1/**/route.ts        route handlers
components/                 anything that renders JSX
lib/                        hooks, composition, formatters, types
```
 
`@/` points at the package root: `@/lib/hooks/useDashboard`,
`@/components/Stats`.
 
## Next 16 conventions
 
- Server components by default. `'use client'` only for hooks, browser
  APIs, or event handlers.
- `params` and `searchParams` are **Promises** — `await` them. Same for
  `cookies()`, `headers()`, `draftMode()`. Most examples online show the
  Next 14 synchronous form; it throws at runtime here.
- Client components can't call `store` accessors. They fetch a route
  handler under `/api/v1/`.
- Pages showing live scanner data need `export const revalidate =
  <seconds>`. Route handlers the client polls need `export const dynamic
  = 'force-dynamic'`.
## Client-side data
 
Hooks go in their own file under `lib/hooks`, not inline in a component. A
component imports a hook and renders its result.
 
For polling, chain `setTimeout` after the response resolves — never
`setInterval`, which stacks requests when one is slow and can apply an
older response over a newer one. Abort in-flight requests in the effect
cleanup.
 
Pass server-fetched initial data down as a prop so first paint has real
content, rather than fetching on mount.
 
## Domain rules
 
- **Addresses are stored checksummed.** Mongo compares strings
  byte-for-byte, so normalize anything from a URL or user input with
  `getAddress()` before querying. Never use a case-insensitive query.
- **`chainId` is required on every query.** The same address exists on
  Base and BSC as different contracts.

## Styling
 
- Tailwind v4.
- No shadcn/ui — evaluated and rejected for this project.
 
## Working style
 
- Don't modify JSX, `className` strings, or CSS in existing components
  unless asked. Describe the change instead.
- Don't add dependencies without asking.
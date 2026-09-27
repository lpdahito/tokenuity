// apps/explorer/src/utils/blockRange.ts
export type BlockRange = { fromBlock: number; toBlock: number }

/**
 * Next block range to scan, or null if already caught up.
 * First run (no cursor) looks back one spread from the head.
 */
export function nextBlockRange(
  head: number,
  lastBlock: number | null,
  spread: number
): BlockRange | null {
  const fromBlock = lastBlock === null ? head - spread : lastBlock + 1
  if (fromBlock > head) return null

  const toBlock = Math.min(head, fromBlock + spread)
  return { fromBlock, toBlock }
}
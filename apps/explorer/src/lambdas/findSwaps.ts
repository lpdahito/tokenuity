
import { performance } from 'perf_hooks'

import { chain } from '../config/chain.js'
import { Logger } from '../config/logger.js'
import { providers } from '../config/provider.js'

import { nextBlockRange } from './../utils/blockRange.js'
import { formatCheck } from './../utils/formatCheck.js'

import { contracts } from '../contracts/contracts.js'

import updatePoolsFromSwaps from './../jobs/updatePoolsFromSwaps.js'

import * as models from '@tokenuity/store'
import { advanceCursor, getLastBlock } from '@tokenuity/store'

import { CheckTypes } from '@tokenuity/types'

const {
  CheckModel: Check,
} = models

type SwapSource = { topics: string[] }

// Resolved once at startup, not on every tick.
const SWAP_SOURCES: Record<string, SwapSource> = {
  bsc: {
    topics: [
      contracts.pancakeswapv2.swapEventSignature,
    ]
  },
  base: {
    topics: [
      contracts.uniswapv2.swapEventSignature,
      contracts.uniswapv3.swapEventSignature,
      contracts.uniswapv4.swapEventSignature,
    ]
  }
}

const source = SWAP_SOURCES[chain.name]

if (!source) {
  throw new Error(`[findSwaps] no swap sources configured for chain "${chain.name}"`)
}

export default async (
): Promise<void> => {
  const start = performance.now()
  let scanned: { fromBlock: number; toBlock: number; logCount: number } | null = null

  try {
    const head = await providers[0].getBlockNumber()
    const lastBlock = await getLastBlock(CheckTypes.findSwaps)

    const range = nextBlockRange(head, lastBlock, chain.blockSpread)
    if (!range) return

    const { fromBlock, toBlock } = range

    const logs = await providers[0].getLogs({
      fromBlock,
      toBlock,
      // address: [],
      topics: [ source.topics ],
    })

    if (logs.length) {
      await updatePoolsFromSwaps(logs, toBlock)
    }

    await advanceCursor(CheckTypes.findSwaps, toBlock)
    scanned = { fromBlock, toBlock, logCount: logs.length }
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    const execTime = ((performance.now() - start) / 1000).toFixed(2)

    try {
      const check = await Check.create({ type: CheckTypes.findSwaps, execTime, ...scanned })
      console.log(formatCheck(check))
    } catch (err) {
      Logger.err({ error: err, report: true })
    }
  }
}
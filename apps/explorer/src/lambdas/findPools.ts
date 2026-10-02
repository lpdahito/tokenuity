import { performance } from 'perf_hooks'

import { chain } from '../config/chain.js'
import addresses from './../config/addresses.js'
import { providers } from '../config/provider.js'

import { nextBlockRange } from './../utils/blockRange.js'
import { formatCheck } from './../utils/formatCheck.js'

import { contracts } from '../contracts/contracts.js'

import extractData from './../jobs/extractDataForFindPools.js'

import * as models from '@tokenuity/store'
import { advanceCursor, getLastBlock } from '@tokenuity/store'


import { CheckTypes, ICheck } from '@tokenuity/types'

const {
  CheckModel: Check,
} = models

type PoolSource = { addresses: string[]; topics: string[] }

// Resolved once at startup, not on every tick.
const POOL_SOURCES: Record<string, PoolSource> = {
  bsc: {
    addresses: [addresses.pancakeswap.v2.factory],
    topics: [contracts.pancakeswapv2.pairCreatedEventSignature],
  },
  base: {
    addresses: [
      addresses.uniswap.v2.factory,
      addresses.uniswap.v3.factory,
      addresses.uniswap.v4.poolManager,
    ],
    topics: [
      contracts.uniswapv2.pairCreatedEventSignature,
      contracts.uniswapv3.poolCreatedEventSignature,
      contracts.uniswapv4.poolManagerInitializeEventSignature,
    ],
  },
}

const source = POOL_SOURCES[chain.name]

if (!source) {
  throw new Error(`[findPools] no pool sources configured for chain "${chain.name}"`)
}

export default async (
): Promise<void> => {
  const start = performance.now()
  let scanned: { fromBlock: number; toBlock: number; logCount: number } | null = null

  try {
    const head = await providers[0].getBlockNumber()
    const lastBlock = await getLastBlock(CheckTypes.findPools)

    const range = nextBlockRange(head, lastBlock, chain.blockSpread)
    if (!range) return

    const { fromBlock, toBlock } = range

    const logs = await providers[0].getLogs({
      fromBlock,
      toBlock,
      address: source.addresses,
      topics: [ source.topics ],
    })

    if (logs.length) {
      await extractData(logs, toBlock)
    }

    await advanceCursor(CheckTypes.findPools, toBlock)
    scanned = { fromBlock, toBlock, logCount: logs.length }
  } catch (err: any) {
    console.log(err)
  } finally {
    const execTime = ((performance.now() - start) / 1000).toFixed(2)

    try {
      const check = await Check.create({ type: CheckTypes.findPools, execTime, ...scanned })
      console.log(formatCheck(check))
    } catch(err) {
      console.log(err)
    }
  }
}
import { performance } from 'perf_hooks'
import * as mongoose from 'mongoose'

import { chain } from '../config/chain.js'
import { providers } from '../config/provider.js'

import { nextBlockRange } from './../utils/blockRange.js'
import { formatCheck } from './../utils/formatCheck.js'

import { contracts } from '../contracts/contracts.js'

import updateHoldersFromTransfers from './../jobs/updateHoldersFromTransfers.js'

import * as models from '@tokenuity/store'
import { advanceCursor, getLastBlock } from '@tokenuity/store'

import { CheckTypes } from '@tokenuity/types'

const {
  CheckModel: Check,
  TokenModel: Token,
} = models

const topics = [
  contracts.erc20.transferSignature
]

export default async (
): Promise<void> => {
  const start = performance.now()
  let scanned: { fromBlock: number; toBlock: number; logCount: number; transferCount: number } | null = null

  try {
    const head = await providers[0].getBlockNumber()
    const poolsBlock = await getLastBlock(CheckTypes.findPools)

    if (poolsBlock === null) return   // findPools hasn't run yet, so wait for it

    // Load after reading the findPools cursor: findPools writes tokens before advancing it,
    // so every token up to poolsBlock is in this set. Deleted (inactive) tokens drop out.
    const tokens = await Token.find({ follow: true }, { address: 1, _id: 0 }).lean()
    const tracked = new Set(tokens.map(t => t.address.toLowerCase()))

    const lastBlock = await getLastBlock(CheckTypes.findTransfers)
    const range = nextBlockRange(Math.min(head, poolsBlock), lastBlock, chain.blockSpread)

    if (!range) return

    const { fromBlock, toBlock } = range

    const logs = await providers[0].getLogs({
      fromBlock,
      toBlock,
      topics: [ topics ],
    })

    // Topic-only getLogs returns every Transfer on the chain; keep tracked tokens only
    const trackedLogs = logs.filter(log => tracked.has(log.address.toLowerCase()))

    const session = await mongoose.startSession()

    try {
      await session.withTransaction(async () => {
        if (trackedLogs.length) await updateHoldersFromTransfers(trackedLogs, session)
        await advanceCursor(CheckTypes.findTransfers, toBlock, session)
      })
    } finally {
      await session.endSession()
    }

    scanned = { fromBlock, toBlock, logCount: logs.length, transferCount: trackedLogs.length }
  } catch (err: any) {
    console.log(err)
  } finally {
    const execTime = ((performance.now() - start) / 1000).toFixed(2)

    try {
      const check = await Check.create({ type: CheckTypes.findTransfers, execTime, ...scanned })
      console.log(formatCheck(check))
    } catch (err) {
      console.log(err)
    }
  }
}
import { performance } from 'perf_hooks'
import * as mongoose from 'mongoose'

import { chain } from '../config/chain.js'
import { Logger } from '../config/logger.js'
import { providers } from '../config/provider.js'

import { nextBlockRange } from './../utils/blockRange.js'

import { contracts } from '../contracts/contracts.js'

import updateHoldersFromTransfers from './../jobs/updateHoldersFromTransfers.js'

import * as models from '@tokenuity/store'
import { advanceCursor, getLastBlock } from '@tokenuity/store'

import { CheckTypes } from '@tokenuity/types'

const {
  CheckModel: Check,
} = models

const topics = [
  contracts.erc20.transferSignature
]

export default async (
): Promise<void> => {
  const start = performance.now()
  let scanned: { fromBlock: number; toBlock: number; logs: number } | null = null

  try {
    const head = await providers[0].getBlockNumber()
    const poolsBlock = await getLastBlock(CheckTypes.findPools)

    if (poolsBlock === null) return   // findPools hasn't run yet, so wait for it

    const lastBlock = await getLastBlock(CheckTypes.findTransfers)
    const range = nextBlockRange(Math.min(head, poolsBlock), lastBlock, chain.blockSpread)

    if (!range) return

    const { fromBlock, toBlock } = range

    const logs = await providers[0].getLogs({
      fromBlock,
      toBlock,
      // address: [],
      topics: [ topics ],
    })

    const session = await mongoose.startSession()

    try {
      await session.withTransaction(async () => {
        if (logs.length) await updateHoldersFromTransfers(logs, toBlock, session)
        await advanceCursor(CheckTypes.findTransfers, toBlock, session)
      })
    } finally {
      await session.endSession()
    }

    scanned = { fromBlock, toBlock, logs: logs.length }
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    const execTime = ((performance.now() - start) / 1000).toFixed(2)

    try {
      await Check.create({ type: CheckTypes.findTransfers, execTime, ...scanned })
    } catch (err) {
      Logger.err({ error: err, report: true })
    }
  }
}
import { performance } from 'perf_hooks'
import type { HydratedDocument } from 'mongoose'

import { chain } from '../config/chain.js'
import { Logger } from '../config/logger.js'
import addresses from './../config/addresses.js'
import { providers } from '../config/provider.js'

import { contracts } from '../contracts/contracts.js'

import { quoteToken } from './../helpers/pools.js'

import updateHoldersFromTransfers from './../jobs/updateHoldersFromTransfers.js'

import * as models from '@tokenuity/store'

import { CheckTypes, IPrice } from '@tokenuity/types'

const {
  CheckModel: Check,
  HolderModel: Holder
} = models

let execTime = '0'

export default async (
): Promise<void> => {
  const start = performance.now()

  let startBlock = 0
  let baseTokenPrice = BigInt(0)

  let price: HydratedDocument<IPrice> | null = null

  let topics = [
    contracts.erc20.transferSignature
  ]

  try {
    const endBlock = await providers[0].getBlockNumber()

    const latestUpdatedHolder = await Holder.find({}, '-_id block').sort({ block: -1 }).limit(1).lean()
    if (latestUpdatedHolder.length && latestUpdatedHolder[0].block) startBlock = latestUpdatedHolder[0].block + 1

    if (endBlock - startBlock > chain.blockSpread) {
      startBlock = endBlock - chain.blockSpread
    }

    let filter = {
      fromBlock: startBlock,
      toBlock: endBlock,
      address: [],
      topics: [ topics ]
    }

    const logs = await providers[0].getLogs(filter)
    // console.log(logs)
    console.log(logs.length)

    if (!logs.length) return

    await updateHoldersFromTransfers(logs, endBlock)
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    const end = performance.now()
    execTime = ((end - start) / 1000).toFixed(2)

    try {
      const check = await Check.create({
        type: CheckTypes.findTransfers,
        execTime
      })

      console.log(check)
    } catch (err) {
      Logger.err({ error: err, report: true })
    }
  }
}
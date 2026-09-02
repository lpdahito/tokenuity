import type { HydratedDocument } from 'mongoose'

import { chain } from '../config/chain.js'
import { Logger } from '../config/logger.js'
import addresses from './../config/addresses.js'
import { providers } from '../config/provider.js'

import { contracts } from '../contracts/contracts.js'

import updatePoolsFromSwaps from './../jobs/updatePoolsFromSwaps.js'

import * as models from '@tokenuity/store'

import { IPrice } from '@tokenuity/contracts'

const {
  PoolModel: Pool,
} = models

export default async (
): Promise<void> => {
  let startBlock = 0
  let baseTokenPrice = BigInt(0)

  let price: HydratedDocument<IPrice> | null = null

  let topics = [
    contracts.uniswapv2.swapEventSignature,
    // contracts.uniswapv3.poolCreatedEventSignature,
  ]

  switch (chain.name) {
    case 'base':
      topics = [
        contracts.uniswapv2.swapEventSignature,
        contracts.uniswapv3.swapEventSignature,
        contracts.uniswapv4.swapEventSignature,
        // contracts.uniswapv3.poolCreatedEventSignature,
      ]
      
      break;

    case 'bsc':
      topics = [
        contracts.pancakeswapv2.swapEventSignature,
        // contracts.pancakeswapv3.poolCreatedEventSignature
      ]
      
      break;
  }

  try {
    const endBlock = await providers[0].getBlockNumber()

    const latestCreatedPool = await Pool.find({}, '-_id block').sort({ block: -1 }).limit(1).lean()
    if (latestCreatedPool.length && latestCreatedPool[0].block) startBlock = latestCreatedPool[0].block + 1

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
    if (!logs.length) return

    await updatePoolsFromSwaps(logs, endBlock)
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  }
}
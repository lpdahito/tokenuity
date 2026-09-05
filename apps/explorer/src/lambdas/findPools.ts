import type { HydratedDocument } from 'mongoose'

import { chain } from '../config/chain.js'
import { Logger } from '../config/logger.js'
import addresses from './../config/addresses.js'
import { providers } from '../config/provider.js'

import { contracts } from '../contracts/contracts.js'

import extractData from './../jobs/extractDataForFindPools.js'

import * as models from '@tokenuity/store'


import { IPrice } from '@tokenuity/types'

const {
  PoolModel: Pool,
} = models

export default async (
): Promise<void> => {
  let startBlock = 0

  let logAddresses: string[] = []

  let topics = [
    contracts.uniswapv2.pairCreatedEventSignature,
    contracts.uniswapv3.poolCreatedEventSignature,
    contracts.uniswapv4.poolManagerInitializeEventSignature,
  ]

  switch (chain.name) {
    case 'base':
      topics = [
        contracts.uniswapv2.pairCreatedEventSignature,
        contracts.uniswapv3.poolCreatedEventSignature,
        contracts.uniswapv4.poolManagerInitializeEventSignature,
      ]

      logAddresses = [
        addresses.uniswap.v2.factory,
        addresses.uniswap.v3.factory,
        addresses.uniswap.v4.poolManager
      ]
      
      break;

    case 'bsc':
      topics = [
        contracts.pancakeswapv2.pairCreatedEventSignature,
        // contracts.pancakeswapv3.poolCreatedEventSignature
      ]

      logAddresses = [
        addresses.pancakeswap.v2.factory,
        // addresses.pancakeswap.v3.factory
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
      address: logAddresses,
      topics: [ topics ]
    }

    const logs = await providers[0].getLogs(filter)
    if (!logs.length) { return }

    await extractData(logs, endBlock)
  } catch (err: any) {
    console.log(err)
    Logger.err({ error: err, report: true })
  }
}
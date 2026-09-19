import type { HydratedDocument } from 'mongoose'

import { chain } from '../config/chain.js'
import { Logger } from '../config/logger.js'
import addresses from './../config/addresses.js'
import { providers } from '../config/provider.js'

import { contracts } from '../contracts/contracts.js'

import updateTransfersFromTransfers from './../jobs/updateTransfersFromTransfers.js'

import * as models from '@tokenuity/store'

import { IPrice } from '@tokenuity/types'

const {
  TokenModel: Token,
  TransferModel: Transfer,
} = models

export default async (
): Promise<void> => {
  let startBlock = 0
  let baseTokenPrice = BigInt(0)

  let price: HydratedDocument<IPrice> | null = null

  let topics = [
    contracts.erc20.transferSignature,
  ]

  try {
    const endBlock = await providers[0].getBlockNumber()

    const latestCreatedTransfer = await Transfer.find({}, '-_id block').sort({ block: -1 }).limit(1).lean()
    if (latestCreatedTransfer.length && latestCreatedTransfer[0].block) startBlock = latestCreatedTransfer[0].block + 1

    if (endBlock - startBlock > chain.blockSpread) {
      startBlock = endBlock - chain.blockSpread
    }

    const activeTokens = await Token.find({ follow: true }, '-_id address').lean()
    if (!activeTokens.length) return

    let filter = {
      fromBlock: startBlock,
      toBlock: endBlock,
      address: activeTokens.map(t => t.address),
      topics: [ topics ]
    }

    const logs = await providers[0].getLogs(filter)
    if (!logs.length) return

    await updateTransfersFromTransfers(logs, endBlock)
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  }
}
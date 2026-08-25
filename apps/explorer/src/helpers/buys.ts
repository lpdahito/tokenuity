import type { HydratedDocument } from 'mongoose'

import { Logger } from '../config/logger.js'

import * as models from '../models/models.js'

import type { IBuy, IToken, } from '../types.js'

const {
  BuyModel: Buy
} = models

export const findOrCreateBuy = async (
  // walletAddress: string,
  token: string,
  // tryCount: number,
  // randomString: string
): Promise<HydratedDocument<IBuy> | null> => {
  let buy: HydratedDocument<IBuy> | null = null

  try {
    buy = await Buy.findOne({
      tokenAddress: token
    })

    if (!buy) {
      buy = new Buy({
        tokenAddress: token,
        status: 'pending',
        attempts: 0,
        amount: '0',
        otherAmount: '0',
        liquidityInBase: '0',
        liquidityInUsd: 0,
        swapIndex: 0,
        messages: [],
      })

      await buy.save()
    }
  } catch(err) {
    Logger.err({ error: err, report: true })
  } finally {
    return buy
  }
}
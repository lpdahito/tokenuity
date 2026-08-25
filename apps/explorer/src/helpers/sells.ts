import type { HydratedDocument } from 'mongoose'

import { Logger } from '../config/logger.js'

import * as models from '../models/models.js'

import type { IToken, ISell } from '../types.js'

const {
  SellModel: Sell
} = models

export const findOrCreateSell = async (
  // walletAddress: string,
  token: string,
  // tryCount: number,
  multiple: number,
  // maxMultiple: number,
  // randomString: string
): Promise<HydratedDocument<ISell> | null> => {
  let sell: HydratedDocument<ISell> | null = null

  // if (multiple < maxMultiple) {
  //   maxMultiple = multiple
  // }

  try {
    sell = await Sell.findOne({
      tokenAddress: token
    })

    if (!sell) {
      sell = new Sell({
        // prices: [],
        multiple: 0,
        attempts: 0,
        txAttempts: 0,
        trigger: null,
        remaining: true,
        status: 'pending',
        goodMultiple: null,
        tokenAddress: token,
        lowestMultiple: multiple,
        highestMultiple: multiple,
        prevHighestMultiple: multiple,

        amount: '0',
        liquidityInBase: '0',
        liquidityInUsd: 0,
        messages: [],
      })

      await sell.save()
    }
  } catch(err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return sell
  }
}
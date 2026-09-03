// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/lambdas/serverless/sendUpdates.js").default()'

import type { HydratedDocument } from 'mongoose'

import { chain } from '../config/chain.js'
import { Logger } from '../config/logger.js'

import { getBaseTokenPrice, getVirtualPrice } from './../helpers/oracle.js'

import * as models from '@tokenuity/store'

import { IPrice } from './../types.js'

const {
  PriceModel: Price
} = models

export const findOrCreateLastPrice = async (
): Promise<HydratedDocument<IPrice> | null> => {
  let price: HydratedDocument<IPrice> | null = null

  try {
    price = await Price.findOne({}, '-_id').sort({ createdAt: -1 })

    if (!price) {
      const baseTokenPrice = await getBaseTokenPrice()

      price = new Price({
        baseToken: baseTokenPrice.toString()
      })

      if (chain.name === 'base') {
        const virtualPrice = await getVirtualPrice()
        price.virtual = virtualPrice.toString()
      }

      await price.save()
    }
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return price
  }
}
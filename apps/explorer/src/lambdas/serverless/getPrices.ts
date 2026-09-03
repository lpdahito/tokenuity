// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/lambdas/serverless/sendUpdates.js").default()'

import * as mongoose from 'mongoose'

import { chain } from '../../config/chain.js'
import { databaseUrl } from '../../config/databaseUrl.js'

import { getBaseTokenPrice, getVirtualPrice } from '../../helpers/oracle.js'

import * as models from '@tokenuity/store'

const {
  PriceModel: Price
} = models

export default async (
): Promise<void> => {
  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(databaseUrl, { autoIndex: false })

    const baseTokenPrice = await getBaseTokenPrice()

    let price = new Price({
      baseToken: baseTokenPrice.toString()
    })

    if (chain.name === 'base') {
      const virtualPrice = await getVirtualPrice()
      price.virtual = virtualPrice.toString()
    }

    await price.save()
  } catch (err: any) {
    console.log(err)
  } finally {
    await mongoose.disconnect()
  }
}
// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/pools/getFirstSwaps.js").default()'
// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=56 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/pools/getFirstSwaps.js").default()'

import * as mongoose from 'mongoose'
import * as models from '@tokenuity/store'

import { databaseUrl } from './../../config/databaseUrl'

import { compute } from './../../helpers/pools.js'

const {
  BuyModel: Buy,
  PoolModel: Pool,
} = models

export default async () => {
  const tokenAddress = '0x5D7A0C155C73d47CA0283b3D883dCd0E53e24444'

  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(databaseUrl)

    const buy = await Buy.findOne({ tokenAddress })
    if (!buy) { return }

    const swapIndex = buy.swapIndex

    const pool = await Pool.findOne({
      $or:[
        { token0: tokenAddress }, { token1: tokenAddress }
      ]
    })

    if (!pool) { return }

    const computations = compute(pool)
    const price = computations?.prices[swapIndex]

    console.log('swapIndex:', swapIndex)
    console.log(computations?.sequences)
  } catch (err: any) {
    console.log(err)
  } finally {
    mongoose.disconnect()
  }
}
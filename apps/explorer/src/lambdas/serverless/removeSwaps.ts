import * as mongoose from 'mongoose'
import * as models from '@tokenuity/store'

import addresses from '../../config/addresses.js'
import { databaseUrl } from '../../config/databaseUrl.js'

const {
  LogModel: Log,
  PoolModel: Pool,
  PriceModel: Price,
  CheckModel: Check,
  TokenModel: Token,
  TokenSwapModel: TokenSwap
} = models

export default async (): Promise<void> => {
  let ceiling = Math.floor(Date.now() / 1000)

  let oneHour = (60 * 60)
  let thirtyMins = (60 * 30)
  let oneWeek = (((60 * 60) * 24) * 7)
  let twentyFourHours = ((60 * 60) * 24)

  let unremovedTokens = addresses.tokens.popular
    .concat(addresses.tokens.stable)
    .concat(addresses.tokens.removed)

  unremovedTokens.unshift(addresses.tokens.base)

  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(databaseUrl, { autoIndex: false })

    // Remove logs
    await Log.deleteMany({ createdAt: { $lt: (ceiling - oneHour) } })

    // Remove checks
    await Check.deleteMany({ createdAt: { $lt: (ceiling - twentyFourHours) } })

    // Remove prices
    await Price.deleteMany({ createdAt: { $lt: (ceiling - twentyFourHours) } })

    // Remove swaps
    await TokenSwap.deleteMany({ timestamp: { $lt: (ceiling - thirtyMins) } })

    let tokenFilter = {
      address: { $nin: unremovedTokens },
      lastSwap: { $lt: (ceiling - oneWeek) }
    }

    let tokens = await Token.find(tokenFilter).limit(500)
    let tokenAddresses = tokens.map(t => t.address)

    // Remove pools
    let poolResp = await Pool.deleteMany({
      $or:[
        { token0: { $in: tokenAddresses } },
        { token1: { $in: tokenAddresses } }
      ]
    })

    // Remove tokens
    if (poolResp.deletedCount) {
      await Token.deleteMany({
        address: { $in: tokenAddresses }
      })
    }
  } catch (err: any) {
    console.log(err.message)
  } finally {
    await mongoose.disconnect()
  }
}
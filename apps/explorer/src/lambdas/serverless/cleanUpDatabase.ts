// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/lambdas/serverless/cleanUpDatabase.js").default()'

import * as mongoose from 'mongoose'
import * as models from '@tokenuity/store'

import { databaseUrl } from '../../config/databaseUrl.js'

const {
  LogModel: Log,
  BuyModel: Buy,
  PoolModel: Pool,
  SellModel: Sell,
  PriceModel: Price,
  CheckModel: Check,
  TokenModel: Token,
  HoldingModel: Holding,
  TokenSwapModel: TokenSwap,
  PortfolioBalanceModel: PortfolioBalance
} = models

export default async (): Promise<void> => {
  let ceiling = Math.floor(Date.now() / 1000)

  let oneHour = (60 * 60)
  let thirtyMins = (60 * 30)
  let oneWeek = (((60 * 60) * 24) * 7)
  let twentyFourHours = ((60 * 60) * 24)

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

    // Remove portfolio balances
    await PortfolioBalance.deleteMany({ createdAt: { $lt: (ceiling - twentyFourHours) } })

    // Keep last 100 holdings
    let holdingsToKeep = await Holding.find({}).sort({ createdAt: -1 }).limit(1000)
    const tokensToKeep = holdingsToKeep.map(h => h.address)

    // Remove pools
    await Pool.deleteMany({
      createdAt: { $lt: (ceiling - twentyFourHours) },
      token0: { $nin: tokensToKeep }, token1: { $nin: tokensToKeep }
    })

    // Remove tokens
    await Token.deleteMany({
      createdAt: { $lt: (ceiling - twentyFourHours) },
      address: { $nin: tokensToKeep }
    })

    // Remove buys
    let buys = await Buy.find({
      tokenAddress: { $nin: tokensToKeep },
      createdAt: { $lt: (ceiling - oneWeek) }
    }).limit(200)

    let buyAddresses = buys.map(b => b.tokenAddress)
    await Buy.deleteMany({ tokenAddress: { $in: buyAddresses } })
    // console.log('buyResp.deletedCount:', buyResp.deletedCount)

    // Remove sells
    let sells = await Sell.find({
      tokenAddress: { $nin: tokensToKeep },
      createdAt: { $lt: (ceiling - oneWeek) }
    }).limit(200)

    let sellAddresses = sells.map(s => s.tokenAddress)
    await Sell.deleteMany({ tokenAddress: { $in: sellAddresses } })
    // console.log('sellResp.deletedCount:', sellResp.deletedCount)

    // Remove holdings
    let holdings = await Holding.find({
      address: { $nin: tokensToKeep },
      createdAt: { $lt: (ceiling - oneWeek) }
    }).limit(200)

    let holdingAddresses = holdings.map(h => h.address)
    await Holding.deleteMany({ address: { $in: holdingAddresses } })
    // console.log('holdingResp.deletedCount:', holdingResp.deletedCount)
  } catch (err: any) {
    console.log(err.message)
  } finally {
    await mongoose.disconnect()
  }
}
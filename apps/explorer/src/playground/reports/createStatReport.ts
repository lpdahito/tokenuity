// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/reports/createStatReport.js").default()'
// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=56 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/reports/createStatReport.js").default()'

import * as mongoose from 'mongoose'
import * as models from './../../models/models.js'

import { databaseUrl } from './../../config/databaseUrl'

import { findOrCreateTradingParams } from './../../helpers/tradingParams.js'

import { balanceInUsd, growth, priceInUsd } from './../../utils/numbers.js'

import {
  CheckTypes, IBuy, IHolding, IPool, ISell, IToken, ISelector, ISnippet, IStatReport, Launchpads, Routers, SwapResponse
} from './../../types.js'

interface Data {
  growth: string
  txCount: number
  rugPulls: number
  successfulExits: number
  highestMultiple: number
}

const {
  BuyModel: Buy,
  SellModel: Sell,
  PoolModel: Pool,
  CheckModel: Check,
  TokenModel: Token,
  PriceModel: Price,
  HoldingModel: Holding,
  SelectorModel: Selector,
  StatReportModel: StatReport,
  PortfolioBalanceModel: PortfolioBalance,
} = models

export default async (
) => {
  const ceiling = Math.floor(Date.now() / 1000)

  const oneDayAgo = ceiling - ((60 * 60) * 24)
  const oneWeekAgo = ceiling - (((60 * 60) * 24) * 7)

  let txCount = 0
  let rugPulls = 0
  let successfulExits = 0
  let highestMultiple = 0
  let walletGrowth = '0.00'

  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(databaseUrl)

    const walletAddress = process.env.WALLET_ADDRESS!
    if (!walletAddress) { throw new Error("Portfolio not found") }

    const portfolioBalances = await PortfolioBalance.find({
      createdAt: { $gte: oneDayAgo }
    }, '-_id').sort({ createdAt: -1 }).lean()

    if (!portfolioBalances.length || portfolioBalances.length < 2) { return }

    const oldestPortfolioBalance = portfolioBalances[portfolioBalances.length - 1]
    const newestPortfolioBalance = portfolioBalances[0]

    const bookValue = oldestPortfolioBalance.body
    const marketValue = newestPortfolioBalance.body

    if (!bookValue) { return }
    if (!marketValue) { return }

    const porfolioGrowth = growth(
      bookValue, marketValue
    )

    walletGrowth = porfolioGrowth.value

    const holdings = await Holding
      .find({
        // wallet: walletAddress,
        createdAt: { $gte: oneDayAgo }
      }, '-_id').sort({ createdAt: -1 }).lean()

    if (!holdings.length) { return }

    txCount = holdings.length

    const addresses = holdings.map(h => h.address)

    const tokens = await Token.find({ address: { $in: addresses } })
      .limit(addresses.length).lean()

    const buys = await Buy.find({
      status: 'success', tokenAddress: { $in: addresses }
    }).sort({createdAt: -1}).limit(addresses.length).lean()

    const sells = await Sell.find({
      status: { $in: ['success'] }, tokenAddress: { $in: addresses }
    }).sort({createdAt: -1}).limit(addresses.length).lean()

    rugPulls = holdings.length - sells.length

    for (const sell of sells) {
      if (
        sell.goodMultiple
      ) {
        if (sell.goodMultiple > highestMultiple) {
          highestMultiple = sell.goodMultiple
        }

        if (sell.goodMultiple > 1) {
          successfulExits++
        }
      }
    }

    await StatReport.create({

    })
  } catch (err: any) {
    console.log(err)
  } finally {
    const statReport = await StatReport.create({
      txCount: txCount,
      rugPulls: rugPulls,
      growth: walletGrowth,
      successfulExits: successfulExits,
      highestMultiple: highestMultiple,
    })

    console.log(statReport)

    mongoose.disconnect()
  }
}
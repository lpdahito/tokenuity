// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/lambdas/serverless/createStatReport.js").default()'

import * as mongoose from 'mongoose'
import type { HydratedDocument } from 'mongoose'

import * as models from './../../models/models.js'

import { databaseUrl } from './../../config/databaseUrl'

import { sendDiscordMessage } from './../../helpers/discord.js'

import { balanceInUsd, growth, priceInUsd } from './../../utils/numbers.js'

import {
  CheckTypes, IStatReport
} from './../../types.js'

const {
  BuyModel: Buy,
  SellModel: Sell,
  CheckModel: Check,
  TokenModel: Token,
  HoldingModel: Holding,
  SelectorModel: Selector,
  StatReportModel: StatReport,
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

    const checks = await Check.find({
      type: CheckTypes.scanBuy,
      createdAt: { $gte: oneDayAgo }
    }, '-_id').sort({ createdAt: -1 }).lean()

    if (!checks.length || checks.length < 2) { return }

    const oldestCheck = checks[checks.length - 1]
    const newestCheck = checks[0]

    const bookValue = oldestCheck.portfolioBalance
    const marketValue = newestCheck.portfolioBalance

    if (!bookValue) { return }
    if (!marketValue) { return }

    const porfolioGrowth = growth(
      bookValue, marketValue
    )

    walletGrowth = porfolioGrowth.value

    if (porfolioGrowth.positive === -1 ) {
      walletGrowth = '-' + porfolioGrowth.value
    }

    const holdings = await Holding
      .find({
        wallet: walletAddress,
        createdAt: { $gte: oneDayAgo }
      }, '-_id').sort({ createdAt: -1 }).lean()

    if (!holdings.length) { return }

    txCount = holdings.length

    const addresses = holdings.map(h => h.address)

    const tokens = await Token.find({ address: { $in: addresses } })
      .limit(addresses.length).lean()

    const buys = await Buy.find({
      wallet: walletAddress, status: 'success', tokenAddress: { $in: addresses }
    }).sort({createdAt: -1}).limit(addresses.length).lean()

    const sells = await Sell.find({
      wallet: walletAddress, status: { $in: ['success'] }, tokenAddress: { $in: addresses }
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

    const msg = createDiscordMessage(
      statReport
    )

    await sendDiscordMessage(msg)

    mongoose.disconnect()
  }
}

const createDiscordMessage = (
  statReport: HydratedDocument<IStatReport>
): string => {
  let string = ''

  string += `Growth: ${statReport.growth}%` + '\n'
  string += `Trade Count: ${statReport.txCount}` + '\n'
  string += `Rug Pulls: ${statReport.rugPulls}` + '\n'
  string += `Successful Exits: ${statReport.successfulExits}` + '\n'
  string += `Highest Multiple: ${statReport.highestMultiple}`
  
  return string
}
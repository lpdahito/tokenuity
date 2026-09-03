import * as mongoose from 'mongoose'

import { databaseUrl } from '../../config/databaseUrl.js'
import tradingParams from '../../config/tradingParams.js'

import * as models from '@tokenuity/store'

const {
  HoldingModel: Holding,
  PortfolioModel: Portfolio,
  BuyModel: Buy,
  SellModel: Sell,
} = models

export default async (): Promise<void> => {
  const ceiling = Math.floor(Date.now() / 1000)

  let params = tradingParams['default']
  let limits = params.limitsForSwaps

  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(databaseUrl)

    // Remove holdings
    await Holding.deleteMany({ wallet: { $in: ['0', '1'] }})
    console.log('Deleted holdings.')

    // Remove transactions
    await Buy.deleteMany({ wallet: { $in: ['0', '1'] }})
    console.log('Deleted transactions.')

    await Sell.deleteMany({ wallet: { $in: ['0', '1'] }})
    console.log('Deleted transactions.')

    // Remove old failed transactions
    await Buy.deleteMany({
      status: 'failed',
      createdAt: { $lt: (ceiling - (limits.tokenAgeMax * 2)) }
    })
    console.log('Deleted failed transactions (real portfolio).')

    const portfolios = await Portfolio.find({ wallet: { $in: ['0', '1'] }})
    for (let portfolio of portfolios) {
      portfolio.balance = '1000000000000000000'
      await portfolio.save()
    }

    await Holding.collection.dropIndexes()
    await Buy.collection.dropIndexes()
    await Sell.collection.dropIndexes()

    await Holding.collection.createIndex({ wallet: -1, address: 1 }, { unique: true })
    await Buy.collection.createIndex({ wallet: 1, tokenAddress: 1 })
    await Sell.collection.createIndex({ wallet: 1, tokenAddress: 1 })
  } catch (err: any) {
    console.log(err.message)
  } finally {
    mongoose.disconnect()
  }
}
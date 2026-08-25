// docker run -it --rm --link mongo-server --env-file .env -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/lambdas/serverless/updateTokenSwapCount.js").default()'

import { ethers } from 'ethers'

import * as mongoose from 'mongoose'

import addresses from './../../config/addresses.js'
import { wallets } from './../../config/provider.js'
import { databaseUrl } from './../../config/databaseUrl.js'

import { findOrCreateToken } from './../../helpers/tokens.js'
import { updatePortfolio } from './../../helpers/portfolios.js'

import { contracts } from './../../contracts/contracts.js'

import * as models from './../../models/models.js'

const {
  BuyModel: Buy,
  HoldingModel: Holding,
  PortfolioModel: Portfolio,
} = models

export default async (
): Promise<void> => {
  const ceiling = Math.floor(Date.now() / 1000)
  const floor = ceiling - (60 * 20) // 20 mins ago.

  let tokenAddresses: string[] = []

  const tokenuityContract = new ethers.Contract(
    addresses.tokenuity, contracts.tokenuity.abi, wallets[0]
  )

  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(databaseUrl, { autoIndex: false })

    const portfolio = await Portfolio.findOne({
      wallet: process.env.WALLET_ADDRESS!
    })

    if (!portfolio) {
      console.log('Portfolio not found'); return
    }

    const holdings = await Holding.find({
      createdAt: { $gte: floor }
    })

    for (const holding of holdings) {
      tokenAddresses.push(holding.address)
    }
    // if (!tokenAddresses.length) { return }

    const buys = await Buy.find({
      tokenAddress: { $nin: tokenAddresses },
      createdAt: { $gte: floor },
      status: 'success',
    })

    if (!buys.length) { return }

    const { token: baseToken } = await findOrCreateToken(addresses.tokens.base)
    if (!baseToken) return console.log('Could not find or create baseToken...')

    for (const buy of buys) {
      const { token: token } = await findOrCreateToken(addresses.tokens.base)

      if (!token) {
        console.log('Could not find or create baseToken...'); continue;
      }

      const balance = await tokenuityContract.balanceFor(token.address)

      await updatePortfolio(
        portfolio, baseToken, token, BigInt(buy.otherAmount), balance
      )
    }
  } catch (err: any) {
    console.log(err)
  } finally {
    await mongoose.disconnect()
  }
}
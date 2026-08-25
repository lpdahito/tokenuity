// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/lambdas/serverless/sendUpdates.js").default()'

import * as mongoose from 'mongoose'

import { chain } from './../../config/chain.js'
import { providers } from './../../config/provider.js'
import { databaseUrl } from './../../config/databaseUrl.js'

import * as models from './../../models/models.js'

const {
  PortfolioBalanceModel: PortfolioBalance
} = models

export default async (
): Promise<void> => {
  let balance = 0n
  const WALLET_ADDRESS = process.env.WALLET_ADDRESS!

  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(databaseUrl, { autoIndex: false })

    balance = await providers[0].getBalance(WALLET_ADDRESS)

    await PortfolioBalance.create({
      body: balance.toString(), wallet: WALLET_ADDRESS
    })
  } catch (err: any) {
    console.log(err)
  } finally {
    await mongoose.disconnect()
  }
}
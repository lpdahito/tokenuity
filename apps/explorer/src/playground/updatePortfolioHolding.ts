// import * as dotenv from 'dotenv'
// dotenv.config()

// process.env['NODE_ENV'] = 'production'

import * as mongoose from 'mongoose'
import * as models from '@tokenuity/store'

import { databaseUrl } from '../config/databaseUrl'

const {
  PortfolioModel: Portfolio,
  TokenModel: Token
} = models

export const main = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(databaseUrl)

    let portfolio = await Portfolio.updateOne(
      { address: '1', "holdings": { "$elemMatch": { "address": '0x1a1257e278F241DC34f8D8e5e80F4Fd8A77d8D20' }} },
      { $set: { "holdings.$.decimals": 6 }}

    )
    if (!portfolio) return
  } catch (err: any) {
    console.log(err.message)
  } finally {
    mongoose.disconnect()
  }
}

main()
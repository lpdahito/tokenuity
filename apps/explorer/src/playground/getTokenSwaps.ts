// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends/trends-explorer/dist:/app/dist explorer node ./dist/playground/getTokenSwaps.js

import { performance } from 'perf_hooks'

import * as mongoose from 'mongoose'

// // Local dependencies
import * as models from '../models/models'

import { databaseUrl } from '../config/databaseUrl'

const {
  TokenSwapModel: TokenSwap,
  HoldingModel: Holding,
} = models

const main = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(databaseUrl)

    let _time1 = performance.now()
    let swaps1 = await TokenSwap.find({}, '-_id buy amount priceInBase timestamp').lean()
    console.log(swaps1[0])
    
    console.log(performance.now() - _time1)

    console.log('-----')

    let _time0 = performance.now()
    let swaps0 = await TokenSwap.find({})
    console.log(swaps0[0])
    console.log(performance.now() - _time0)

    let holding = await Holding.findOne({}, 'token').lean()
    console.log(holding)
  } catch (err: any) {
    console.log(err)
  } finally {
    mongoose.disconnect()
  }
}

main()
// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/swaps/getQuoteForUniswapV4.js").default()'

import * as mongoose from 'mongoose'

import * as models from '@tokenuity/store'

import { wallets } from './../../config/provider.js'
import { databaseUrl } from './../../config/databaseUrl.js'

import { Swap } from './../../helpers/swaps.js'

import { DexProtocols, IPool, } from './../../types.js'

const {
  PoolModel: Pool
} = models

const amountIn = 1000000000000n

const poolAddress = '0x5fbc453304a3cccfbb1c69456659e4eb536240c97ccbe48fb0c16ca9294345a2'

export default async () => {
  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(databaseUrl, { autoIndex: false })

    const pool = await Pool.findOne({ address: poolAddress })
    if (!pool) { return console.log('Pool not found') }

    const swapParams = {
      pool, amountIn, buy: true, signer: wallets[0]
    }

    const swap = new Swap(swapParams)

    const amountOut = await swap.quote()

    console.log(amountOut)
  } catch (err: any) {
    console.log(err)
  } finally {
    await mongoose.disconnect()
  }
}
// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/pools/computePool.js").default()'
// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=56 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/pools/computePool.js").default()'

import * as mongoose from 'mongoose'
import * as models from './../../models/models.js'

import { databaseUrl } from './../../config/databaseUrl'

import { compute } from './../../helpers/pools.js'

const {
  PoolModel: Pool,
} = models

export default async () => {
  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(databaseUrl)

    const pool = await Pool.findOne({ swap0OutCount: { $gt: 0 }}).sort({lastSync: -1 })
    if (!pool) { return }

    // console.log(pool)

    const computations = compute(pool)

    console.log(computations)
  } catch (err: any) {
    console.log(err)
  } finally {
    mongoose.disconnect()
  }
}
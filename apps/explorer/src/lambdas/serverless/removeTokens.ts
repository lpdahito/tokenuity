// sls invoke --stage production --aws-profile tokenuity-swapper --function removeTokens
// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/lambdas/serverless/removeTokens.js").default()'

import * as mongoose from 'mongoose'
import * as models from '../../models/models.js'

import { databaseUrls } from '../../config/databaseUrl.js'
import { addresses } from '../../config/addresses.js'
// import { chain } from '../../config/chain.js'

import { removeTokenDups } from '../../helpers/tokens.js'
import { removePoolDups } from '../../helpers/pools.js'

const {
  PoolModel: Pool,
  TokenModel: Token,
} = models

export default async (): Promise<void> => {
  let ceiling = Math.floor(Date.now() / 1000)
  let floor = ceiling - (60 * 30) // 30 mins ago.
  let oneWeekAgo = ceiling - (60 * 60 * 24 * 7) // 1 week ago.
  let twoWeeksAgo = ceiling - (60 * 60 * 24 * 14) // 2 weeks ago.

  const chains = [ 8453 ]

  // const chainId = 1

  let poolsDeletedCount = 0
  let tokensDeletedCount = 0

  try {
    mongoose.set('strictQuery', false)

    for (let chain of chains) {
      await mongoose.connect(databaseUrls[chain.toString() as keyof typeof databaseUrls])

      // remove duplicates
      await removeTokenDups()
      await removePoolDups()

      const popularTokens = addresses[chain.toString() as keyof typeof addresses].tokens.popular
      const stableTokens = addresses[chain.toString() as keyof typeof addresses].tokens.stable
      const removedTokens = addresses[chain.toString() as keyof typeof addresses].tokens.removed

      let unremovedTokens = popularTokens.concat(stableTokens).concat(removedTokens)
      unremovedTokens.unshift(addresses[chain.toString() as keyof typeof addresses].tokens.base)

      let filter = {
        address: { $nin: unremovedTokens },
        lastSwap: { $lt: oneWeekAgo }
      }

      let tokens = await Token.find(filter).limit(1000)
      let tokenAddresses = tokens.map((t) => t.address)

      let poolResp = await Pool.deleteMany({
        $or:[
          { token0: { $in: tokenAddresses } },
          { token1: { $in: tokenAddresses } }
        ]
      })

      poolsDeletedCount = poolResp.deletedCount

      if (poolsDeletedCount) {
        let tokenResp = await Token.deleteMany({
          address: { $in: tokenAddresses }
        })  // *********** Perform holding check before deleting. ***********

        tokensDeletedCount = tokenResp.deletedCount
      }

      console.log('Pools deleted:', poolsDeletedCount, 'Tokens deleted:', tokensDeletedCount)

      await mongoose.disconnect()
    }
  } catch (err: any) {
    console.log(err.message)
  }
}
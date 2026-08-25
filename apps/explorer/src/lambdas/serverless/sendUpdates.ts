// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=56 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/lambdas/serverless/sendUpdates.js").default()'

import * as mongoose from 'mongoose'
import * as models from './../../models/models.js'

import { databaseUrls } from './../../config/databaseUrl.js'

import { human } from './../../helpers/utils.js'
import { sendDiscordMessage } from './../../helpers/discord.js'
import { findOrCreatePortfolio } from './../../helpers/portfolios.js'

import { BigNumber } from 'bignumber.js'

import { CheckTypes } from './../../types.js'

const {
  BuyModel: Buy,
  CheckModel: Check,
} = models

export default async (
): Promise<void> => {
  const ceiling = Math.floor(Date.now() / 1000)

  const sixHoursAgo = ceiling - ((60 * 60) * 6)

  const chains = [ 56, 8453 ]

  try {
    mongoose.set('strictQuery', false)

    for (let chain of chains) {
      await mongoose.connect(databaseUrls[chain.toString() as keyof typeof databaseUrls])

      let swapCount = 0
      let tokenCount = 0
      let poolCount = 0

      let coin = 'ETH'; let chainAbbr = 'Base'; let color = '🔵';
      if (chain === 56) {
        coin = 'BNB'; chainAbbr = 'BSC'; color = '🟡';
      }

      let msg = `Updates on ${color} ${chainAbbr}: \n`
      msg += '--\n'

      const poolExtractionChecks = await Check.find({
        type: CheckTypes.poolExtraction,
        createdAt: { $gte: sixHoursAgo, $lte: ceiling }
      }, '-_id').sort({ createdAt: -1 }).lean()

      let execTimePools = BigNumber('0')
      for (let check of poolExtractionChecks) {
        if (typeof check.tokenCount === 'number') {
          tokenCount += check.tokenCount
        }

        if (typeof check.poolCount === 'number') {
          poolCount += check.poolCount
        }

        execTimePools = BigNumber(check.execTime).plus(execTimePools)
      }

      let avgExecTimePools = (execTimePools.div(poolExtractionChecks.length)).toFixed(2)

      const swapExtractionChecks = await Check.find({
        type: CheckTypes.swapExtraction,
        createdAt: { $gte: sixHoursAgo, $lte: ceiling }
      }, '-_id').sort({ createdAt: -1 }).lean()

      let execTimeSwaps = BigNumber('0')
      for (let check of swapExtractionChecks) {
        if (typeof check.swapCount === 'number') {
          swapCount += check.swapCount
        }

        execTimeSwaps = BigNumber(check.execTime).plus(execTimeSwaps)
      }

      let avgExecTimeSwaps = (execTimeSwaps.div(swapExtractionChecks.length)).toFixed(2)

      msg += `Pools: ${human(poolCount.toString(), true)} \n`
      msg += `Swaps: ${human(swapCount.toString(), true)} \n`
      msg += `Tokens: ${human(tokenCount.toString(), true)} \n`
      msg += `Avg Ex Time (pools): ${avgExecTimePools} s \n`
      msg += `Avg Ex Time (swaps): ${avgExecTimeSwaps} s \n`
      msg += '--\n'

      let portfolio = await findOrCreatePortfolio(
        process.env.WALLET_ADDRESS!, false
      )
      if (!portfolio) return // console.log('Could not find or create portfolio...')

      const buyAttemptsCount = await Buy.countDocuments({ updatedAt: { $gte: sixHoursAgo } })
      const successfulBuyAttemptsCount = await Buy.countDocuments({ status: 'success', updatedAt: { $gte: sixHoursAgo } })

      if (portfolio) {
        msg += `Portfolio: \n`
        msg += `Balance: ${coin} ${human(portfolio.balance, false, 18)} \n`
        msg += `Buy Attempts: (${successfulBuyAttemptsCount}/${buyAttemptsCount}) \n`
      }

      await sendDiscordMessage(
        msg
      )

      await mongoose.disconnect()
    }
  } catch (err: any) {
    console.log(err)
  }
}
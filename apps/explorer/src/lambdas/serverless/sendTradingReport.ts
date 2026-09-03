// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=56 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/lambdas/serverless/sendTradingReport.js").default()'

import * as mongoose from 'mongoose'
import * as models from '@tokenuity/store'

import { databaseUrls } from './../../config/databaseUrl.js'

import generateTradingReport from './../../helpers/reports.js'
import { sendDiscordMessage } from './../../helpers/discord.js'

const {
  TradingReportModel: TradingReport,
} = models

export default async (
): Promise<void> => {
  const chains = [ 56, 8453 ]

  try {
    mongoose.set('strictQuery', false)

    for (let chain of chains) {
      await mongoose.connect(databaseUrls[chain.toString() as keyof typeof databaseUrls])

      const report = await generateTradingReport()

      console.log(report)

      await TradingReport.create({
        count: report.count,
        profit: report.profit,
        bestProfit: report.bestProfit,
        bestMultiple: report.bestMultiple,
        results: report.results
      })

      let chainAbbr = 'Base'; let color = '🔵';
      if (chain === 56) { chainAbbr = 'BSC'; color = '🟡' }

      let msg = `Trading report on ${color} ${chainAbbr}: \n`
      msg += '--\n'

      msg += `Count: ${report.count} \n`
      msg += `Profit: ${report.profit} \n`
      msg += '--\n'

      msg += `Best Profit: ${report.bestProfit} \n`
      msg += `Best Multiple: ${report.bestMultiple} \n`
      msg += '--\n'

      msg += JSON.stringify(report.results, null, 2)
      msg += '\n'

      await sendDiscordMessage(msg)

      await mongoose.disconnect()
    }
  } catch (err: any) {
    console.log(err)
  }
}
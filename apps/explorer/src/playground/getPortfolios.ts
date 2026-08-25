// // docker run -it --rm --link mongo-server --env-file .env --env PROVIDER=infura --env CHAIN_ID=1 -v /Users/lpdahito/Projects/tokenuity/trends/trends-explorer/dist:/app/dist explorer node ./dist/playground/getPortfolios.js

// import * as mongoose from 'mongoose'

// // // Local dependencies
// import * as models from '../models/models'

// import { chain } from '../config/chain'

// import { databaseUrl } from '../config/databaseUrl'

// const {
//   PortfolioModel: Portfolio,
//   TokenModel: Token
// } = models

// import type { HydratedDocument } from 'mongoose'
// import type { IPortfolio } from '../types'

// const main = async (): Promise<void> => {
//   let portfolio: HydratedDocument<IPortfolio> | null = null

//   try {
//     mongoose.set('strictQuery', false)
//     await mongoose.connect(databaseUrl)

//     portfolio = await Portfolio.findOne({ wallet: process.env.WALLET_ADDRESS! })
//     console.log('after portfolios')

//     if (!portfolio) return

//     console.log(portfolio.__v)
//     console.log('---------------')

//     portfolio.locked.push('some address')
//     await portfolio.save()

//     console.log(portfolio.__v)
//     console.log('---------------')

//     await updatePortfolio(portfolio)

//     portfolio.locked.push('some other address')
//     await portfolio.save()

//     console.log(portfolio.__v)
//     console.log('---------------')

//     portfolio.locked = []
//     await portfolio.save()
//   } catch (err: any) {
//     console.log(err)
//   } finally {
//     if (portfolio) console.log(portfolio.__v)
//     console.log('---------------')
//     mongoose.disconnect()
//   }
// }

// main()

// const updatePortfolio = async (
//   portfolio: HydratedDocument<IPortfolio>
// ): Promise<HydratedDocument<IPortfolio>> => {
//   try {
//     portfolio.locked.push('some address')
//     await portfolio.save()

//     console.log('******', portfolio.__v, '******')
//     console.log('---------------')
//   } catch (err: any) {
//     console.log(err)
//   } finally {
//     return portfolio
//   }
// }
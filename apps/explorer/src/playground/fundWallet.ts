// // import * as dotenv from 'dotenv'
// // dotenv.config()

// import * as mongoose from 'mongoose'
// import * as models from '../models/models'

// import { chain } from '../config/chain'

// import { databaseUrl } from '../config/databaseUrl'

// const {
//   PortfolioModel: Portfolio,
//   TokenModel: Token,
// } = models

// export const fundWallet = async (
//   amount: number | string = 10
// ): Promise<void> => {
//   try {
//     mongoose.set('strictQuery', false)
//     await mongoose.connect(databaseUrl)

//     let baseToken = await Token.findOne({ address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' })
//     let daiToken = await Token.findOne({ address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' })

//     if (!baseToken || !daiToken) {
//       return console.log('Tokens not found')
//     }

//     let addedAmount = (BigInt(amount) * (BigInt(10) ** BigInt(baseToken.decimals))).toString()

//     // Fetch portfolio
//     let portfolio = await Portfolio.findOne({})
//     if (!portfolio) {
//       // Create portfolio
//       portfolio = new Portfolio({
//         holdings: [
//           {
//             address: baseToken.address, // baseToken
//             name: baseToken.name,
//             symbol: baseToken.symbol,
//             amount: addedAmount,
//           }
//         ]
//       })
//     } else {
//       portfolio.holdings.map((token) => {
//         if (token.address === baseToken?.address) {
//           token.amount = (BigInt(token.amount) + BigInt(addedAmount)).toString()
//         }

//         return token
//       })

//       portfolio.updatedAt = Math.floor(Date.now() / 1000)
//     }

//     portfolio.markModified('holdings')
//     await portfolio.save()

//     console.log('Added:' + addedAmount + ' baseToken to portfolio')
//   } catch (err: any) {
//     console.log(err)
//   } finally {
//     mongoose.disconnect()
//   }
// }

// fundWallet()
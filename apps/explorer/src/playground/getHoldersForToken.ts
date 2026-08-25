// // docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/getHoldersForToken.js").default()'

// import * as mongoose from 'mongoose'
// import { BigNumber } from 'bignumber.js'

// import * as models from './../models/models.js'

// import addresses from './../config/addresses.js'
// import { databaseUrl } from './../config/databaseUrl.js'

// import { getHolderData } from './../helpers/tokens.js'
// import { getBaseTokenPrice } from './../helpers/oracle.js'

// const {
//   TokenModel: Token,
//   TokenSwapModel: TokenSwap
// } = models

// export default async () => {
//   const tokenAddress = '0x918f27a540d924eE07321638629017Be0fe1BD01' // AI Rig Comple (ARC)

//   let holders: string[] = []
//   const unwantedHolders = [
//     addresses.uniswap.v2.swapRouter02,
//     addresses.uniswap.v3.swapRouter02,
//     addresses.uniswap.v3.universalRouter,
//     addresses.pancakeswap.v2.router,
//     addresses.sushiswap.v2.swapRouter02
//   ]

//   try  {
//     console.log('connecting to database')
//     mongoose.set('strictQuery', false)
//     await mongoose.connect(databaseUrl, { autoIndex: false })

//     const baseTokenPrice = await getBaseTokenPrice()
//     if (baseTokenPrice === 0n) return console.log('Could not get baseToken price...')

//     const token = await Token.findOne({ address: tokenAddress })
//     if (!token) { return }

//     const swaps = await TokenSwap.find({
//       token: token.address
//     }, '-_id').sort({ timestamp: -1 }).lean()

//     if (!swaps.length) { return }

//     for (const swap of swaps) {
//       if (swap.buy) {
//         const recipient = swap.recipient

//         if (swap.otherToken === addresses.tokens.base) {
//           const amount = swap.otherAmount
//           const volume = BigNumber(amount).div(baseTokenPrice.toString()).toFixed(2)

//           // console.log(volume)
//         }

//         if (
//           recipient
//           && !unwantedHolders.includes(recipient)
//           && !holders.includes(recipient)
//         ) {
//           holders.push(recipient)
//         }
//       }
//     }

//     const holderData = await getHolderData(
//       token, holders, baseTokenPrice
//     )

//     // console.log(holderData)
//     // console.log(holders.length)
//   } catch (err: any)  {
//     if ('message' in err) {
//       console.log(err.message)
//     }
//   } finally {
//     mongoose.disconnect()
//     process.exit(0)
//   }
// }
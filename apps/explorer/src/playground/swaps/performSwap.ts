// // docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/swaps/performSwap.js").default()'
// // docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=56 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/swaps/performSwap.js").default()'

// import { ethers } from 'ethers'

// import * as mongoose from 'mongoose'
// import type { HydratedDocument } from 'mongoose'

// import addresses from './../../config/addresses'
// import { contracts } from './../../contracts/contracts'
// import { databaseUrl } from './../../config/databaseUrl'
// import { providers, wallets } from './../../config/provider'

// import { Swap } from './../../helpers/swaps'
// import { getBaseTokenPrice } from './../../helpers/oracle'
// import { findOrCreateToken } from './../../helpers/tokens'
// import { findOrCreatePortfolio, updatePortfolio } from './../../helpers/portfolios'

// import { DexProtocols, IToken, Routers } from './../../types'

// export default async () => {
//   let baseTokenPrice = BigInt(0)

//   let amountIn = BigInt(0)
//   let amountOut = BigInt(0)

//   let tokenOutBalanceBefore = BigInt(0)

//   let tokenIn: HydratedDocument<IToken> | null = null
//   let tokenOut: HydratedDocument<IToken> | null = null

//   try {
//     mongoose.set('strictQuery', false)
//     await mongoose.connect(databaseUrl)

//     baseTokenPrice = await getBaseTokenPrice()
//     if (baseTokenPrice === BigInt(0)) return console.log('Could not get baseToken price...')

//     const portfolio = await findOrCreatePortfolio(wallets[0].address)
//     if (!portfolio) return console.log('Could not find or create portfolio...')

//     const realEthBalance = await providers[0].getBalance(portfolio.wallet)

//     if (portfolio.balance !== realEthBalance.toString()) {
//       portfolio.balance = realEthBalance.toString()

//       await portfolio.save()
//     }

//     console.log('find token')

//     const { token } = await findOrCreateToken(
//       // '0x612870024D7e324ffdc8D2C61911ee4B84974444'
//       '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' // DAI on Base
//     )
//     if (!token) return console.log('Could not find or create token...')

//     const { token: baseToken } = await findOrCreateToken(
//       addresses.tokens.base // baseToken
//     )
//     if (!baseToken) return console.log('Could not find baseToken...')

//     const tokenContract = new ethers.Contract(
//       token.address, contracts.erc20.abi, wallets[0]
//     )

//     let buy = true

//     if (buy) {
//       amountIn = (baseTokenPrice * BigInt(1) / BigInt(20)) // USD $0.05

//       tokenOutBalanceBefore = await tokenContract.balanceOf(
//         addresses.tokenuity
//       )

//       tokenIn = baseToken; tokenOut = token;
//     } else {
//       amountIn = await tokenContract.balanceOf(
//         addresses.tokenuity
//       )

//       tokenIn = token; tokenOut = baseToken;
//       console.log(amountIn)
//     }

//     if (amountIn === BigInt(0)) {
//       return console.log('amountIn is 0')
//     }

//     amountIn = amountIn - BigInt(1)

//     const path = [
//       baseToken.address, token.address
//     ]

//     const swapParams = {
//       buy: buy,
//       fee: 3000,
//       path: path,
//       tickSpacing: 10,
//       signer: wallets[0],
//       amountIn: amountIn,
//       protocol: DexProtocols.uniswapv3,
//       hooks: '0x0000000000000000000000000000000000000000'
//     }

//     console.log(swapParams)

//     const swap = new Swap(swapParams)
//     amountOut = await swap.quote()
//     const calldata = await swap.encode()

//     if (!amountOut || amountOut === BigInt(0)) {
//       return console.log('amountOut is 0')
//     }

//     if (!calldata || calldata === '') {
//       return console.log('calldata is null')
//     }

//     const tx = await swap.execute({
//       estimateGas: true
//     })

//     if (buy) {
//       let tokenOutBalanceAfter = await tokenContract.balanceOf(addresses.tokenuity)
//       let tokenOutBalanceDelta = tokenOutBalanceAfter - tokenOutBalanceBefore

//       amountOut = tokenOutBalanceDelta < BigInt(0) ? -tokenOutBalanceDelta : tokenOutBalanceDelta
//     }

//     // await updatePortfolio(
//     //   portfolio, tokenIn, tokenOut, amountIn, amountOut
//     // )

//     console.log('amountOut', amountOut)
//     console.log(calldata)
//     console.log('--')
//     console.log(tx)
//   } catch(err: any) {
//     console.log(err)
//   } finally {
//     mongoose.disconnect()
//   }
// }
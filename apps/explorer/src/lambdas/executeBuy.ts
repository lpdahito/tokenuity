// import crypto from 'crypto'
// import { ethers } from 'ethers'
// import BigNumber from 'bignumber.js'

// import isLocal from './../config/isLocal.js'
// import { chain } from './../config/chain.js'
// import explorer from './../config/explorer.js'
// import { Logger } from './../config/logger.js'
// import addresses from './../config/addresses.js'
// import { providers, wallets } from './../config/provider.js'

// import { Swap } from './../helpers/swaps.js'
// import { findOrCreateBuy } from './../helpers/buys.js'
// import { lockedPercentage } from './../helpers/pools.js'
// import { updatePortfolio } from './../helpers/portfolios.js'
// import { sendDiscordMessage } from './../helpers/discord.js'
// import { getDexscreenerData } from './../helpers/dexscreener'
// import { findOrCreateCreator } from './../helpers/creators.js'
// import { isApeStore, isFourMeme } from './../helpers/launchpads.js'
// import { findOrCreateSnippet, getSourceCodeData, maxAmountForSnippets } from './../helpers/snippets.js'
// import { canBuyToken, canBuyAndSellToken, getHolderData, getPoolLiquiditiesForToken, getTokenCreator, getTokenSourceCode, isOwnerRenounced, isVerified } from './../helpers/tokens.js'

// import { contracts } from './../contracts/contracts.js'

// import * as models from './../models/models.js'

// const {
//   PoolModel: Pool,
//   PortfolioModel: Portfolio,
//   SnippetModel: Snippet,
// } = models

// import type { HydratedDocument } from 'mongoose'
// import { DexProtocols, ExecuteBuyParams, IBuy, IPool, ISnippet, Launchpads, Routers, SwapResponse } from '../types.js'

// let chainColor = '🔵'
// let baseCoin = 'ETH'

// switch (chain.name) {
//   case 'base':
//   chainColor = '🔵'; baseCoin = 'ETH'; break;

//   case 'bsc':
//   chainColor = '🟡'; baseCoin = 'BNB'; break;
// }

// export default async (
//   params: ExecuteBuyParams
// ): Promise<void> => {
//   if (isLocal) { return }

//   let start = new Date()
//   let ceiling = Math.floor(Number(start) / 1000)

//   const timeOptions: Intl.DateTimeFormatOptions = {
//     hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Toronto',
//   }

//   let formattedTime = new Intl.DateTimeFormat('en-US', timeOptions).format(start)
//   formattedTime = `[${formattedTime}] `

//   let save = false
//   let msg = 'initializing'
//   let router = Routers.default

//   let data = params.data
//   let limits = params.limits
//   let tokenIn = params.tokenIn
//   let tokenOut = params.tokenOut
//   let tryCount = params.tryCount
//   let skipChecks = params.skipChecks
//   let selectorData = params.selectorData
//   let baseTokenPrice = params.baseTokenPrice
//   let portfolioAddress = params.portfolioAddress
//   // let baseTokenPriceChange = params.baseTokenPriceChange

//   const fake = portfolioAddress !== process.env.WALLET_ADDRESS!
//   const dir = (fake ? 'fake_trxn' : 'trxn')

//   const token = tokenOut

//   const tokenAge = ceiling - token.createdAt

//   const MAX_ATTEMPTS = 140

//   const minTrustScore = 4
//   let trustScore: number | null = null

//   let buy: HydratedDocument<IBuy> | null = null
//   let randomString = crypto.randomBytes(16).toString('hex')

//   let amountIn = 0n
//   let amountOut = 0n
//   let portfolioBalance = 0n

//   let amountInMax = BigInt((BigNumber(baseTokenPrice.toString()).times(limits.amountIn)).toFixed(0))

//   let pool: HydratedDocument<IPool> | undefined = undefined
//   let liquidityInBase: bigint | undefined = undefined

//   let snippets: Array<HydratedDocument<ISnippet>> = []

//   let tokenHoldersWithOne = 0
//   let tokenHoldersWithTwenty = 0
//   let tokenHoldersWithOneHundred = 0
//   let tokenHoldersWithOneThousand = 0

//   let coinHoldersWithOne = 0
//   let coinHoldersWithTwenty = 0
//   let coinHoldersWithOneHundred = 0
//   let coinHoldersWithOneThousand = 0

//   let whales: string[] = []

//   const buyCountPct = data?.buyCountPct || 0

//   const tokenuityContract = new ethers.Contract(
//     addresses.tokenuity, contracts.tokenuity.abi, wallets[0]
//   )

//   const tokenOutContract = new ethers.Contract(
//     tokenOut.address, contracts.erc20.abi, wallets[0]
//   )

//   let txResponse: SwapResponse | null = null

//   try {
//     buy = await findOrCreateBuy(
//       portfolioAddress, token, tryCount, randomString
//     )

//     if (!buy) {
//       msg = 'Couldn\'t find or create buy'; return
//     }

//     /**
//      * Check addWLs and flipState selectors
//      */

//     const matchedSelectors = token.selectors?.filter((selector) => {
//       return ['71ce6b4a', '8e920351'].includes(selector)
//     })

//     if (
//       matchedSelectors
//       && matchedSelectors.length
//       && token.protocols?.includes(DexProtocols.uniswapv2)
//     ) {
//       let resp = await canBuyToken(token.address, baseTokenPrice)

//       if (resp.success) {
//         token.isScam = false; await token.save();
//       } else {
//         msg = formattedTime + 'inStart !== true'

//         buy.status = 'tracked'
//         buy.messages.unshift(msg)

//         await buy.save(); return
//       }
//     }

//     if (buy.status === 'pending') {
//       if (buy.randomString !== randomString) {
//         msg = formattedTime + 'Another buy is pending'; return
//       }
//     }

//     if (buy.status === 'success') {
//       msg = formattedTime + 'Buy is already successful'; return
//     }
    
//     if (buy.status === 'failed') {
//       if (buy.attempts >= MAX_ATTEMPTS) {
//         msg = buy.messages[0]; return
//       }
//     }

//     if (buy.status !== 'pending') {
//       buy.status = 'pending'
//       buy.randomString = randomString

//       await buy.save()
//     }

//     /** Make sure to save tx */
//     save = true
//     /** Make sure to save tx */

//     // if (/^FOMO/.test(token.name)) {
//     //   buy.attempts = MAX_ATTEMPTS - 1
//     //   msg = `Token is ${token.name}`; return
//     // }

//     let portfolio = await Portfolio.findOne({
//       wallet: portfolioAddress
//     })

//     if (!portfolio) {
//       msg = formattedTime + 'Portfolio not found'; return
//     }

//     portfolioBalance = BigInt(portfolio.balance)

//     if (token.ownerRenounced === false) {
//       // Check if owner has renounced ownership
//       const ownerRenounced = await isOwnerRenounced(token)

//       if (ownerRenounced) {
//         token.ownerRenounced = true; await token.save();
//       }
//     }

//     if (!skipChecks && limits.mustBeRenounced) {
//       if (!token.ownerRenounced) {
//         msg = formattedTime + 'Owner has not renounced token ownership'; return
//       }
//     }

//     let tokenSourceCode = ''

//     // 1. Make sure token is verified

//     if (token.verified === null) {
//       tokenSourceCode = await getTokenSourceCode(token.address)

//       token.verified = (tokenSourceCode.length ? true : false)
//       await token.save()
//     }

//     if (token.verified === false) {
//       msg = formattedTime + 'Token is not verified'; return
//     }

//     if (data?.growth < 10) {
//       msg = formattedTime + 'growth < 10%: ' + data.growth; return
//     }

//     if (
//       data?.volumeInUsdMedian !== null
//       && data?.volumeInUsdMedian !== undefined
//     ) {
//       if (data?.volumeInUsdMedian < 1) {
//         msg = formattedTime + 'volumeInUsdMedian < 1'; return
//       }

//       // if (data?.volumeInUsdMedian > 700) {
//       //   msg = formattedTime + 'volumeInUsdMedian > 700: ' + data.volumeInUsdMedian; return
//       // }
//     }

//     const dexscreener = await getDexscreenerData(
//       token.address
//     )

//     // Temporary
//     // if (
//     //   // !token.launchpad
//     //   !dexscreener.boosts
//     //   && !dexscreener.website
//     //   && !dexscreener.twitter
//     //   && !dexscreener.telegram
//     //   && !dexscreener.tiktok
//     //   && !dexscreener.discord
//     //   && !dexscreener.github
//     // ) {
//     //   // token.follow = false
//     //   // await token.save()

//     //   msg = formattedTime + '!Dexscreener'; return
//     // }

//     const pairAge = ceiling - dexscreener.createdAt
//     const tenMinutes = 60 * 10

//     if (pairAge > (tokenAge + tenMinutes)) {
//       msg = formattedTime + `pairAge > (tokenAge + tenMinutes), dexscreener.createdAt = ${dexscreener.createdAt}`; return
//     }

//     const pools = await Pool.find({
//       $or:[
//         { token0: token.address },
//         { token1: token.address }
//       ]
//     }).sort({ fee: 1 })
  
//     if (!pools.length) {
//       msg = formattedTime + 'Couldn\'t find any pools for buy'; return
//     }
  
//     let baseTokenPools = pools.filter((p) => { 
//       return (
//         p.token0 === addresses.tokens.base
//         || p.token1 === addresses.tokens.base
//       )
//     })

//     if (!baseTokenPools.length) {
//       msg = formattedTime + 'No pools with direct baseToken/Token pair'; return
//     }

//     // if (limits.protocols && !limits.protocols.includes(pool.protocol)) {
//     //   msg = 'Protocol is not allowed'; return
//     // }

//     const liquidities = await getPoolLiquiditiesForToken(
//       token, baseTokenPools, baseTokenPrice
//     )

//     liquidityInBase = liquidities.total
//     pool = liquidities.pools[0].pool

//     // if (pool.protocol === DexProtocols.pancakeswapv3) {
//     //   token.follow = false // *** Temporary ***

//     //   await token.save()

//     //   msg = formattedTime + 'pancakeswapv3 not supported'

//     //   let botMsg = msg
//     //   botMsg += `\n ${tokenOut.name} (${tokenOut.symbol})`

//     //   sendDiscordMessage(
//     //     chainColor + ' ' + botMsg
//     //   )
      
//     //   return
//     // }

//     if (liquidityInBase === 0n) {
//       msg = formattedTime + 'Liquidity is 0'; return
//     }

//     if (token.launchpad === null) {
//       let launchpad = Launchpads.unknown

//       switch (chain.id) {
//         case 56:
//           const _isFourMeme = await isFourMeme(token.address)
//           if (_isFourMeme) { launchpad = Launchpads.fourmeme }

//           break;

//         case 8453:
//           const _isApeStore = await isApeStore(token.address)
//           if (_isApeStore) { launchpad = Launchpads.apestore }

//           break;
//       }

//       token.launchpad = launchpad
//       await token.save()
//     }

//     if (!token.launchpad) {
//       // if (selectorData.unallowed.length) {
//       //   token.follow = false; await token.save();

//       //   msg = 'Token contains unwanted selectors'; return
//       // }

//       // 2. Make sure token snippets are safe

//       if (token.snippetSafe === null) {
//         if (!tokenSourceCode.length) {
//           tokenSourceCode = await getTokenSourceCode(token.address)
//         }

//         const sourceCodeData = getSourceCodeData(tokenSourceCode)

//         if (sourceCodeData === null) {
//           token.snippetSafe = false
//           token.follow = false

//           await token.save()

//           msg = formattedTime + 'Cannot parse token snippets'; return
//         } else if (sourceCodeData.snippets.length) {
//           token.compliant = false

//           for (let snippet of sourceCodeData.snippets) {
//             let _snippet = await findOrCreateSnippet(
//               token.address, snippet.scope, snippet.body
//             )

//             if (_snippet) {
//               if (_snippet.blocked) {
//                 token.snippetSafe = false;
//                 token.follow = false;

//                 await token.save()

//                 msg = formattedTime + 'Contains blocked snippet';
                
//                 return
//               }

//               if (_snippet.trustScore !== null) {
//                 if (
//                   trustScore === null
//                   || trustScore > _snippet.trustScore
//                 ) {
//                   trustScore = _snippet.trustScore
//                 }

//                 if (_snippet.trustScore < minTrustScore) {
//                   token.snippetSafe = false;
//                   token.follow = false;

//                   await token.save()

//                   msg = formattedTime + 'Trust score is ' + _snippet.trustScore

//                   let botMsg = msg
//                   botMsg += `\n ${tokenOut.name} (${tokenOut.symbol})`

//                   sendDiscordMessage(
//                     chainColor + ' ' + botMsg
//                   )

//                   return
//                 }
//               }

//               snippets.push(_snippet)
//             }
//           }

//           token.snippetSafe = true

//           await token.save()
//         } else if (!sourceCodeData.snippets.length) {
//           token.compliant = true
//           token.snippetSafe = true

//           await token.save()
//         }  

//       } else if (token.snippetSafe) {
//         snippets = await Snippet.find({ tokens: token })

//         for (let snippet of snippets) {
//           if (snippet.blocked) {
//             token.snippetSafe = false;
//             token.follow = false;

//             await token.save()

//             msg = formattedTime + 'Contains blocked snippet';
            
//             return
//           }

//           if (snippet.trustScore !== null) {
//             if (
//               trustScore === null
//               || trustScore > snippet.trustScore
//             ) {
//               trustScore = snippet.trustScore
//             }

//             if (snippet.trustScore < minTrustScore) {
//               token.snippetSafe = false;
//               token.follow = false;

//               await token.save()

//               msg = formattedTime + 'Trust score is ' + snippet.trustScore

//               return
//             }
//           }
//         }
//       }

//       if (token.snippetSafe === false) {
//         msg = formattedTime + 'Contains unsafe snippets'; return
//       }

//       for (let snippet of snippets) {
//         let tokens = snippet.tokens

//         if (tokens.includes(token.address)) {
//           tokens = tokens.filter(t => t !== token.address)
//         }

//         tokens.unshift(token.address)
//         if (tokens.length > 10) { tokens.pop() }

//         snippet.tokens = tokens
//         await snippet.save()
//       }
//     }

//     if (!token.creator) {
//       let tokenCreator = await getTokenCreator(token.address)
      
//       if (tokenCreator.length) {
//         token.creator = tokenCreator
//         await token.save()

//         const creator = await findOrCreateCreator(tokenCreator)

//         if (creator && creator.failCount) {
//           token.follow = false; await token.save()

//           msg = formattedTime + 'creator is a known scammer'; return
//         }
//       }

      
//     }

//     if (
//       pool.protocol === DexProtocols.uniswapv2
//       || pool.protocol === DexProtocols.pancakeswapv2
//     ) {
//       if (
//         pool.lockedPercentage === 0
//         || pool.lockedPercentage < limits.lockedPercentageMin
//       ) {
//         let percentage = await lockedPercentage(pool.address)

//         if (pool.lockedPercentage !== percentage) {
//           pool.lockedPercentage = percentage; await pool.save();
//         }
//       }
//     }
    
//     if (!skipChecks && pool.lockedPercentage < limits.lockedPercentageMin) {
//       msg = formattedTime + 'LP is not renounced'; return
//     }

//     // if (!skipChecks && buyCountPct < limits.buyCountPctMin) {
//     //   msg = 'buyCountPct < limits.buyCountPctMin';
//     //   // if (buy.attempts > 0) { buy.attempts = MAX_ATTEMPTS };
//     //   return
//     // }

//     // if (!skipChecks && buyCountPct > limits.buyCountPctMax) {
//     //   msg = 'buyCountPct > limits.buyCountPctMax';
//     //   // if (buy.attempts > 0) { buy.attempts = MAX_ATTEMPTS };
//     //   return
//     // }

//     const holdersFromBalances = await getHolderData(
//       token, data.holders, baseTokenPrice
//     )

//     for (const address in holdersFromBalances) {
//       const holder = holdersFromBalances[address]

//       const tokenBalance = Number(holder.tokenBalanceInUsd)
//       const coinBalance = Number(holder.coinBalanceInUsd)
      
//       if (tokenBalance >= 1) { tokenHoldersWithOne++ }
//       if (tokenBalance >= 20) { tokenHoldersWithTwenty++ }
//       if (tokenBalance >= 100) { tokenHoldersWithOneHundred++ }
//       if (tokenBalance >= 1000) { tokenHoldersWithOneThousand++ }

//       if (coinBalance >= 1) { coinHoldersWithOne++ }
//       if (coinBalance >= 20) { coinHoldersWithTwenty++ }
//       if (coinBalance >= 100) { coinHoldersWithOneHundred++ }
//       if (coinBalance >= 1000) { coinHoldersWithOneThousand++ }

//       if (addresses.whales.includes(address)) {
//         whales.push(address)
//       }
//     }

//     // const holderCondition = (
//     //   tokenHoldersWithOneThousand >= 1
//     //   || tokenHoldersWithOneHundred >= 1
//     //   || coinHoldersWithOneThousand >= 1
//     //   || coinHoldersWithOneHundred >= 2
//     //   || coinHoldersWithTwenty >= 4
//     // )

//     // if (!holderCondition) {
//     //   msg = 'No holder condition met'; return
//     // }

//     if (token.launchpad) {
//       // Liquidity check should be different when token is issued from Launchpad...
//       // Kept same for now...

//       if (!skipChecks && liquidityInBase < (baseTokenPrice * BigInt(limits.liquidityInUsdMin))) {
//         msg = formattedTime + 'Liquidity is too small: ' + liquidityInBase.toString();
//         // buy.attempts = MAX_ATTEMPTS;
//         return;
//       }
//     } else {
//       if (!skipChecks && liquidityInBase < (baseTokenPrice * BigInt(limits.liquidityInUsdMin))) {
//         msg = formattedTime + 'Liquidity is too small: ' + liquidityInBase.toString();
//         // buy.attempts = MAX_ATTEMPTS;
//         return;
//       }
//     }

//     if (!skipChecks && liquidityInBase > (baseTokenPrice * BigInt(limits.liquidityInUsdMax))) {
//       msg = formattedTime + 'Liquidity is too large: ' + liquidityInBase.toString(); return
//     }

//     if (!fake) {
//       portfolioBalance = await providers[0].getBalance(portfolio.wallet)

//       if (portfolio.balance !== portfolioBalance.toString()) {
//         portfolio.balance = portfolioBalance.toString()
  
//         await portfolio.save()
//       }
//     }

//     const _amountInMax = (portfolioBalance / 30n)
//     if (amountInMax > _amountInMax) { amountInMax = _amountInMax }

//     // let selectorCondition = (
//     //   _selector.lastGood < _selector.lastBad
//     //   && _selector.lastBad >= (Math.floor(Date.now() / 1000) - ((60 * 60) * 6)) // Last bad less than 6 hours
//     // );

//     const uniswapv3Condition = (
//       token.ownerRenounced === null
//       && token.protocols?.length === 1
//       && token.protocols?.includes(DexProtocols.uniswapv3)
//     );

//     const permitCondition = (
//       token.selectors.length === 1
//       && token.selectors.includes('d505accf')
//     );

//     const launchCondition = (
//       token.selectors.includes('01339c21')
//     );

//     const holderCountCondition = (
//       tokenHoldersWithOneHundred < 8
//       || tokenHoldersWithOneThousand < 2
//     );

//     amountIn = amountInMax

//     if (!token.launchpad) {
//       // amountIn = BigInt(BigNumber(baseTokenPrice.toString()).times(0.15).toFixed(0));
//       // buy.isTest = true

//       // switch (true) {
//       //   // case (selectorData.unknown.length > 0):
//       //   case (selectorData.oneLastWasBad):
//       //     amountIn = BigInt(BigNumber(baseTokenPrice.toString()).times(0.02).toFixed(0));
//       //     buy.isTest = true; break;
  
//       //   // case (launchCondition):
//       //   //   amountIn = BigInt(BigNumber(baseTokenPrice.toString()).times(0.20).toFixed(0));
//       //   //   buy.isTest = true; break;
  
//       //   case (holderCountCondition):
//       //     amountIn = amountInMax / 2n;

//       //     buy.isTest = true; break;
  
//       //   case (permitCondition):  
//       //     amountIn = amountInMax / 4n; break;
        
//       //   case (token.ownerRenounced === null):
//       //     amountIn = amountInMax / 8n;
//       //     buy.isTest = true; break;
        
//       //   case (token.selectors?.includes('d505accf')):
//       //     amountIn = amountInMax / 4n; break;
  
//       //   case (uniswapv3Condition):
//       //     amountIn = amountInMax / 6n; break;
  
//       //   case (token.ownerRenounced === true && pool.lockedPercentage === 0):
//       //   case (token.ownerRenounced === false && pool.lockedPercentage === 0):
//       //     amountIn = amountInMax / 1n; break; // Same as normal for now
  
//       //   case (pool.lockedPercentage <= limits.lockedPercentageMin):
//       //     amountIn = amountInMax / 6n; break;
//       // }
//     }

//     /**
//      * Cannot be more than 2% of total liquidity
//      */

//     // const twoPercentOfliquidityInBase = (((liquidityInBase * BigInt(10000)) / BigInt(100)) * BigInt(2)) / BigInt(10000)
//     // if (amountIn > twoPercentOfliquidityInBase) {
//     //   amountIn = twoPercentOfliquidityInBase
//     // }

//     if (portfolioBalance < amountIn) {
//       msg = formattedTime + 'Coin balance is < amountIn required.'; return
//     }

//     const _maxAmountForSnippets = maxAmountForSnippets(snippets, limits.amountIn)
//     const amountInMaxForSnippets = BigInt((BigNumber(baseTokenPrice.toString()).times(_maxAmountForSnippets)).toFixed(0))
    
//     if (amountIn > amountInMaxForSnippets) {
//       amountIn = amountInMaxForSnippets
//       buy.isTest = true
//     }

//     if (amountIn === 0n) {
//       msg = formattedTime + 'amountIn is 0'; return
//     }

//     const swapParams = {
//       buy: true,
//       fee: pool.fee,
//       router: router,
//       amountIn: amountIn,
//       signer: wallets[0],
//       token: token.address,
//       protocol: pool.protocol
//     }

//     const swap = new Swap(swapParams)

//     if (
//       pool.protocol === DexProtocols.uniswapv2
//       || pool.protocol === DexProtocols.pancakeswapv2
//     ) {
//       if (token.isScam === null) {
//         const canBuyAndSell = await canBuyAndSellToken(
//           token.address, amountIn, pool.protocol, swap.path
//         )

//         if (canBuyAndSell) {
//           token.isScam = false; await token.save();
//         } else {
//           token.isScam = true; token.follow = false;
//           await token.save()

//           msg = formattedTime + `${token.name} (${token.symbol}) is a scam`
          
//           // msg += canBuyAndSell.stage

//           // if (canBuyAndSell.buyMsg) {
//           //   msg += '\n'; msg += canBuyAndSell.buyMsg;
//           // }

//           // if (canBuyAndSell.sellMsg) {
//           //   msg += '\n'; msg += canBuyAndSell.sellMsg;
//           // }

//           // if (canBuyAndSell.sellTx) {
//           //   msg += '\n--\n'
//           //   msg += `${explorer.url}tx/${canBuyAndSell.sellTx}`
//           // } else if (canBuyAndSell.buyTx) {
//           //   msg += '\n--\n'
//           //   msg += `${explorer.url}tx/${canBuyAndSell.buyTx}`
//           // } else {
//           //   msg += '\n--\n'
//           //   msg += `${explorer.url}token/${token.address}`
//           // }

//           msg += '\n--\n'
//           msg += `${explorer.url}token/${token.address}`

//           sendDiscordMessage(
//             chainColor + ' ' + msg
//           )

//           return
//         }
//       }
//     }

//     amountOut = await swap.quote()
//     const calldata = await swap.encode()

//     if (!amountOut || amountOut === 0n) {
//       msg = formattedTime + 'amountOut is 0'; return
//     }

//     if (!calldata || calldata === '') {
//       msg = formattedTime + 'calldata is null'; return
//     }

//     /***************************/
//     /** Real transaction starts */
//     if (!fake) {
//       let tokenOutBalanceBefore = 0n
//       tokenOutBalanceBefore = await tokenuityContract.balanceFor(
//         token.address
//       )

//       console.log('tokenOutBalanceBefore:', tokenOutBalanceBefore)

//       let estimateGas = false
//       if (buy.attempts > 0) { estimateGas = true }

//       txResponse = await swap.execute({
//         estimateGas: estimateGas
//       })

//       if (!txResponse.success || !txResponse.tx) {
//         throw new Error('Buy failed')
//       }

//       // wait for 1 block
//       const receipt = await providers[0].waitForTransaction(txResponse.tx, 1)

//       let tokenOutBalanceAfter = 0n
//       tokenOutBalanceAfter = await tokenuityContract.balanceFor(
//         token.address, { blockTag: receipt?.blockNumber }
//       )

//       console.log('tokenOutBalanceAfter:', tokenOutBalanceAfter)

//       const tokenOutBalanceDelta = tokenOutBalanceAfter - tokenOutBalanceBefore
//       amountOut = (tokenOutBalanceDelta < 0n) ? -tokenOutBalanceDelta : tokenOutBalanceDelta

//       console.log('amountOut:', amountOut)
//     }
//     /** Real transaction ends */
//     /***************************/

//     await updatePortfolio(
//       portfolio, tokenIn, tokenOut, amountIn, amountOut
//     )
//     // portfolio = await Portfolio.findOne({ wallet: portfolio.wallet }) // reload portfolio because it was saved in updatePortfolio call: "__v" +1...
    
//     buy.status = 'success'
//     if (buy.boughtAt === null) { buy.boughtAt = ceiling }

//     msg = formattedTime + `Bought ${tokenOut.symbol}: ${amountIn.toString()} (${baseCoin}) >> ${amountOut.toString()} (${tokenOut.symbol})`

//     const usdAmount = (BigNumber(amountIn.toString()).div(baseTokenPrice.toString())).toFixed(2)
//     buy.amountInUsd = Number(usdAmount)

//     let protocol = 'uniswapv2'
//     switch (pool.protocol) {
//       case DexProtocols.pancakeswapv2:
//         protocol = 'pancakeswapv2'
//         break;

//       case DexProtocols.uniswapv3:
//         protocol = 'uniswapv3'
//         break;
//     }

//     let launchpad = 0
//     let _dexscreener = false

//     if (
//       dexscreener.boosts
//       || dexscreener.website
//       || dexscreener.twitter
//       || dexscreener.telegram
//       || dexscreener.tiktok
//       || dexscreener.discord
//       || dexscreener.github
//     ) {
//       _dexscreener = true
//     }

//     if (token.launchpad) { launchpad = token.launchpad }

//     let botMsg = ''
//     botMsg = `Bought $${usdAmount} worth of ${tokenOut.name} (${tokenOut.symbol})\n`
//     botMsg += `Try count: ${tryCount}, Attempt: ${buy.attempts + 1}, Protocol: ${protocol}, Trust score: ${trustScore}, Dexscreener: ${_dexscreener}, Launchpad: ${launchpad}, Whales: ${whales}`

//     if (txResponse) {
//       botMsg += '\n--\n'
//       botMsg += `${explorer.url}tx/${txResponse.tx}`
//     }
    
//     if (!fake) {
//       sendDiscordMessage(
//         chainColor + ' ' + botMsg
//       )
//     }
//   } catch (err: any) {
//     if (buy && buy.attempts > 5) {
//       buy.attempts = MAX_ATTEMPTS
//     }

//     if ('message' in err) {
//       msg = err.message
//     }

//     console.log(err)

//     Logger.err({ error: err, report: true })
//   } finally {
//     if (buy && save) {
//       if (buy.status !== 'success') {
//         buy.status = 'failed'
//       }

//       if (amountOut > 0n) {
//         buy.avgPriceInBase = (amountIn * BigInt(10 ** tokenOut.decimals) / amountOut).toString()
//       }

//       if (liquidityInBase) {
//         buy.liquidityInBase = liquidityInBase.toString()
//         buy.liquidityInUsd = Number(liquidityInBase / baseTokenPrice)
//       }

//       if (pool) {
//         buy.protocol = pool.protocol
//         buy.lockedPercentage = pool.lockedPercentage
//       }

//       if (txResponse && txResponse.tx) {
//         buy.tx = txResponse.tx
//       }

//       buy.attempts++
//       buy.messages.unshift(msg)

//       buy.tokenAgeOnTx = tokenAge

//       buy.amount = amountOut.toString()
//       buy.otherAmount = amountIn.toString()

//       buy.baseTokenPrice = baseTokenPrice.toString()
//       // buy.baseTokenPriceChange = baseTokenPriceChange

//       buy.ownerRenounced = token.ownerRenounced

//       buy.growth = data?.growth
//       buy.swapCount = data?.swapCount
//       buy.holderCount = data?.holderCount
//       buy.swapsPerMinute = data?.swapsPerMinute
//       buy.holderCountRatio = data?.holderCountRatio
//       buy.buyCountPct = buyCountPct
//       buy.buySellVolumeRatio = data?.buySellVolumeRatio
//       // buy.buyVolumeInUsdMedian = data?.buyVolumeInUsdMedian,
//       // buy.buyVolumeInUsdMean = data?.buyVolumeInUsdMean,
//       // buy.buyVolumeInUsdIqr = data?.buyVolumeInUsdIqr,
//       // buy.sellVolumeInUsdMedian = data?.sellVolumeInUsdMedian,
//       // buy.sellVolumeInUsdMean = data?.sellVolumeInUsdMean,
//       // buy.sellVolumeInUsdIqr = data?.sellVolumeInUsdIqr,
//       buy.volumeInUsdMedian = data?.volumeInUsdMedian,
//       buy.volumeInUsdMean = data?.volumeInUsdMean,
//       // buy.volumeInUsdIqr = data?.volumeInUsdIqr,

//       buy.tokenHoldersWithOne = tokenHoldersWithOne
//       buy.tokenHoldersWithTwenty = tokenHoldersWithTwenty
//       buy.tokenHoldersWithOneHundred = tokenHoldersWithOneHundred
//       buy.tokenHoldersWithOneThousand = tokenHoldersWithOneThousand

//       buy.coinHoldersWithOne = coinHoldersWithOne
//       buy.coinHoldersWithTwenty = coinHoldersWithTwenty
//       buy.coinHoldersWithOneHundred = coinHoldersWithOneHundred
//       buy.coinHoldersWithOneThousand = coinHoldersWithOneThousand

//       buy.updatedAt = Math.floor(Date.now() / 1000)
//       await buy.save()
//     }

//     console.log(msg)
//   }
// }
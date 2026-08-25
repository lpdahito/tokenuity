import { performance } from 'perf_hooks'

import { ethers } from 'ethers'
import { BigNumber } from 'bignumber.js'
import type { HydratedDocument } from 'mongoose'

import isLocal from '../config/isLocal.js'
import { Logger } from '../config/logger.js'
import addresses from '../config/addresses.js'

import * as models from '../models/models.js'

import tradingParams from '../config/tradingParams.js'

import {
  DexProtocols, SwapEvent, EventToken, IToken, ITokenSwap, SwapMovementForToken, TokenSwapFilter,
  SwapFromExtraction, TokensFromExtractions, TokenSwapInsertData
} from '../types.js'

const {
  LogModel: Log,
  TokenSwapModel: TokenSwap
} = models

export const createTokenSwapEventFromLog = async (
  token: HydratedDocument<IToken>, // target token
  otherToken: HydratedDocument<IToken>,
  tokenPair: Array<string>,
  dexNumber: number,
  log: ethers.Log,
  parsedLog: ethers.LogDescription,
  timestamp: number,
): Promise<SwapEvent | null> => {
  let _event: SwapEvent | null = null
  // let tokenSwap: HydratedDocument<ITokenSwap> | null = null

  try {
    // tokenSwap = await TokenSwap.findOne({
    //   tx: log.transactionHash, token: token.address, logIndex: log.index
    // })
  
    // if (tokenSwap) return null

    let buy = false
    let delta = BigInt(0) // Amount swapped
    let otherDelta = BigInt(0) // Other amount swapped

    let sender = ''
    let recipient = ''

    switch (dexNumber) {
      case DexProtocols.uniswapv2:
      case DexProtocols.pancakeswapv2:
      case DexProtocols.sushiswapv2:
        if (tokenPair.indexOf(token.address) === 0) {
          // console.log(token.address < otherToken.address)
          if (parsedLog.args[1] === BigInt(0)) {
            delta = parsedLog.args[3]
            otherDelta = parsedLog.args[2]
            buy = true
          } else {
            delta = parsedLog.args[1]
            otherDelta = parsedLog.args[4]
          }
        } else {
          // console.log(token.address > otherToken.address)
          if (parsedLog.args[2] === BigInt(0)) {
            delta = parsedLog.args[4]
            otherDelta = parsedLog.args[1]
            buy = true
          } else {
            delta = parsedLog.args[2]
            otherDelta = parsedLog.args[3]
          }
        }

        sender = parsedLog.args[0]
        recipient = parsedLog.args[5]
        
        break;
      case DexProtocols.uniswapv3:
        if (tokenPair.indexOf(token.address) === 0) {
          delta = parsedLog.args[2]
          otherDelta = parsedLog.args[3]
        } else {
          delta = parsedLog.args[3]
          otherDelta = parsedLog.args[2]
        }

        buy = (delta < 0)

        sender = parsedLog.args[0]
        recipient = parsedLog.args[1]

        break;
    }
  
    let amount = (delta < 0 ? -delta : delta)
    let otherAmount = (otherDelta < 0 ? -otherDelta : otherDelta)
  
    let price = ((otherAmount * (BigInt(10 ** token.decimals))) / amount) // could it be causing an error?
  
    let priceInBase: string | undefined
    let amountInBase: string | undefined
    if (addresses.tokens.base === otherToken.address) {
      priceInBase = price.toString()
      amountInBase = otherAmount.toString()
    }

    // console.log('price in base:', priceInBase)
  
    // let tokenSwap = new TokenSwap({
    //   tx: log.transactionHash,
    //   block: log.blockNumber,
    //   logIndex: log.index,
    //   token: token.address,
    //   tokenName: token.name,
    //   tokenSymbol: token.symbol,
    //   buy: buy,
    //   amount: amount,
    //   priceInBase: priceInBase,
    //   timestamp: timestamp
    // })
  
    // await tokenSwap.save()

    _event = {
      token: token,
      tx: log.transactionHash,
      blockNumber: log.blockNumber,
      buy: buy,
      amount: amount,
      sender: sender,
      recipient: recipient,
      priceInBase: priceInBase,
      amountInBase: amountInBase,
      logIndex: log.index,
      timestamp: timestamp,
      delta: delta,
      protocol: dexNumber
    }

    // console.log('_event.amountInBase:', _event.amountInBase)
  } catch(err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return _event
  }
}

// export const handleSwapMovementForToken = async (
//   token: HydratedDocument<IToken>,
//   ceiling: number,
//   floor: number,
//   twoHoursAgo: number,
//   oneDayAgo: number,
//   oneWeekAgo: number
// ): Promise<SwapMovementForToken> => {
//   let obj = {
//     token,
//     swapCount: 0,
//     holderCount: 0,
//     holderCountRatio: 0,
//     buyCountPct: 0,
//     buySellVolumeRatio: BigNumber('Infinity')
//   }

//   try {
//     let tokenAge = ''
//     switch (true) {
//       case (token.createdAt > oneDayAgo):
//         tokenAge = 'underOneDayOld'
//         break;
//       case (token.createdAt > oneWeekAgo):
//         tokenAge = 'underOneWeekOld'
//         break;
//       default:
//         tokenAge = 'moreThanOneWeekOld'
//         break;
//     }

//     const swapsForToken = await TokenSwap.find({
//       token: token.address, timestamp: { $gte: floor, $lte: ceiling }
//     }, '-_id buy amount').sort({ timestamp: -1 }).lean()
  
//     const swapCount = swapsForToken.length
//     if (!swapCount) return obj

//     obj.swapCount = swapCount

//     const buysForToken = swapsForToken.filter((s) => s.buy)
//     const sellsForToken = swapsForToken.filter((s) => !s.buy)

//     const buyCount = buysForToken.length
//     const sellCount = sellsForToken.length

//     let buyVolume = 0n
//     for (let buyForToken of buysForToken) {
//       buyVolume += BigInt(buyForToken.amount)
//     }

//     let sellVolume = 0n
//     for (let sellForToken of sellsForToken) {
//       sellVolume += BigInt(sellForToken.amount)
//     }

//     let buySellCountRatio = buyCount / sellCount
//     obj.buySellCountRatio = buySellCountRatio

//     let buySellVolumeRatio = BigNumber('Infinity')
//     if (sellVolume > BigInt(0)) { 
//       buySellVolumeRatio = BigNumber(buyVolume.toString()).div(sellVolume.toString())
//     }
//     obj.buySellVolumeRatio = buySellVolumeRatio
  
//     const lastLog = await Log.findOne({
//       logType: 'tokenSwapCount', 'token.address': token.address,
//     }, '-_id swapCount pump createdAt').sort({ createdAt: -1 }).lean()
  
//     const params = tradingParams['default'].limitsForLogs
//     if (!params) return obj
    
//     const swapCounts = params.swapCount[tokenAge as keyof typeof params.swapCount]

//     let minimum = swapCounts[0]
  
//     if (swapCount > minimum) {
//       let pump: boolean | null = null
//       let pumpCriteria: Array<boolean> = []
//       let dumpCriteria: Array<boolean> = []

//       pumpCriteria.push(buySellCountRatio >= params.buySellCountRatioPump)
//       pumpCriteria.push(buySellVolumeRatio >= BigNumber(params.buySellVolumeRatioPump))

//       dumpCriteria.push(buySellCountRatio <= params.buySellCountRatioDump) // This is wrong...
//       dumpCriteria.push(buySellVolumeRatio <= BigNumber(params.buySellVolumeRatioDump)) // This is wrong... I need real volume comparison

//       if (pumpCriteria.every((x) => x)) pump = true
//       if (dumpCriteria.every((x) => x)) pump = false

//       if (pump === null) return obj
  
//       switch (true) {
//         case (swapCount > swapCounts[4]):
//           minimum = swapCounts[4]
//           break;

//         case (swapCount > swapCounts[3]):
//           minimum = swapCounts[3]
//           break;

//         case (swapCount > swapCounts[2]):
//           minimum = swapCounts[2]
//           break;

//         case (swapCount > swapCounts[1]):
//           minimum = swapCounts[1]
//           break;
//       }

//       if (lastLog && lastLog.pump) {
//         if (lastLog.createdAt > twoHoursAgo) {
//           if (lastLog.swapCount >= minimum) return obj
//         }
//       }

//       if (lastLog && !lastLog.pump) {
//         if (lastLog.createdAt > twoHoursAgo) {
//           if (lastLog.swapCount >= minimum) return obj
//         }
//       }
  
//       await Log.create({
//         logType: 'tokenSwapCount',
//         token: {
//           address: token.address,
//           name: token.name,
//           symbol: token.symbol,
//           createdAt: token.createdAt
//         },
//         pump: pump,
//         swapCount: swapCount,
//         buyCount: buyCount,
//         sellCount: sellCount,
//       })
//     }
//   } catch(err: any) {
//     Logger.err({ error: err, report: true })
//   } finally {
//     return obj
//   }
// }

// export const handleSwapMovementForTokens = async (
//   eTokens: Array<EventToken>,
//   ceiling: number
// ): Promise<Array<SwapMovementForToken>> => {
//   let _time = performance.now()

//   const floor = ceiling - (60 * 30) // 30 mins ago.

//   const twoHoursAgo = ceiling - (2 * 60 * 60) // 2 hours ago.
//   const oneDayAgo = ceiling - (60 * 60 * 24) // 1 day ago.
//   const oneWeekAgo = ceiling - (60 * 60 * 24 * 7) // 1 week ago.

//   let settledPromises: Array<SwapMovementForToken> = []

//   try {
//     let promises: Array<Promise<SwapMovementForToken>> = []

//     for (let eToken of eTokens) {
//       promises.push(
//         handleSwapMovementForToken(
//           eToken.token, ceiling, floor, twoHoursAgo, oneDayAgo, oneWeekAgo
//         )
//       )
//     }

//     if (promises.length) {
//       settledPromises = await Promise.all(promises)
//     }
//   } catch(err: any) {
//     Logger.err({ error: err, report: true })
//   } finally {
//     if (isLocal) {
//       console.log(`Movement: ${((performance.now() - _time) / 1000).toFixed(2)} secs`)
//     }
    
//     return settledPromises
//   }
// }

// const _handleSwapMovementForToken = async (
//   token: HydratedDocument<IToken>,
//   ceiling: number,
//   floor: number,
//   baseTokenPrice: bigint
// ): Promise<SwapMovementForToken> => {
//   let obj = {
//     token,
//     swapCount: 0,
//     holderCount: 0,
//     holderCountRatio: 0,
//     buySellCountRatio: 0,
//     buyVolumesInUsd: <Array<number>>[],
//     sellVolumesInUsd: <Array<number>>[],
//     buySellVolumeRatio: BigNumber('Infinity')
//   }

//   const unwantedHolders = [
//     addresses.uniswap.v2.swapRouter02,
//     addresses.uniswap.v3.swapRouter02,
//     addresses.uniswap.v3.universalRouter,
//     addresses.sushiswap.v2.swapRouter02
//   ]

//   try {
//     const swapsForToken = await TokenSwap.find({
//       token: token.address, timestamp: { $gte: floor, $lte: ceiling }
//     }, '-_id').sort({ timestamp: -1 }).lean()
  
//     const swapCount = swapsForToken.length
//     if (!swapCount) return obj

//     obj.swapCount = swapCount

//     const buysForToken = swapsForToken.filter((s) => s.buy)
//     const sellsForToken = swapsForToken.filter((s) => !s.buy)

//     const buyCount = buysForToken.length
//     const sellCount = sellsForToken.length

//     let buyVolume = 0n
//     for (let buyForToken of buysForToken) {
//       buyVolume += BigInt(buyForToken.amount)

//       if (buyForToken.otherToken === addresses.tokens.base) {
//         const amount = buyForToken.otherAmount
//         const volume = BigNumber(amount).div(baseTokenPrice.toString()).toFixed(2)

//         obj.buyVolumesInUsd.push(Number(volume))
//       }
//     }

//     let sellVolume = 0n
//     for (let sellForToken of sellsForToken) {
//       sellVolume += BigInt(sellForToken.amount)

//       if (sellForToken.otherToken === addresses.tokens.base) {
//         const amount = sellForToken.otherAmount
//         const volume = BigNumber(amount).div(baseTokenPrice.toString()).toFixed(2)
        
//         obj.sellVolumesInUsd.push(Number(volume))
//       }
//     }

//     let buySellCountRatio = buyCount / sellCount
//     obj.buySellCountRatio = buySellCountRatio

//     let buySellVolumeRatio = BigNumber('Infinity')
//     if (sellVolume > 0n) { 
//       buySellVolumeRatio = BigNumber(buyVolume.toString()).div(sellVolume.toString())
//     }
//     obj.buySellVolumeRatio = buySellVolumeRatio

//     let holders: Array<string> = []
//     for (let buyForToken of buysForToken) {
//       const recipient = buyForToken.recipient

//       if (unwantedHolders.includes(recipient)) { continue }
//       if (holders.includes(recipient)) { continue }

//       holders.push(recipient)
//     }

//     obj.holderCount = holders.length
//     obj.holderCountRatio = 0
//   } catch(err: any) {
//     Logger.err({ error: err, report: true })
//   } finally {
//     return obj
//   }
// }

export const removeSwapDups = async (
): Promise<void> => {
  try {
    let swapDups = await TokenSwap.aggregate([
      {
        "$group": {
          _id: { 
            "logIndex": "$logIndex", "tx": "$tx", "token": "$token"
          },
          dups: { $push: "$_id" },
          count: { $sum : 1 }
        }
      },
      {
        "$match": {
          count: { "$gt": 1 }
        }
      },
      {
        "$sort": {
          createdAt: -1
        }
      }
    ])

    for (let doc of swapDups) {
      console.log(doc)
      // doc.dups.shift()
      // await TokenSwap.deleteMany({
      //   _id: { $in: doc.dups }
      // })
    }
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  }
}
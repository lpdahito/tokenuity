import { ethers } from 'ethers'
import { BigNumber } from 'bignumber.js'
import type { HydratedDocument } from 'mongoose'
import { Document } from 'mongodb'

import { contracts } from '../contracts/contracts.js'

import { chain } from './../config/chain.js'
import { Logger } from '../config/logger.js'
import addresses from '../config/addresses.js'
import { providers, wallets } from '../config/provider.js'

import * as models from '@tokenuity/store'

import { IPool, IToken, DexProtocols } from '@tokenuity/contracts'
import { SyncEvent } from '../types.js'

interface Call3 {
  target: string,
  allowFailure: boolean,
  callData: string
}

interface Result {
  success: boolean,
  returnData: string
}

const multicall3Contract = new ethers.Contract(
  addresses.multicall3, contracts.multicall3.abi, wallets[0]
)

const {
  PoolModel: Pool,
  TokenSwapModel: TokenSwap
} = models

export const baseToken = (
  pool: Document | HydratedDocument<IPool>
): string => {
  let token: string = pool.token0
  
  if (
    token !== addresses.tokens.base
    && token !== addresses.zero
  ) {
    token = pool.token1
  }

  return token
}

export const quoteToken = (
  pool: Document | HydratedDocument<IPool>
): string => {
  let token: string = pool.token0

  if (
    token === addresses.tokens.base
    || token === addresses.zero
  ) {
    token = pool.token1
  }

  return token
}

export const lastPrice = (
  pool: Document | HydratedDocument<IPool>
): string => {
  let price = '0'

  const amount0 = BigInt(pool.amount0)
  const amount1 = BigInt(pool.amount1)

  const decimals0: number = pool.decimals0
  const decimals1: number = pool.decimals1

  if (!amount0 || !amount1) { return price}

  if (
    pool.token0 === addresses.tokens.base
    || pool.token0 === addresses.zero
  ) {
    price = ((amount0 * (BigInt(10 ** decimals1))) / amount1).toString()
  } else {
    price = ((amount1 * (BigInt(10 ** decimals0))) / amount0).toString()
  }

  return price
}

export const buyCount = (
  pool: Document | HydratedDocument<IPool>
): number => {
  let token = quoteToken(pool)

  return token === pool.token0 ? pool.swap0OutCount : pool.swap1OutCount
}

export const sellCount = (
  pool: Document | HydratedDocument<IPool>
): number => {
  let token = quoteToken(pool)

  return token === pool.token0 ? pool.swap1OutCount : pool.swap0OutCount
}

export const getLiquidityInBase = async (
  pool: Document | HydratedDocument<IPool>
): Promise<bigint> => {
  let liquidity = 0n

  const WETH_CONTRACT = new ethers.Contract(
    addresses.tokens.base, contracts.erc20.abi, providers[0]
  )

  try {
    liquidity = await WETH_CONTRACT.balanceOf(
      pool.address
    )
  } catch (err: any) {
    console.log(err)
  } finally {
    return liquidity
  }
}

export const compute = (
  pool: Document | HydratedDocument<IPool>
): {
  growth: string,
  shouldBuy: boolean,
  prices: Array<bigint>,
  direction: string | null,
  lowestPriceIndex: number,
  highestPriceIndex: number
  lowestPrice: bigint | null,
  highestPrice: bigint | null,
  sequences: Array<Array<bigint>>
} | void => {
  let growth = '0.00'
  let shouldBuy = false

  let highestPrice = null
  let highestPriceIndex = 0

  let lowestPrice = null
  let lowestPriceIndex = 0

  let prices: Array<bigint> = []

  let direction: string | null = null

  const firstSwaps = pool.firstSwaps

  for (let i = 0; i < firstSwaps.length; i++) {
    const swapAmounts = firstSwaps[i]

    const price = getPrice(
      swapAmounts[0], swapAmounts[1]
    )

    if (lowestPrice === null || price < lowestPrice) {
      lowestPrice = price; lowestPriceIndex = i;
    }

    if (highestPrice === null || price > highestPrice) {
      highestPrice = price; highestPriceIndex = i;
    }

    prices.push(price)
  }

  const sequences: Array<Array<bigint>> = []

  let seqCount = 0
  for (let i = 0; i < prices.length; i++) {
    const price = prices[i]

    if (i === 0) { sequences[seqCount] = [ price ]; continue }
    // if (!sequences[seqCount]) { continue }

    const sequence: bigint[] = sequences[seqCount]

    // if (sequence.length === 1) { sequence.push(price); continue }

    const firstPrice = sequence[0]
    const lastPrice = sequence[sequence.length - 1]

    if (price === lastPrice) { sequence.push(price); continue }

    let dir: string | null = null
    if (firstPrice < lastPrice) { dir = 'up' }
    if (firstPrice > lastPrice) { dir = 'down' }

    if (dir === 'up') {
      if (price >= lastPrice) {
        sequence.push(price)
      } else {
        seqCount++; sequences[seqCount] = [ price ]
      }
    } else if (dir === 'down') {
      if (price <= lastPrice) {
        sequence.push(price)
      } else {
        seqCount++; sequences[seqCount] = [ price ]
      }
    } else {
      const pSequence: bigint[] = sequences[seqCount - 1]
      if (!pSequence) { sequence.push(price); continue }

      const pFirstPrice = pSequence[0]
      const pLastPrice = pSequence[pSequence.length - 1]

      let pDir: string | null = null
      if (pFirstPrice < pLastPrice) { pDir = 'up' }
      if (pFirstPrice > pLastPrice) { pDir = 'down' }

      if (pDir === 'up') {
        if (price > lastPrice) {
          seqCount++; sequences[seqCount] = [ price ]
        } else {
          sequence.push(price)
        }
      } else if (pDir === 'down') {
        if (price < lastPrice) {
          seqCount++; sequences[seqCount] = [ price ]
        } else {
          sequence.push(price)
        }
      } else {
        if (lastPrice > pLastPrice) {
          if (price >= lastPrice) {
            sequence.push(price)
          } else {
            seqCount++; sequences[seqCount] = [ price ]
          }
        } else if (lastPrice < pLastPrice) {
          if (price <= lastPrice) {
            sequence.push(price)
          } else {
            seqCount++; sequences[seqCount] = [ price ]
          }
        }
      }
    }
  }

  if (!lowestPrice || !highestPrice) { return }

  const _lowestPrice = lowestPrice.toString()
  const _highestPrice = highestPrice.toString()

  const lastPrice = prices[prices.length -1]
  const lastPriceIndex = prices.length -1

  direction = (highestPriceIndex > lowestPriceIndex) ? 'up' : 'down'

  if (direction === 'up') {
    growth = (BigNumber(_highestPrice).div(_lowestPrice)).toFixed(2)
  } else {
    growth = (BigNumber(_lowestPrice).div(_highestPrice)).toFixed(2)
  }

  const lastSeq = sequences[sequences.length - 1]

  const lastSeqFirstPrice = lastSeq[0]
  const lastSeqLastPrice = lastSeq[lastSeq.length -1]

  if (
    sequences
    && lastSeq.length > 3
    && lastSeqFirstPrice < lastSeqLastPrice
    // && BigNumber(lastPrice.toString()).gte(BigNumber(_lowestPrice).times(1.24))
  ) {
    shouldBuy = true
  }

  function getPrice(
    amount0: string, amount1: string
  ): bigint {
    let price = BigInt(0)

    const _amount0 = BigInt(amount0)
    const _amount1 = BigInt(amount1)

    const decimals0: number = pool.decimals0
    const decimals1: number = pool.decimals1

    if (!amount0 || !amount1) { return price}

    if (
      pool.token0 === addresses.tokens.base
      || pool.token0 === addresses.zero
    ) {
      price = ((_amount0 * (BigInt(10 ** decimals1))) / _amount1)
    } else {
      price = ((_amount1 * (BigInt(10 ** decimals0))) / _amount0)
    }

    return price
  }

  return {
    prices, sequences, direction, growth, shouldBuy, lowestPrice, highestPrice, lowestPriceIndex, highestPriceIndex
  }
}

export const createSyncEventFromLog = async (
  token: HydratedDocument<IToken>,
  otherToken: HydratedDocument<IToken>,
  tokenPair: Array<string>,
  dexNumber: number,
  log: ethers.Log,
  parsedLog: ethers.LogDescription,
  timestamp: number,
  baseTokenPrice: bigint
): Promise<SyncEvent | null> => {
  let _event: SyncEvent | null = null
  
  if (
    dexNumber !== DexProtocols.uniswapv2
    && dexNumber !== DexProtocols.sushiswapv2
  ) return _event

  let reserve = BigInt(0) // Amount swapped
  let otherReserve = BigInt(0) // Other amount swapped

  try {
    if (tokenPair.indexOf(token.address) === 0) {
      reserve = parsedLog.args[0]
      otherReserve = parsedLog.args[1]
    } else {
      reserve = parsedLog.args[1]
      otherReserve = parsedLog.args[0]
    }
  
    let price = ((otherReserve * (BigInt(10 ** token.decimals))) / reserve)
  
    let priceInBase: string | undefined
    if (addresses.tokens.base === otherToken.address) {
      priceInBase = price.toString()
    }
  
    _event = {
      token: token,
      tx: log.transactionHash,
      blockNumber: log.blockNumber,
      logIndex: log.index,
      timestamp: timestamp,
      priceInBase: priceInBase,
      protocol: dexNumber,
    }
  } catch(err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return _event
  }
}

export const handleCreateLockerEvent = async (
  parsedLog: ethers.LogDescription,
): Promise<boolean> => {
  let success = false

  const poolAddress = parsedLog.args[1]

  try {
    let pool = await Pool.findOne({
      address: poolAddress
    }).sort({ createdAt: -1 })
  
    if (!pool) {
      pool = new Pool({
        address: poolAddress,
        protocol: DexProtocols.uniswapv2,
        lockedPercentage: 0.20, // need to change that...
        fee: 3000,
        token0: parsedLog.args[2],
        token1: parsedLog.args[3]
      })
    }
  
    await pool.save()

    success = true
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return success
  }
}

export const lockedPercentage = async (
  poolAddress: string
): Promise<number> => {
  let percentage = 0

  const poolContract = new ethers.Contract(
    poolAddress, contracts.uniswapv2.pool.abi, wallets[0]
  )

  try {
    let totalSupplyCalldata = poolContract.interface.encodeFunctionData('totalSupply')

    let uniswapV2LockerCalldata = poolContract.interface.encodeFunctionData(
      'balanceOf', [ addresses.uncx.uniswapV2Locker ]
    )
    
    let calls: Array<Call3> = [
      { target: poolAddress, allowFailure: true, callData: totalSupplyCalldata },
      { target: poolAddress, allowFailure: true, callData: uniswapV2LockerCalldata }
    ]

    for (let address of addresses.nullAddresses) {
      let calldata = poolContract.interface.encodeFunctionData(
        'balanceOf', [ address ]
      )

      calls.push({
        target: poolAddress, allowFailure: true, callData: calldata
      })
    }

    const results: Array<Result> = await multicall3Contract.aggregate3.staticCall(calls)

    let lockedBalance = 0n
    let totalSupply = 0n
    
    for (let i=0; i < results.length; i++) {
      if (i === 0) {
        if (!results[0].success) {
          console.log('Could\'t get totalSupply'); return percentage
        }

        totalSupply = poolContract.interface.decodeFunctionResult(
          'totalSupply', results[i].returnData
        )[0]

        // console.log('totalSupply:', totalSupply)
      } else {
        if (results[i].success) {
          let _result = poolContract.interface.decodeFunctionResult(
            'balanceOf', results[i].returnData
          )[0]
  
          lockedBalance += _result
        }
      }
    }

    if (totalSupply > 0n && lockedBalance > 0n) {
      const lockedPortion = BigNumber(lockedBalance.toString()).div(totalSupply.toString())
      percentage = Number(lockedPortion.toFixed(2))
    }
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    // console.log(percentage)
    return percentage
  }
}

export const removePoolDups = async (
): Promise<void> => {
  try {
    let poolDups = await Pool.aggregate([
      {
        "$group": {
          _id: "$address",
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

    for (let doc of poolDups) {
      doc.dups.shift()
      await Pool.deleteMany({
        _id: { $in: doc.dups }
      })
    }
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  }
}

export const isUniswapv3Pool = async (
  contract: ethers.Contract
): Promise<boolean> => {
  if (!addresses.uniswap) {
    return false
  }

  try {
    let factoryAddress = await contract.factory()
    return (factoryAddress === addresses.uniswap.v3.factory)
  } catch (err: any) {
    Logger.msg('not uniswapv3')
    return false
  }
}

export const isUniswapv2Pool = async (
  contract: ethers.Contract
): Promise<boolean> => {
  if (!addresses.uniswap) {
    return false
  }

  try {
    let factoryAddress = await contract.factory()
    return (factoryAddress === addresses.uniswap.v2.factory)
  } catch (err: any) {
    Logger.msg('not uniswapv2')
    return false
  }
}

export const isPancakeswapv3Pool = async (
  contract: ethers.Contract
): Promise<boolean> => {
  if (!addresses.pancakeswap) {
    return false
  }

  try {
    let factoryAddress = await contract.factory()
    return (factoryAddress === addresses.pancakeswap.v3.factory)
  } catch (err: any) {
    Logger.msg('not pancakeswapv3')
    return false
  }
}

export const isPancakeswapv2Pool = async (
  contract: ethers.Contract
): Promise<boolean> => {
  if (!addresses.pancakeswap) {
    return false
  }
  
  try {
    let factoryAddress = await contract.factory()
    return (factoryAddress === addresses.pancakeswap.v2.factory)
  } catch (err: any) {
    Logger.msg('not pancakeswapv2')
    return false
  }
}

export const isSushiswapv2Pool = async (
  contract: ethers.Contract
): Promise<boolean> => {
  if (!addresses.sushiswap) {
    return false
  }

  try {
    let factoryAddress = await contract.factory()
    return (factoryAddress === addresses.sushiswap.v2.factory)
  } catch (err: any) {
    Logger.msg('not uniswapv2')
    return false
  }
}

export const isVirtualsPool = async (
  contract: ethers.Contract
): Promise<boolean | { token0: string , token1: string }> => {
  if (!addresses.virtuals) {
    return false
  }

  let factoryContract = new ethers.Contract(
    addresses.virtuals.factory, contracts.virtuals.factory.abi, providers[0]
  )

  try {
    let tokenA = '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b' // Virtuals
    let tokenB = tokenA

    tokenA = await contract.tokenA()
    if (tokenA === tokenB) {
      tokenB = await contract.tokenB()
    }

    let poolAddress = await factoryContract.getPair(
      tokenA, tokenB
    )

    if (poolAddress !== contract.target) { return false }

    let token0 = tokenA; let token1 = tokenB;

    if (tokenA > tokenB) {
      token0 = tokenB; token1 = tokenA;
    }

    // console.log('token0', token0, 'token1', token1)

    return { token0, token1 }
  } catch (err: any) {
    Logger.msg('not virtuals')
    return false
  }
}
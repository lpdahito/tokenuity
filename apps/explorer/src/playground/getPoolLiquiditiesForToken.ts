// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/getPoolLiquiditiesForToken.js").default()'

import { ethers } from 'ethers'

import * as mongoose from 'mongoose'

import * as models from '@tokenuity/store'

import { databaseUrl } from '../config/databaseUrl'
import addresses from '../config/addresses'
import { providers, wallets } from '../config/provider'

import { contracts } from '../contracts/contracts'

import { getBaseTokenPrice } from '../helpers/oracle'
import { findOrCreateToken, getPoolLiquidityForToken } from '../helpers/tokens'

const {
  PoolModel: Pool,
} = models

import type { HydratedDocument } from 'mongoose'
import { DexProtocols, IPool } from '../types'

interface Call3 {
  target: string,
  allowFailure: boolean,
  callData: string
}

interface Result {
  success: boolean,
  returnData: string
}

interface UpdateData {
  updateOne: {
    filter: {
      address: string
    },
    update: {
      protocols?: Array<DexProtocols>,
      swapCount: number,
      buyCount: number,
      sellCount: number,
      lastPriceInBase?: string,
      highestPriceInBase?: string,
      lowestPriceInBase?: string,
      lastSwap: number
    }
  }
}

interface PoolLiquidities {
  pools: Array<{ pool: HydratedDocument<IPool>, liquidity: bigint }>,
  total: bigint
}

const multicall3Contract = new ethers.Contract(
  addresses.multicall3, contracts.multicall3.abi, wallets[0]
)

export default async (
): Promise<void> => {
  let liquidities: PoolLiquidities = {
    pools: [],
    total: BigInt(0)
  }

  interface PoolData {
    pool: HydratedDocument<IPool>,
    isBaseToken: boolean,
    otherTokenAddress: string,
    decimals: number,
    call3: Call3
  }

  let _pools: Array<PoolData> = []
  let calls: Array<Call3> = []

  const tokenAddress = '0xDaa3e61aCBc88A3429815c7f4542D92c6bE0810A'

  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(databaseUrl)

    const pools = await Pool.find({
      $or:[
        { token0: tokenAddress },
        { token1: tokenAddress }
      ]
    }).sort({ fee: 1 })
  
    if (!pools.length) {
      console.log('Couldn\'t find any pools for transaction'); return
    }
  
    let baseTokenPools = pools.filter((p) => { 
      return (
        p.token0 === addresses.tokens.base
        || p.token1 === addresses.tokens.base
      )
    })

    if (!baseTokenPools.length) {
      console.log('No pools with direct baseToken/Token pair'); return
    }

    for (const pool of baseTokenPools) {
      let isBaseToken = true
      let decimals = 18

      const otherTokenAddress = pool.token0 === tokenAddress ? pool.token1 : pool.token0
      let popularTokens = addresses.tokens.popular
      popularTokens.unshift(addresses.tokens.base)
      
      if (!popularTokens.includes(otherTokenAddress)) continue

      const otherTokenContract = new ethers.Contract(
        otherTokenAddress, contracts.erc20.abi, providers[0]
      )

      let calldata = otherTokenContract.interface.encodeFunctionData('balanceOf', [pool.address])

      if (addresses.tokens.base === otherTokenAddress) {
        isBaseToken = true        
      } else if (addresses.tokens.stable.includes(otherTokenAddress)) {
        let { token: otherToken } = await findOrCreateToken(otherTokenAddress)
        if (!otherToken) continue

        isBaseToken = false
        decimals = otherToken.decimals
      }

      let call3 = { target: otherTokenAddress, allowFailure: true, callData: calldata }
      _pools.push({ pool: pool, isBaseToken: isBaseToken, otherTokenAddress: otherTokenAddress, decimals: decimals, call3:  call3 })
      calls.push(call3)
    }

    const results: Array<Result> = await multicall3Contract.aggregate3.staticCall(calls)

    for (let i = 0; i < _pools.length; i++) {
      const pool = _pools[i]; const result = results[i];
      
      if (!result.success) continue
      if (!pool.isBaseToken) continue

      const tokenContract = new ethers.Contract(
        pool.otherTokenAddress, contracts.erc20.abi, providers[0]
      )

      let liquidity = tokenContract.interface.decodeFunctionResult('balanceOf', result.returnData)[0]

      liquidities.pools.push({
        pool: pool.pool, liquidity: liquidity
      })
      liquidities.total += liquidity
    }

    // make sure pools are listed in liquidity asc...

    liquidities.pools.sort((a, b) => {
      if (b.liquidity > a.liquidity) {
        return 1;
      } else if (b.liquidity < a.liquidity) {
        return -1;
      } else {
        return 0;
      }
    })

    console.log(liquidities.pools)
  } catch (err: any) {
    console.log(err)
  } finally {
    mongoose.disconnect()
  }
}
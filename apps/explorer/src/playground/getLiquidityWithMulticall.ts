import { ethers } from 'ethers'

import { BigNumber } from 'bignumber.js'

import * as mongoose from 'mongoose'
import { databaseUrl } from './../config/databaseUrl'

import { providers, wallets } from '../config/provider'

import addresses from '../config/addresses'

import { getBaseTokenPrice } from '../helpers/oracle'

import { contracts } from '../contracts/contracts'
import * as models from '@tokenuity/store'

const {
  PoolModel: Pool,
  TokenModel: Token,
  TokenSwapModel: TokenSwap
} = models

import type { HydratedDocument } from 'mongoose'
import type { IToken } from '../types'

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

const main = async (): Promise<void> => {
  let liquidityInBase = BigInt(0)

  interface PoolData {
    isBaseToken: boolean,
    otherTokenAddress: string,
    decimals: number,
    call3: Call3
  }

  let _pools: Array<PoolData> = []
  let calls: Array<Call3> = []

  let baseTokenPrice = await getBaseTokenPrice()
  if (baseTokenPrice === BigInt(0)) return console.log('Could not get baseToken price...')

  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(databaseUrl, { autoIndex: false })

    let token = await findOrCreateToken('0x8721e2835D79E14fc4F3cD00A4D6eD9E5BaCD18D')
    if (!token) return console.log('Couldn\'t find token')

    console.log('Token:', `${token.name} ${token.symbol}`)

    const pools = await Pool.find({
      $or:[
        { token0: token.address },
        { token1: token.address }
      ]
    }).sort({ fee: 1 })
  
    if (!pools.length) { return console.log('Couldn\'t find any pools') }

    console.log('Pools:', pools.length)

    for (const pool of pools) {
      console.log('loop starts')
      let isBaseToken = true
      let decimals = 18

      const otherTokenAddress = pool.token0 === token.address ? pool.token1 : pool.token0
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
        let otherToken = await findOrCreateToken(otherTokenAddress)
        if (!otherToken) continue

        isBaseToken = false
        decimals = otherToken.decimals
      }

      let call3 = { target: otherTokenAddress, allowFailure: true, callData: calldata }
      _pools.push({ isBaseToken: isBaseToken, otherTokenAddress: otherTokenAddress, decimals: decimals, call3:  call3 })
      calls.push(call3)

      console.log(_pools)
      console.log(calls)
      console.log('loop ends')
    }

    const results: Array<Result> = await multicall3Contract.aggregate3.staticCall(calls)

    for (let i = 0; i < _pools.length; i++) {
      const pool = _pools[i]; const result = results[i];
      
      if (!result.success) continue

      const tokenContract = new ethers.Contract(
        pool.otherTokenAddress, contracts.erc20.abi, providers[0]
      )

      let liquidity = tokenContract.interface.decodeFunctionResult('balanceOf', result.returnData)[0]

      if (pool.isBaseToken) {
        liquidityInBase += liquidity
      } else {
        let _liquidity = BigNumber(liquidity).div(10 ** pool.decimals).toFixed()
        let valueInUsd = Math.floor(Number(_liquidity))

        liquidityInBase += (baseTokenPrice * BigInt(valueInUsd))
      }
    }
  } catch (err: any) {
    console.log(err)
  } finally {
    console.log(liquidityInBase)
    mongoose.disconnect()
  }
}

main()

const findOrCreateToken = async (
  address: string
): Promise<HydratedDocument<IToken> | null> => {
  try {
    let token = await Token.findOne({ address: address }).sort({ createdAt: -1 })

    if (!token) {
      const tokenContract = new ethers.Contract(
        address, contracts.erc20.abi, wallets[0]
      )

      const calldataForName = tokenContract.interface.encodeFunctionData('name')
      const calldataForSymbol = tokenContract.interface.encodeFunctionData('symbol')
      const calldataForDecimals = tokenContract.interface.encodeFunctionData('decimals')

      let calls: Array<Call3> = [
        { target: address, allowFailure: true, callData: calldataForName },
        { target: address, allowFailure: true, callData: calldataForSymbol },
        { target: address, allowFailure: true, callData: calldataForDecimals }
      ]
  
      const results: Array<Result> = await multicall3Contract.aggregate3.staticCall(calls)

      const _name = tokenContract.interface.decodeFunctionResult('name', results[0].returnData)[0]
      const _symbol = tokenContract.interface.decodeFunctionResult('symbol', results[1].returnData)[0]

      let _decimals: bigint = BigInt(18)
      if (results[2].success) {
        _decimals = tokenContract.interface.decodeFunctionResult('decimals', results[2].returnData)[0]
      }

      let popularTokens = addresses.tokens.popular
      popularTokens.unshift(addresses.tokens.base)

      token = new Token({
        address: address,
        follow: !popularTokens.includes(address), // Do second check on market cap...
        decimals: Number(_decimals),
        name: _name,
        symbol: _symbol
      })

      await token.save()
      console.log('Added token:', token.name, token.symbol)
    }

    return token
  } catch(err) {
    return null
  }
}
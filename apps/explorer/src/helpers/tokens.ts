import axios from 'axios'
import { ethers } from 'ethers'
import { BigNumber } from 'bignumber.js'
import type { HydratedDocument } from 'mongoose'

import { contracts } from '../contracts/contracts.js'

import isLocal from '../config/isLocal.js'
import { Logger } from '../config/logger.js'
import explorer from '../config/explorer.js'
import addresses from '../config/addresses.js'
import { providers, wallets } from '../config/provider.js'

import { Swap } from '../helpers/swaps.js'

import * as models from '../models/models.js'

import {
  DexProtocols, Launchpads, SwapEvent, EventToken, IPool, IToken, Routers,
  TokensFromExtractions, TokenUpdateData, SwapFromExtraction, UnfollowedTokenUpdateData
} from '../types.js'

import {
  PoolInsertData, PoolFromExtraction, PoolsFromExtractions, TokenInsertData
} from './..//types/poolExtractionTypes.js'
import { chain } from '../config/chain.js'

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
      follow: boolean,
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

interface UnfollowedUpdateData {
  updateOne: {
    filter: {
      address: string
    },
    update: {
      lastSwap: number
    }
  }
}

interface PoolLiquidities {
  pools: Array<{ pool: HydratedDocument<IPool>, liquidity: bigint }>,
  total: bigint
}

interface SimulationResponse {
  success: boolean,
  stage: string,
  buyTx: string | null,
  sellTx: string | null,
  buyMsg: string | null,
  sellMsg: string | null
}

interface TokensWithMeta {
  [key: string]: TokenWithMeta
}

interface TokenWithMeta {
  name: string
  symbol: string
  decimals: number
  launchpad: Launchpads | null
}

const {
  TokenModel: Token,
  TokenSwapModel: TokenSwap,
} = models

const multicall3Contract = new ethers.Contract(
  addresses.multicall3, contracts.multicall3.abi, wallets[0]
)

export const findOrCreateToken = async (
  address: string
): Promise<{
  token: HydratedDocument<IToken> | null,
  created: boolean
}> => {
  let token: HydratedDocument<IToken> | null = null
  let created: boolean = false

  try {
    const evmole = await import('evmole')

    token = await Token.findOne({ address: address }).sort({ createdAt: -1 })

    if (!token) {
      const tokenContract = new ethers.Contract(
        address, contracts.erc20.abi, wallets[0]
      )

      let selectors: Array<string> = []
      const bytecode = await providers[0].getCode(address)
      selectors = evmole.functionSelectors(bytecode)

      let erc20Selectors = contracts.erc20.selectors.base
      erc20Selectors = erc20Selectors.concat(contracts.erc20.selectors.permitted)

      selectors = selectors.filter(selector => !erc20Selectors.includes(selector))

      const calldataForName = tokenContract.interface.encodeFunctionData('name')
      const calldataForSymbol = tokenContract.interface.encodeFunctionData('symbol')
      const calldataForDecimals = tokenContract.interface.encodeFunctionData('decimals')
      const calldataForTotalSupply = tokenContract.interface.encodeFunctionData('totalSupply')
      const calldataForOwner = tokenContract.interface.encodeFunctionData('owner')

      let calls: Array<Call3> = [
        { target: address, allowFailure: true, callData: calldataForName },
        { target: address, allowFailure: true, callData: calldataForSymbol },
        { target: address, allowFailure: true, callData: calldataForDecimals },
        { target: address, allowFailure: true, callData: calldataForTotalSupply },
        { target: address, allowFailure: true, callData: calldataForOwner },
      ]
  
      const results: Array<Result> = await multicall3Contract.aggregate3.staticCall(calls)

      const _name = tokenContract.interface.decodeFunctionResult('name', results[0].returnData)[0]
      
      const _symbol = tokenContract.interface.decodeFunctionResult('symbol', results[1].returnData)[0]

      let _decimals: bigint = BigInt(18)
      if (results[2].success) {
        _decimals = tokenContract.interface.decodeFunctionResult('decimals', results[2].returnData)[0]
      }

      

      const _totalSupply = tokenContract.interface.decodeFunctionResult('totalSupply', results[3].returnData)[0]

      let _ownerRenounced: boolean | null = null
      if (results[4].success && results[4].returnData !== '0x') {
        const contractOwner = tokenContract.interface.decodeFunctionResult('owner', results[4].returnData)[0]

        _ownerRenounced = (/^0x00000000000000000000/.test(contractOwner)) ? true : false
      }

      let unwantedTokens = addresses.tokens.popular.concat(addresses.tokens.stable).concat(addresses.tokens.removed)
      unwantedTokens.unshift(addresses.tokens.base)

      let follow = !unwantedTokens.includes(address)

      token = new Token({
        address: address,
        follow: follow, // Do second check on market cap...
        decimals: Number(_decimals),
        name: _name,
        symbol: _symbol,
        selectors: selectors,
        totalSupply: _totalSupply,
        ownerRenounced: _ownerRenounced
      })

      await token.save()
      created = true

      // if (isLocal) {
      //   console.log(`Added: ${token.name} (${token.symbol}) ${token.address}`)
      // }
      console.log(`Added: ${token.name} (${token.symbol}) ${token.address}`)
      
    }
  } catch(err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return { token: token, created: created }
  }
}

export const getPoolLiquidityForToken = async (
  token: HydratedDocument<IToken>,
  pools: Array<HydratedDocument<IPool>>,
  baseTokenPrice: bigint
): Promise<bigint> => {
  let liquidityInBase = BigInt(0)

  interface PoolData {
    isBaseToken: boolean,
    otherTokenAddress: string,
    decimals: number,
    call3: Call3
  }

  let _pools: Array<PoolData> = []
  let calls: Array<Call3> = []

  try {
    for (const pool of pools) {
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
        let { token: otherToken } = await findOrCreateToken(otherTokenAddress)
        if (!otherToken) continue

        isBaseToken = false
        decimals = otherToken.decimals
      }

      let call3 = { target: otherTokenAddress, allowFailure: true, callData: calldata }
      _pools.push({ isBaseToken, otherTokenAddress, decimals, call3 })
      calls.push(call3)
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
    Logger.err({ error: err, report: true })
  } finally {
    return liquidityInBase
  }
}

export const getPoolLiquiditiesForToken = async (
  token: HydratedDocument<IToken>,
  pools: Array<HydratedDocument<IPool>>,
  baseTokenPrice: bigint
): Promise<PoolLiquidities> => {
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

  try {
    for (const pool of pools) {
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
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return liquidities
  }
}

export const generateEtokenData = (
  events: Array<SwapEvent>
): Array<EventToken> => {
  let eTokens: Array<EventToken> = []
  let pibCount = 0

  for (let _event of events) {
    const condition = (et: EventToken) => et.token.address === _event.token.address

    let eToken = eTokens.find(condition)

    if (eToken) {
      // console.log('eToken found')
      if (_event.priceInBase) {
        if (!eToken.lastPriceInBase) {
          eToken.lastPriceInBase = _event.priceInBase

          // console.log('value (check A):', _event.priceInBase)
        }

        if (_event.blockNumber > eToken.highestBlock) {
          eToken.lastPriceInBase = _event.priceInBase

          // console.log('value (check B):', _event.priceInBase)

          eToken.highestBlock = _event.blockNumber
          eToken.highestIndex = _event.logIndex
        } else if (
          _event.blockNumber === eToken.highestBlock
          && _event.logIndex > eToken.highestIndex
        ) {
          eToken.lastPriceInBase = _event.priceInBase

          // console.log('value (check C):', _event.priceInBase)

          eToken.highestIndex = _event.logIndex
        }

        if (!eToken.highestPriceInBase) { 
          eToken.highestPriceInBase = _event.priceInBase
        } else if (_event.priceInBase && BigInt(_event.priceInBase) > BigInt(eToken.highestPriceInBase)) {
          eToken.highestPriceInBase = _event.priceInBase
        }
    
        if (!eToken.lowestPriceInBase) { 
          eToken.lowestPriceInBase = _event.priceInBase
        } else if (_event.priceInBase && BigInt(_event.priceInBase) < BigInt(eToken.lowestPriceInBase)) {
          eToken.lowestPriceInBase = _event.priceInBase
        }
      } else {
        // console.log('********** no price in base ***********')
      }

      if (!eToken.protocols.includes(_event.protocol)) {
        eToken.protocols.push(_event.protocol)
      }

      if (_event.timestamp > eToken.lastSwap) {
        eToken.lastSwap = _event.timestamp
      }

      // console.log('highestBlock:', eToken.highestBlock)
      // console.log('highestIndex', eToken.highestIndex)

      // console.log('lastPriceInBase', eToken.lastPriceInBase)
      // console.log('highestPriceInBase', eToken.highestPriceInBase)
      // console.log('lowestPriceInBase', eToken.lowestPriceInBase)

      eTokens[eTokens.findIndex(condition)] = eToken
    } else {
      // console.log('eToken undefined')
      eTokens.push({
        token: _event.token,
        highestBlock: _event.blockNumber,
        highestIndex: _event.logIndex,
        lastSwap: _event.timestamp,
        protocols: [ _event.protocol ],
        lastPriceInBase: _event.priceInBase,
        highestPriceInBase: _event.priceInBase,
        lowestPriceInBase: _event.priceInBase,
      })
    }

    if (_event.priceInBase) pibCount++
  }

  // for (let etoken of eTokens) {
  //   console.log('etoken.lastPriceInBase:', etoken.lastPriceInBase)
  //   console.log('etoken.lowestPriceInBase:', etoken.lowestPriceInBase)
  //   console.log('etoken.highestPriceInBase:', etoken.highestPriceInBase)
  //   console.log('--')
  // }

  return eTokens
}

const _updateUnfollowedToken = async (
  token: HydratedDocument<IToken>,
  ceiling: number,
): Promise<UnfollowedUpdateData> => {
  try {
    if (token.lastSwap < ceiling) {
      token.lastSwap = ceiling
    }
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return {
      updateOne: {
        filter: {
          address: token.address
        },
        update: {
          lastSwap: token.lastSwap
        }
      }
    }
  }
}

export const updateUnfollowedTokens = async (
  tokens: Array<HydratedDocument<IToken>>,
  ceiling: number,
): Promise<void> => {
  try {
    let promises: Array<Promise<UnfollowedUpdateData>> = []
    for (let token of tokens) {
      promises.push(
        _updateUnfollowedToken(token, ceiling)
      )
    }

    let bulkWriteArray: Array<UnfollowedUpdateData> = []
    if (promises.length) {
      bulkWriteArray = await Promise.all(promises)
    }

    // for (let data of bulkWriteArray) {
    //   console.log(data.updateOne.update.lastPriceInBase)
    // }

    // console.log(bulkWriteArray)
    
    await Token.bulkWrite(
      bulkWriteArray, { ordered: false }
    )

    // console.log(resp)
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  }
}

export const isOwnerRenounced = async (
  token: HydratedDocument<IToken>
): Promise<boolean> => {
  const tokenContract = new ethers.Contract(
    token.address, contracts.erc20.abi, providers[0]
  )

  let ownerRenounced = false

  try {
    const owner = await tokenContract.owner()
    if (/^0x00000000000000000000/.test(owner)) ownerRenounced = true
  } catch(err: any) {
    Logger.msg('Contract does not have owner function')
  } finally {
    return ownerRenounced
  }
}

export const canBuyAndSellToken = async (
  token: string,
  amountIn: bigint,
  protocol: DexProtocols,
  path: string[]
): Promise<boolean> => {
  let success = false

  const tokenuityContract = new ethers.Contract(
    addresses.tokenuity, contracts.tokenuity.abi, wallets[0]
  )

  try {
    // ***** msg.sender must have funds otherwise call will revert *****
    // Check with 20% slippage
    await tokenuityContract.canBuyAndSellToken.staticCall(
      token, protocol, 80n, path, { value: amountIn }
    )

    success = true
  } catch(err: any) {
    // Logger.err({ error: err, report: true })

    if (isLocal) { console.log(err) }
  } finally {
    return success
  }
}

export const isVerified = async (
  tokenAddress: string
): Promise<boolean> => {
  let success = false

  let string = explorer.apiUrl + '&module=contract&action=getsourcecode'
  string += '&address=' + tokenAddress
  string += '&apikey=' + explorer.key

  // console.log(string)

  try {
    let resp = await axios.get(string)

    // console.log(resp.data)

    const source = resp.data.result[0].SourceCode

    if (typeof source !== 'undefined' && source !== '') {
      success = true
    }
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return success
  }
}

export const getTokenSourceCode = async (
  tokenAddress: string
): Promise<string> => {
  let sourceCode = ''

  let string = explorer.apiUrl + '&module=contract&action=getsourcecode'
  string += '&address=' + tokenAddress
  string += '&apikey=' + explorer.key

  try {
    let resp = await axios.get(string)

    const source = resp.data.result[0].SourceCode

    // console.log(resp.data.result[0])

    // console.log(source)

    if (typeof source !== 'undefined' && source !== '') {
      sourceCode = source
    }
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return sourceCode
  }
}

export const getTokenCreator = async (
  tokenAddress: string
): Promise<string> => {
  let contractCreator = ''

  let string = explorer.apiUrl + '&module=contract&action=getcontractcreation'
  string += '&contractaddresses=' + tokenAddress
  string += '&apikey=' + explorer.key

  try {
    let resp = await axios.get(string)

    // console.log(resp.data.result)

    const creator = resp.data.result[0].contractCreator

    // console.log(resp.data.result[0])

    // console.log(source)

    if (typeof creator !== 'undefined' && creator !== '') {
      contractCreator = creator
    }
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return contractCreator
  }
}

export const removeTokenDups = async (
): Promise<void> => {
  try {
    let tokenDups = await Token.aggregate([
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

    for (let doc of tokenDups) {
      doc.dups.shift()
      await Token.deleteMany({
        _id: { $in: doc.dups }
      })
    }
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  }
}

export interface HoldersFromBalances {
  [key: string]: HolderFromBalance
}

export interface HolderFromBalance {
  coinBalanceInUsd: string
  tokenBalanceInUsd: string
}

// export const getHolderData = async (
//   priceInBase: HydratedDocument<IToken>,
//   holders: string[], // Take sample if holders.length > 50
//   baseTokenPrice: bigint
// ): Promise<HoldersFromBalances> => {
//   const holdersFromBalances: HoldersFromBalances = {}

//   const priceInBase = token.lastPriceInBase
//   if (!priceInBase) { return holdersFromBalances }
//   if (!token.lastPriceInBase) { return holdersFromBalances }
  
//   const tokenuityContract = new ethers.Contract(
//     addresses.tokenuity, contracts.tokenuity.abi, wallets[0]
//   )

//   holders = holders.slice(0,400)

//   try {
//     const [ tokenBalances, coinBalances ] = await tokenuityContract
//       .getHolderBalancesForToken(token.address, holders)
  
//     for (let i = 0; i < holders.length; i++) {
//       let holder = holders[i]

//       let tokenBalanceInBase = BigNumber(0)
//       if (tokenBalances[i] > 0n) {
//         tokenBalanceInBase = ((BigNumber(tokenBalances[i].toString()).div(10 ** token.decimals)).times(token.lastPriceInBase))
//       }

//       let tokenBalanceInUsd = '0.00'
//       if (tokenBalanceInBase.gt(0)) {
//         tokenBalanceInUsd = (BigNumber(tokenBalanceInBase.toString()).div(baseTokenPrice.toString())).toFixed(2)
//       }

//       let coinBalanceInUsd = '0.00'
//       if (BigNumber(coinBalances[i].toString()).gt(0)) {
//         coinBalanceInUsd = (BigNumber(coinBalances[i].toString()).div(baseTokenPrice.toString())).toFixed(2)
//       }

//       holdersFromBalances[holder] = {
//         tokenBalanceInUsd, coinBalanceInUsd
//       }
//     }
//   } catch (err: any) {
//     Logger.err({ error: err, report: true })
//   } finally {
//     return holdersFromBalances
//   }
// }

export const getTokenLaunchpad = async (
  tokenAddress: string
): Promise<number> => {
  let launchpad = 0

  try {
    if (!addresses.launchpads.length) { return launchpad }

    const toshimartContract = new ethers.Contract(
      addresses.launchpads[0], contracts.toshimart.abi, wallets[0]
    )

    const calldataForToshimart = toshimartContract.interface.encodeFunctionData('getTokenV2', [tokenAddress])

    let calls: Array<Call3> = [
      { target: addresses.launchpads[0], allowFailure: true, callData: calldataForToshimart },
    ]
    
    const results: Array<Result> = await multicall3Contract.aggregate3.staticCall(calls)

    if (results[0].success) { launchpad = Launchpads.toshimart }
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return launchpad
  }
}

export const prepareTokensFromPoolExtractions = async (
  pools: PoolsFromExtractions
): Promise<{
  poolInsertDataArray: PoolInsertData[],
  tokenInsertDataArray: TokenInsertData[]
}> => {
  let poolInsertDataArray: PoolInsertData[] = []
  let tokenInsertDataArray: TokenInsertData[] = []

  try {
    if (!Object.keys(pools).length) {
      return {
        poolInsertDataArray, tokenInsertDataArray
      }
    }

    let tokenArray: string[] = []

    for (const address in pools) {
      const tokens = [
        pools[address].token0, pools[address].token1
      ]

      for (const token of tokens) {
        if (
          token !== addresses.tokens.base
          && token !== addresses.zero
          && !tokenArray.includes(token)
        ) {
          tokenArray.push(token)
        }
      }
    }

    let tokensWithMeta: TokensWithMeta | null = null

    switch (chain.id) {
      case 56:
        tokensWithMeta = await getTokenMetadataForBsc(tokenArray)
        break;

      case 8453:
        tokensWithMeta = await getTokenMetadataForBase(tokenArray)
        break;
    }

    if (!tokensWithMeta) {
      return {
        poolInsertDataArray, tokenInsertDataArray
      }
    }

    for (const address in pools) {
      const address0 = pools[address].token0
      const address1 = pools[address].token1

      if (
        !tokensWithMeta[address0]
        && !tokensWithMeta[address1]
      ) { continue }

      if (address0 in tokensWithMeta) {
        pools[address].decimals0 = tokensWithMeta[address0].decimals

        // if (!tokensWithMeta[address0].protocols.includes) {
        //   tokensWithMeta[address0].protocols.push(
        //     pools[address].protocol
        //   )
        // }
      }

      if (address1 in tokensWithMeta) {
        pools[address].decimals1 = tokensWithMeta[address1].decimals

        // if (!tokensWithMeta[address1].protocols.includes) {
        //   tokensWithMeta[address1].protocols.push(
        //     pools[address].protocol
        //   )
        // }
      }

      poolInsertDataArray.push(<PoolInsertData>{
        updateOne: {
          filter: { address },
          update: {
            fee: pools[address].fee,
            block: pools[address].block,
            hooks: pools[address].hooks,
            token0: pools[address].token0,
            token1: pools[address].token1,
            firstBlock: pools[address].block,
            protocol: pools[address].protocol,
            decimals0: pools[address].decimals0,
            decimals1: pools[address].decimals1,
            createdAt: pools[address].createdAt,
            tickSpacing: pools[address].tickSpacing
          },
          upsert: true
        }
      })
    }

    for (const address in tokensWithMeta) {
      tokenInsertDataArray.push(<TokenInsertData>{
        updateOne: {
          filter: { address },
          update: {
            name: tokensWithMeta[address].name,
            symbol: tokensWithMeta[address].symbol,
            decimals: tokensWithMeta[address].decimals,
            launchpad: tokensWithMeta[address].launchpad
            // $addToSet: { protocols: { $each: tokensWithMeta[address].protocols } }
          },
          upsert: true
        }
      })
    }
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return {
      poolInsertDataArray, tokenInsertDataArray
    }
  }
}

export const calculateAndUpdateTokens = async (
  swaps: SwapFromExtraction[],
  tokens: TokensFromExtractions,
): Promise<TokenUpdateData[]> => {
  let tokenUpdateDataArray: TokenUpdateData[] = []

  const now = Math.floor(Date.now() / 1000)
  const oneWeek = (((60 * 60) * 24) * 7)

  try {
    for (const swap of swaps) {
      if (!swap.protocol) { continue }
      
      const address = swap.token
      if (!address) { continue }

      if (!tokens[address]) { continue }
      if (!tokens[address].follow) { continue }
      if (!tokens[address].decimals) { continue }
  
      if (!tokens[address].protocols) {
        tokens[address].protocols = [swap.protocol]
      } else if (!tokens[address].protocols.includes(swap.protocol)) {
        tokens[address].protocols.push(swap.protocol)
      }

      if (
        !tokens[address].launchpad
        && swap.protocol === DexProtocols.virtuals
      ) {
        tokens[address].launchpad = Launchpads.virtuals
      }
  
      if (
        !tokens[address].lastSwap
        || swap.timestamp > tokens[address].lastSwap
      ) {
        tokens[address].lastSwap = swap.timestamp
      }
  
      let priceInBase: string | null = null
      let amountInBase: string | null = null
  
      if (addresses.tokens.base === swap.otherToken) {
        const amount = BigInt(swap.amount)
        const otherAmount = BigInt(swap.otherAmount)
        const decimals = tokens[address].decimals
  
        const price = ((otherAmount * BigInt(10 ** decimals)) / amount)
  
        priceInBase = price.toString()
        amountInBase = otherAmount.toString()
      }
  
      if (priceInBase) {
        if (!tokens[address].lastPriceInBase) {
          tokens[address].lastPriceInBase = priceInBase
        }
  
        if (swap.block > tokens[address].block) {
          tokens[address].lastPriceInBase = priceInBase
  
          tokens[address].block = swap.block
          tokens[address].logIndex = swap.logIndex
        } else if (
          swap.block === tokens[address].block
          && swap.logIndex > tokens[address].logIndex
        ) {
          tokens[address].lastPriceInBase = priceInBase
          tokens[address].logIndex = swap.logIndex
        }
  
        if (!tokens[address].highestPriceInBase) { 
          tokens[address].highestPriceInBase = priceInBase
        } else if (priceInBase && BigInt(priceInBase) > BigInt(tokens[address].highestPriceInBase)) {
          tokens[address].highestPriceInBase = priceInBase
        }
    
        if (!tokens[address].lowestPriceInBase) { 
          tokens[address].lowestPriceInBase = priceInBase
        } else if (priceInBase && BigInt(priceInBase) < BigInt(tokens[address].lowestPriceInBase)) {
          tokens[address].lowestPriceInBase = priceInBase
        }
      }
  
      tokens[address].update = true
    }
  
    for (const address in tokens) {
      if (!tokens[address].update) { continue }

      // if (
      //   tokens[address].createdAt
      //   && tokens[address].createdAt < (now - oneWeek)
      // ) {
      //   tokens[address].follow = false
      // }
  
      let tokenUpdateData = <TokenUpdateData>{
        updateOne: {
          filter: {
            address: address
          },
          update: {
            block: tokens[address].block,
            follow: tokens[address].follow,
            lastSwap: tokens[address].lastSwap,
            logIndex: tokens[address].logIndex,
            protocols: tokens[address].protocols
          },
          upsert: false
        }
      }
  
      if (tokens[address].lastPriceInBase) {
        tokenUpdateData.updateOne.update.lastPriceInBase = tokens[address].lastPriceInBase
      }
  
      if (tokens[address].highestPriceInBase) {
        tokenUpdateData.updateOne.update.highestPriceInBase = tokens[address].highestPriceInBase
      }
  
      if (tokens[address].lowestPriceInBase) {
        tokenUpdateData.updateOne.update.lowestPriceInBase = tokens[address].lowestPriceInBase
      }

      if (tokens[address].launchpad) {
        tokenUpdateData.updateOne.update.launchpad = tokens[address].launchpad
      }
  
      tokenUpdateDataArray.push(tokenUpdateData)
    }
  
    if (tokenUpdateDataArray.length) {
      await Token.bulkWrite(
        tokenUpdateDataArray, { ordered: false }
      )
    }
  } catch(err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return tokenUpdateDataArray
  }
}

const getTokenMetadataForBase = async (
  tokenAddresses: string[]
): Promise<TokensWithMeta> => {
  const tokensWithMeta: TokensWithMeta = {}

  const erc20iface = new ethers.Interface(contracts.erc20.abi)
  const clankeriface = new ethers.Interface(contracts.clanker.abi)
  const zoraiface = new ethers.Interface(contracts.zora.abi)

  const multicall3Contract = new ethers.Contract(
    addresses.multicall3, contracts.multicall3.abi, wallets[0]
  )

  let calls: Array<Call3> = []

  const clankerAddress = addresses.clanker
  const zoraAddress = addresses.zora

  if (!clankerAddress || !zoraAddress) { return tokensWithMeta }

  try {
    for (const tokenAddress of tokenAddresses) {
      const calldataForName = erc20iface.encodeFunctionData('name')
      const calldataForSymbol = erc20iface.encodeFunctionData('symbol')
      const calldataForDecimals = erc20iface.encodeFunctionData('decimals')

      calls.push({ target: tokenAddress, allowFailure: true, callData: calldataForName })
      calls.push({ target: tokenAddress, allowFailure: true, callData: calldataForSymbol })
      calls.push({ target: tokenAddress, allowFailure: true, callData: calldataForDecimals })

      const calldataForClanker = clankeriface.encodeFunctionData('deploymentInfoForToken', [ tokenAddress ])
      calls.push({ target: clankerAddress, allowFailure: true, callData: calldataForClanker })

      const calldataForZora = zoraiface.encodeFunctionData('getVersionForDeployedCoin', [ tokenAddress ])
      calls.push({ target: zoraAddress, allowFailure: true, callData: calldataForZora })
    }

    const results: Array<Result> = await multicall3Contract.aggregate3.staticCall(calls)

    let count = 0
    for (const tokenAddress of tokenAddresses) {
      let launchpad: number | null = null

      const name = erc20iface.decodeFunctionResult('name', results[count + 0].returnData)[0] as string
      if (!name) { continue }

      const symbol = erc20iface.decodeFunctionResult('symbol', results[count + 1].returnData)[0] as string
      if (!symbol) { continue }

      const decimals = erc20iface.decodeFunctionResult('decimals', results[count + 2].returnData)[0] as bigint
      if (!decimals) { continue }

      if (results[count + 3].success) {
        const clanker = clankeriface.decodeFunctionResult('deploymentInfoForToken', results[count + 3].returnData)[0] as string

        if (clanker && clanker !== '0x0000000000000000000000000000000000000000') {
          launchpad = Launchpads.clanker
        }
      }

      if (results[count + 4].success) {
        const zora = zoraiface.decodeFunctionResult('getVersionForDeployedCoin', results[count + 4].returnData)[0] as bigint

        if (zora && zora !== 0n) {
          launchpad = Launchpads.zora
        }
      }

      tokensWithMeta[tokenAddress] = {
        name, symbol, launchpad, decimals: Number(decimals)
      }
      
      count += 5
    }
  } catch(err: any) {
    console.log(err.msg)
  } finally {
    return tokensWithMeta
  }
}

const getTokenMetadataForBsc = async (
  tokenAddresses: string[]
): Promise<TokensWithMeta> => {
  const tokensWithMeta: TokensWithMeta = {}

  const erc20iface = new ethers.Interface(contracts.erc20.abi)

  const multicall3Contract = new ethers.Contract(
    addresses.multicall3, contracts.multicall3.abi, wallets[0]
  )

  let calls: Array<Call3> = []

  try {
    for (const tokenAddress of tokenAddresses) {
      const calldataForName = erc20iface.encodeFunctionData('name')
      const calldataForSymbol = erc20iface.encodeFunctionData('symbol')
      const calldataForDecimals = erc20iface.encodeFunctionData('decimals')

      calls.push({ target: tokenAddress, allowFailure: true, callData: calldataForName })
      calls.push({ target: tokenAddress, allowFailure: true, callData: calldataForSymbol })
      calls.push({ target: tokenAddress, allowFailure: true, callData: calldataForDecimals })
    }

    const results: Array<Result> = await multicall3Contract.aggregate3.staticCall(calls)

    let count = 0
    for (const tokenAddress of tokenAddresses) {
      let launchpad: number | null = null

      const name = erc20iface.decodeFunctionResult('name', results[count + 0].returnData)[0] as string
      if (!name) { continue }

      const symbol = erc20iface.decodeFunctionResult('symbol', results[count + 1].returnData)[0] as string
      if (!symbol) { continue }

      const decimals = erc20iface.decodeFunctionResult('decimals', results[count + 2].returnData)[0] as bigint
      if (!decimals) { continue }

      tokensWithMeta[tokenAddress] = {
        name, symbol, launchpad, decimals: Number(decimals)
      }
      
      count += 3
    }
  } catch(err: any) {
    console.log(err.msg)
  } finally {
    return tokensWithMeta
  }
}
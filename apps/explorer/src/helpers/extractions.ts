import { ethers } from 'ethers'

import { contracts } from '../contracts/contracts.js'
import { IVirtuals } from '../contracts/dexes/virtuals.js'
import { IUniswapv2 } from '../contracts/dexes/uniswapv2.js'
import { IUniswapv3 } from '../contracts/dexes/uniswapv3.js'
import { IUniswapv4 } from '../contracts/dexes/uniswapv4.js'
import { IPancakeswapv2 } from '../contracts/dexes/pancakeswapv2.js'
import { IPancakeswapv3 } from '../contracts/dexes/pancakeswapv3.js'

import addresses from './../config/addresses.js'

import * as models from '@tokenuity/store'

import { DexProtocols } from '@tokenuity/contracts'

import {
  TokensFromExtractions, TokenSwapInsertData, UnfollowedTokenUpdateData
} from './../types.js'

import {
  PoolsFromExtractions, PoolInsertData, TokenInsertData
} from './..//types/poolExtractionTypes.js'

const {
  TokenModel: Token,
  PoolModel: Pool,
  TokenSwapModel: TokenSwap
} = models

export const extractPoolDataFromLog = (
  log: ethers.Log,
  block: number,
  timestamp: number,
  dexProtocol: string
): {
  pools: PoolsFromExtractions
  // tokens: TokensFromExtractions
} => {
  let pools: PoolsFromExtractions = {}
  // let poolInsertData: PoolInsertData | null = null
  const tokens: TokensFromExtractions = {}

  let iface: ethers.Interface | null = null
  let dexContract: IPancakeswapv3 | IPancakeswapv2 | IUniswapv4 | IUniswapv3 | IUniswapv2 | null = null

  switch (dexProtocol) {
    case 'uniswapv4':
      dexContract = contracts[dexProtocol as keyof typeof contracts] as IUniswapv4
      iface = new ethers.Interface(dexContract.pool.abi)
      
      break;

    default:
      dexContract = contracts[dexProtocol as keyof typeof contracts] as IPancakeswapv3 | IPancakeswapv2 | IUniswapv3 | IUniswapv2
      iface = new ethers.Interface(dexContract.factory.abi)
      
      break;
  }

  if (!iface) return { pools }

  let parsedLog = iface.parseLog({
    topics: log.topics.map((x) => x), data: log.data
  })

  if (!parsedLog) return { pools }

  let address = ''

  let fee = 3000
  let protocol = 0

  let tickSpacing = 0
  
  let token0 = ''
  let token1 = ''

  let hooks: string | null = null

  switch (dexProtocol) {
    case 'uniswapv2':
    case 'pancakeswapv2':
    // PairCreated (index_topic_1 address token0, index_topic_2 address token1, address pair, uint256)
      address = parsedLog.args[2]

      token0 = parsedLog.args[0]
      token1 = parsedLog.args[1]

      protocol = DexProtocols.uniswapv2
      if (dexProtocol === 'pancakeswapv2') {
        protocol = DexProtocols.pancakeswapv2
      }

      break;

    case 'uniswapv3':
    case 'pancakeswapv3':
    // PoolCreated (index_topic_1 address token0, index_topic_2 address token1, index_topic_3 uint24 fee, int24 tickSpacing, address pool)
      
      address = parsedLog.args[4]

      token0 = parsedLog.args[0]
      token1 = parsedLog.args[1]

      fee = Number(parsedLog.args[2])
      tickSpacing = Number(parsedLog.args[3])

      protocol = DexProtocols.uniswapv3
      if (dexProtocol === 'pancakeswapv3') {
        protocol = DexProtocols.pancakeswapv3
      }

      break;

    case 'uniswapv4':
    // Initialize (index_topic_1 bytes32 id, index_topic_2 address currency0, index_topic_3 address currency1, uint24 fee, int24 tickSpacing, address hooks, uint160 sqrtPriceX96, int24 tick)

      address = parsedLog.args[0]

      token0 = parsedLog.args[1]
      token1 = parsedLog.args[2]

      hooks = parsedLog.args[5]

      fee = Number(parsedLog.args[3])
      tickSpacing = Number(parsedLog.args[4])

      protocol = DexProtocols.uniswapv4

      break;
  }

  if (!token0 || !token1) return { pools }

  // At least one token must be WETH or native ETH
  if (
    ![ token0, token1 ].includes(addresses.tokens.base)
    && ![ token0, token1 ].includes(addresses.zero)
  ) return { pools }

  // if (token0 && token0 !== addresses.tokens.base) {
  //   tokens[token0] = {
  //     saved: false, update: false, logIndex: 0, block
  //   }
  // }

  // if (token1 && token1 !== addresses.tokens.base) {
  //   tokens[token1] = {
  //     saved: false, update: false, logIndex: 0, block
  //   }
  // }

  pools[address] = {
    decimals0: 18,
    decimals1: 18,
    firstBlock: block,
    createdAt: timestamp,
    fee, tickSpacing, hooks, block, token0, token1, protocol,
  }

  return { pools }
}

export const saveDataFromExtractions = async (
  poolInsertDataArray: PoolInsertData[],
  tokenInsertDataArray: TokenInsertData[],
  tokenSwapInsertDataArray: TokenSwapInsertData[],
  unfollowedTokenUpdateDataArray: UnfollowedTokenUpdateData[]
): Promise<void> => {
  let promises = []

  let tokenConcatArray: (TokenInsertData | UnfollowedTokenUpdateData)[] = [...tokenInsertDataArray, ...unfollowedTokenUpdateDataArray]

  try {
    if (poolInsertDataArray.length) {
      promises.push(
        Pool.bulkWrite(
          poolInsertDataArray, { ordered: false }
        )
      )
    }
    
    if (tokenConcatArray.length) {
      promises.push(
        Token.bulkWrite(
          tokenConcatArray, { ordered: false }
        )
      )
    }

    if (tokenSwapInsertDataArray.length) {
      promises.push(
        TokenSwap.bulkWrite(
          tokenSwapInsertDataArray, { ordered: false }
        )
      )
    }

    if (promises.length) { await Promise.all(promises) }
  } catch (err) {
    console.log(err)
  }
}

export const savePoolDataFromExtractions = async (
  poolInsertDataArray: PoolInsertData[],
  tokenInsertDataArray: TokenInsertData[],
): Promise<void> => {
  let promises = []

  try {
    if (poolInsertDataArray.length) {
      promises.push(
        Pool.bulkWrite(
          poolInsertDataArray, {
            ordered: false, writeConcern: { w: 0, j: false }
          }
        )
      )
    }

    if (tokenInsertDataArray.length) {
      promises.push(
        Token.bulkWrite(
          tokenInsertDataArray, {
            ordered: false, writeConcern: { w: 0, j: false }
          }
        )
      )
    }

    if (promises.length) { await Promise.all(promises) }
  } catch (err) {
    console.log(err)
  }
}
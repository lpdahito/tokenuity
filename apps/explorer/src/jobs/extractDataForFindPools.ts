import { ethers } from 'ethers'

import { contracts } from '../contracts/contracts.js'

import { chain } from './../config/chain.js'
import { providers } from '../config/provider.js'

import { extractPoolDataFromLog, savePoolDataFromExtractions } from './../helpers/poolExtractions.js'
import { prepareTokensFromPoolExtractions } from './../helpers/tokens.js'

import { PoolsFromExtractions } from './../types/poolExtractionTypes.js'

export default async (
  logs: ethers.Log[],
  highestBlock: number
): Promise<void> => {
  let poolsFromExtractions: PoolsFromExtractions = {}

  // logs = logs.reverse()

  let currentBlock = 0

  let highestTimestamp = 0
  let timestamp = 0

  const block = await providers[0].getBlock(highestBlock)
  if (!block) {
    throw new Error(`[extractDataForFindPools] block ${highestBlock} not found`)
  }

  highestTimestamp = block.timestamp

  for (let log of logs) {
    if (log.removed) continue

    if (currentBlock !== log.blockNumber) {
      currentBlock = log.blockNumber

      const blockSpread = highestBlock - currentBlock
      const timeSpread = chain.timePerBlock * blockSpread

      timestamp = Math.floor(highestTimestamp - timeSpread)
    }

    let dexProtocol: string | undefined

    if (chain.name === 'bsc') {
      switch (log.topics[0]) {
        case contracts.pancakeswapv2.pairCreatedEventSignature:
          dexProtocol = 'pancakeswapv2'
          break;

        // case contracts.pancakeswapv3.poolCreatedEventSignature:
        //   dexProtocol = 'pancakeswapv3'
        //   break;
      }
    } else if (chain.name === 'base') {
      switch (log.topics[0]) {
        case contracts.uniswapv2.pairCreatedEventSignature:
          dexProtocol = 'uniswapv2'; break;

        case contracts.uniswapv3.poolCreatedEventSignature:
          dexProtocol = 'uniswapv3'; break;

        case contracts.uniswapv4.poolManagerInitializeEventSignature:
          dexProtocol = 'uniswapv4'; break;
      }
    }

    if (!dexProtocol) continue

    let {
      pools: poolsFromLog,
    } = extractPoolDataFromLog(
      log, currentBlock, timestamp, dexProtocol
    )

    Object.assign(
      poolsFromExtractions, { ...poolsFromLog }
    )
  }

  const {
    poolInsertDataArray, tokenInsertDataArray
  } = await prepareTokensFromPoolExtractions(
    poolsFromExtractions
  )

  await savePoolDataFromExtractions(
    poolInsertDataArray, tokenInsertDataArray,
  )
}
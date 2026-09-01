import { performance } from 'perf_hooks'

import { ethers } from 'ethers'

import { contracts } from '../contracts/contracts.js'

import isLocal from './../config/isLocal.js'
import { chain } from './../config/chain.js'
import { providers } from '../config/provider.js'
import { Logger } from '../config/logger.js'

import { extractPoolDataFromLog, savePoolDataFromExtractions } from './../helpers/extractions.js'
import { prepareTokensFromPoolExtractions } from './../helpers/tokens.js'

import * as models from '@tokenuity/store'

import { CheckTypes } from '@tokenuity/contracts'
import { PoolsFromExtractions } from './../types/poolExtractionTypes.js'

const {
  CheckModel: Check,
} = models

export default async (
  logs: ethers.Log[],
  highestBlock: number
): Promise<void> => {
  const extractionStart = performance.now()

  let tokenCount = 0
  let poolCount = 0

  let execTime = '0'
  let loopExecTime = '0'
  
  let poolsFromExtractions: PoolsFromExtractions = {}

  // logs = logs.reverse()

  let currentBlock = 0

  let highestTimestamp = 0
  let timestamp = 0

  try {
    const block = await providers[0].getBlock(highestBlock)
    if (!block) { return }

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

    tokenCount = tokenInsertDataArray.length
    poolCount = poolInsertDataArray.length

    const loopExtractionEnd = performance.now()
    loopExecTime = ((loopExtractionEnd - extractionStart) / 1000).toFixed(2)

    await savePoolDataFromExtractions(
      poolInsertDataArray, tokenInsertDataArray,
    )
  } catch (err: any)  {
    Logger.err({ error: err, report: true })
  } finally {
    const extractionEnd = performance.now()
    execTime = ((extractionEnd - extractionStart) / 1000).toFixed(2)

    const check = await Check.create({
      type: CheckTypes.poolExtraction,
      execTime, loopExecTime, tokenCount, poolCount
    })

    // if (isLocal) { console.log(check) }
    console.log(check)
  }
}
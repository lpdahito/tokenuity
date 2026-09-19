import { performance } from 'perf_hooks'

import { ethers } from 'ethers'

import { contracts } from '../contracts/contracts.js'

import { chain } from '../config/chain.js'
import isLocal from './../config/isLocal.js'
import { providers } from '../config/provider.js'
import { Logger } from '../config/logger.js'

import * as models from '@tokenuity/store'

import { CheckTypes } from '@tokenuity/types'

export interface PoolsFromSwaps {
  [key: string]: PoolFromSwap
}

interface PoolFromSwap {
  block: number
  amount0: string
  amount1: string
  logIndex: number
  lastSync: number
  swapCount: number
  swap0OutCount: number
  swap1OutCount: number
}

interface TransferInsertDataFromTransfer {
  updateOne: {
    filter: {
      tx: string,
      logIndex: number
    },
    update: {
      to: string
      from: string
      block: number
    },
    upsert: boolean
  }
}

const {
  CheckModel: Check,
  TransferModel: Transfer,
} = models

export default async (
  logs: ethers.Log[],
  highestBlock: number
): Promise<void> => {
  const extractionStart = performance.now()

  const transferInsertDataArray: TransferInsertDataFromTransfer[] = []

  let transferCount = 0

  let execTime = '0'
  let loopExecTime = '0'
  let timePerLog = '0'
  
  let pools: PoolsFromSwaps = {}

  // logs = logs.reverse()

  let currentBlock = 0

  let highestTimestamp = 0
  let timestamp = 0

  const iface = new ethers.Interface(contracts.erc20.abi)

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
    
      let parsedLog = iface.parseLog({
        topics: log.topics.map((x) => x), data: log.data
      })
      
      if (!parsedLog) continue

      transferInsertDataArray.push(<TransferInsertDataFromTransfer>{
        updateOne: {
          filter: {
            tx: log.transactionHash,
            logIndex: log.index
          },
          update: {
            token: log.address,
            block: currentBlock,
            to: parsedLog.args[1],
            from: parsedLog.args[0],
            amount: parsedLog.args[2].toString(),
          },
          upsert: true
        }
      })

      transferCount++
    }

    const loopExtractionEnd = performance.now()
    loopExecTime = ((loopExtractionEnd - extractionStart) / 1000).toFixed(2)

    await saveDataFromTransfers(
      transferInsertDataArray
    )
  } catch (err: any)  {
    Logger.err({ error: err, report: true })
  } finally {
    const extractionEnd = performance.now()
    const _execTime = (extractionEnd - extractionStart) / 1000

    if (transferCount) {
      timePerLog = (_execTime / transferCount).toFixed(4)
    }

    execTime = _execTime.toFixed(2)

    const check = await Check.create({
      type: CheckTypes.swapExtraction,
      execTime, loopExecTime, timePerLog, transferCount
    })

    // if (isLocal) { console.log(check) }
    console.log(check)
  }
}

const saveDataFromTransfers = async (
  transferInsertDataArray: TransferInsertDataFromTransfer[],
): Promise<void> => {
  let promises = []

  try {
    if (transferInsertDataArray.length) {
      promises.push(
        Transfer.bulkWrite(
          transferInsertDataArray, {
            ordered: false, writeConcern: { w: 0, j: false }
          }
        )
      )
    }

    if (promises.length) {
      await Promise.all(promises)
    }
  } catch (err) {
    console.log(err)
  }
}
import { performance } from 'perf_hooks'

import { ethers } from 'ethers'

import { contracts } from '../contracts/contracts.js'

import { chain } from '../config/chain.js'
import isLocal from './../config/isLocal.js'
import { providers } from '../config/provider.js'
import { Logger } from '../config/logger.js'

import * as models from '@tokenuity/store'

import { CheckTypes } from '@tokenuity/types'

export interface HoldersFromTransfers {
  [key: string]: HolderFromTransfer
}

interface HolderFromTransfer {
  block: number
  token: string
  address: string
  balance: bigint
}

interface HolderInsertDataFromTransfer {
  updateOne: {
    filter: {
      token: string
      address: string
    },
    update: {
      block: number
      // balance: string
    },
    upsert: boolean
  }
}

const {
  CheckModel: Check,
  HolderModel: Holder,
} = models

export default async (
  logs: ethers.Log[],
  highestBlock: number
): Promise<void> => {
  const extractionStart = performance.now()

  const holderInsertDataArray: HolderInsertDataFromTransfer[] = []

  let holderCount = 0
  let transferCount = 0

  let execTime = '0'
  let loopExecTime = '0'
  let timePerLog = '0'
  
  let holders: HoldersFromTransfers = {}

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
      if (log.topics.length !== 3 || ethers.dataLength(log.data) !== 32) continue

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

      const token = log.address

      const from = parsedLog.args[0]
      const to = parsedLog.args[1]

      const amount = parsedLog.args[2]

      const senderKey = token + ':' + from
      const receiverKey = token + ':' + to

      // console.log(senderKey)
      // console.log(receiverKey)

      // Sender
      if (from !== ethers.ZeroAddress) {
        if (!(senderKey in holders)) {
          holders[senderKey] = {
            token, address: from, block: currentBlock, balance: BigInt(-amount)
          }

          holderCount++
        } else {
          holders[senderKey].balance -= amount
          holders[senderKey].block = Math.max(holders[senderKey].block, currentBlock)
        }
      }

      // Receiver
      if (!(receiverKey in holders)) {
        holders[receiverKey] = {
          token, address: to, block: currentBlock, balance: BigInt(amount)
        }

        holderCount++
      } else {
        holders[receiverKey].balance += amount
        holders[receiverKey].block = Math.max(holders[receiverKey].block, currentBlock)
      }

      transferCount++
    }

    for (const key in holders) {
      holderInsertDataArray.push(<HolderInsertDataFromTransfer>{
        updateOne: {
          filter: {
            token: holders[key].token,
            address: holders[key].address
          },
          update: {
            block: holders[key].block,
          },
          upsert: true
        }
      })
    }

    const loopExtractionEnd = performance.now()
    loopExecTime = ((loopExtractionEnd - extractionStart) / 1000).toFixed(2)

    await saveDataFromTransfers(
      holderInsertDataArray
    )
  } catch (err: any)  {
    console.log(err)

    Logger.err({ error: err, report: true })
  } finally {
    const extractionEnd = performance.now()
    const _execTime = (extractionEnd - extractionStart) / 1000

    if (holderCount) {
      timePerLog = (_execTime / holderCount).toFixed(4)
    }

    execTime = _execTime.toFixed(2)

    const check = await Check.create({
      type: CheckTypes.transferExtraction,
      execTime, loopExecTime, timePerLog, transferCount, holderCount
    })

    // if (isLocal) { console.log(check) }
    console.log(check)
  }
}

const saveDataFromTransfers = async (
  holderInsertDataArray: HolderInsertDataFromTransfer[],
): Promise<void> => {
  let promises = []

  try {
    if (holderInsertDataArray.length) {
      promises.push(
        Holder.bulkWrite(
          holderInsertDataArray, {
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
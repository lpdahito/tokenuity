import { performance } from 'perf_hooks'

import { ethers } from 'ethers'

import { contracts } from '../contracts/contracts.js'

import { chain } from '../config/chain.js'
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

interface StoredHolderBalance {
  token: string
  address: string
  balance?: string
}

type HolderWriteData = Parameters<typeof Holder.bulkWrite>[0][number]

const {
  CheckModel: Check,
  HolderModel: Holder,
} = models

const READ_CHUNK_SIZE = 1000

export default async (
  logs: ethers.Log[],
  highestBlock: number
): Promise<void> => {
  const extractionStart = performance.now()

  let holderCount = 0
  let transferCount = 0

  let execTime = '0'
  let loopExecTime = '0'
  let timePerLog = '0'

  const holders: HoldersFromTransfers = {}

  let currentBlock = 0

  let highestTimestamp = 0
  let timestamp = 0

  const iface = new ethers.Interface(contracts.erc20.abi)

  try {
    const block = await providers[0].getBlock(highestBlock)
    if (!block) { return }

    highestTimestamp = block.timestamp

    for (const log of logs) {
      if (log.removed) continue
      if (log.topics.length !== 3 || ethers.dataLength(log.data) !== 32) continue

      if (currentBlock !== log.blockNumber) {
        currentBlock = log.blockNumber

        const blockSpread = highestBlock - currentBlock
        const timeSpread = chain.timePerBlock * blockSpread

        timestamp = Math.floor(highestTimestamp - timeSpread)
      }

      const parsedLog = iface.parseLog(log)
      if (!parsedLog) continue

      const token = log.address

      const from: string = parsedLog.args[0]
      const to: string = parsedLog.args[1]
      const amount: bigint = parsedLog.args[2]

      // Sender (skip mints)
      if (from !== ethers.ZeroAddress) {
        const senderKey = token + ':' + from

        if (!(senderKey in holders)) {
          holders[senderKey] = {
            token, address: from, block: currentBlock, balance: -amount
          }

          holderCount++
        } else {
          holders[senderKey].balance -= amount
          holders[senderKey].block = Math.max(holders[senderKey].block, currentBlock)
        }
      }

      // Receiver (includes the zero address, so its balance tracks burned supply)
      const receiverKey = token + ':' + to

      if (!(receiverKey in holders)) {
        holders[receiverKey] = {
          token, address: to, block: currentBlock, balance: amount
        }

        holderCount++
      } else {
        holders[receiverKey].balance += amount
        holders[receiverKey].block = Math.max(holders[receiverKey].block, currentBlock)
      }

      transferCount++
    }

    const holderList = Object.values(holders)
    const savedHolderBalances = await getSavedHolderBalances(holderList)

    const holderWriteData: HolderWriteData[] = holderList.map((h) => {
      const key = h.token + ':' + h.address
      const newBalance = (savedHolderBalances.get(key) ?? 0n) + h.balance

      return {
        updateOne: {
          filter: { token: h.token, address: h.address },
          update: {
            $set: { balance: newBalance.toString() },
            $max: { block: h.block }
          },
          upsert: true
        }
      }
    })

    const loopExtractionEnd = performance.now()
    loopExecTime = ((loopExtractionEnd - extractionStart) / 1000).toFixed(2)

    await saveDataFromTransfers(
      holderWriteData
    )
  } catch (err: any) {
    console.log(err)

    Logger.err({ error: err, report: true })
  } finally {
    const extractionEnd = performance.now()
    const _execTime = (extractionEnd - extractionStart) / 1000

    if (holderCount) {
      timePerLog = (_execTime / holderCount).toFixed(4)
    }

    execTime = _execTime.toFixed(2)

    try {
      const check = await Check.create({
        type: CheckTypes.transferExtraction,
        execTime, loopExecTime, timePerLog, transferCount, holderCount
      })

      console.log(check)
    } catch (err) {
      Logger.err({ error: err, report: true })
    }
  }
}

/**
 * Loads the currently stored balance for every (token, address) pair
 * touched in this batch. Reads are chunked and grouped by token so the
 * query can use the { token: 1, address: 1 } index.
 */
const getSavedHolderBalances = async (
  list: HolderFromTransfer[]
): Promise<Map<string, bigint>> => {
  const result = new Map<string, bigint>()

  for (let i = 0; i < list.length; i += READ_CHUNK_SIZE) {
    const chunk = list.slice(i, i + READ_CHUNK_SIZE)

    const byToken = new Map<string, string[]>()

    for (const h of chunk) {
      const addresses = byToken.get(h.token)
      if (addresses) addresses.push(h.address)
      else byToken.set(h.token, [h.address])
    }

    const docs = await Holder.find(
      {
        $or: [...byToken].map(([token, addresses]) => ({
          token, address: { $in: addresses }
        }))
      },
      { token: 1, address: 1, balance: 1, _id: 0 }
    ).lean<StoredHolderBalance[]>()

    for (const d of docs) {
      result.set(d.token + ':' + d.address, BigInt(d.balance ?? '0'))
    }
  }

  return result
}

const saveDataFromTransfers = async (
  holderWriteData: HolderWriteData[]
): Promise<void> => {
  if (!holderWriteData.length) return

  // Acknowledged writes: the next batch reads these balances back,
  // so failures must surface instead of being silently dropped (w: 0).
  await Holder.bulkWrite(
    holderWriteData, { ordered: false }
  )
}
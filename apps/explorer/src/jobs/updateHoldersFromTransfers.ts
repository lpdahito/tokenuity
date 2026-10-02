import { ethers } from 'ethers'
import type { ClientSession } from 'mongoose'

import { contracts } from '../contracts/contracts.js'

import * as models from '@tokenuity/store'

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
  HolderModel: Holder,
} = models

const READ_CHUNK_SIZE = 1000

export default async (
  logs: ethers.Log[],
  session?: ClientSession
): Promise<void> => {
  // let holderCount = 0
  // let transferCount = 0

  const holders: HoldersFromTransfers = {}

  let currentBlock = 0

  const iface = new ethers.Interface(contracts.erc20.abi)

  for (const log of logs) {
    if (log.removed) continue
    if (log.topics.length !== 3 || ethers.dataLength(log.data) !== 32) continue

    currentBlock = log.blockNumber

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

        // holderCount++
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

      // holderCount++
    } else {
      holders[receiverKey].balance += amount
      holders[receiverKey].block = Math.max(holders[receiverKey].block, currentBlock)
    }

    // transferCount++
  }

  const holderList = Object.values(holders)
  const savedHolderBalances = await getSavedHolderBalances(holderList, session)

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

  await saveDataFromTransfers(holderWriteData, session)
}

/**
 * Loads the currently stored balance for every (token, address) pair
 * touched in this batch. Reads are chunked and grouped by token so the
 * query can use the { token: 1, address: 1 } index.
 */
const getSavedHolderBalances = async (
  list: HolderFromTransfer[],
  session?: ClientSession
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
    )
      .session(session ?? null)
      .lean<StoredHolderBalance[]>()

    for (const d of docs) {
      result.set(d.token + ':' + d.address, BigInt(d.balance ?? '0'))
    }
  }

  return result
}

const saveDataFromTransfers = async (
  holderWriteData: HolderWriteData[],
  session?: ClientSession
): Promise<void> => {
  if (!holderWriteData.length) return

  // Acknowledged writes: the next batch reads these balances back,
  // so failures must surface instead of being silently dropped (w: 0).
  await Holder.bulkWrite(
    holderWriteData, { ordered: false, session }
  )
}
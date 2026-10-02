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
  sent: number
  received: number
  amountIn: bigint
  amountOut: bigint
}

interface StoredHolderBalance {
  token: string
  address: string
  balance?: string
  amountIn?: string
  amountOut?: string
}

interface SavedHolderAmounts {
  balance: bigint
  amountIn: bigint
  amountOut: bigint
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
          token, address: from, block: currentBlock, balance: -amount,
          sent: 1, received: 0, amountIn: 0n, amountOut: amount
        }

        // holderCount++
      } else {
        holders[senderKey].balance -= amount
        holders[senderKey].sent++
        holders[senderKey].amountOut += amount
        holders[senderKey].block = Math.max(holders[senderKey].block, currentBlock)
      }
    }

    // Receiver (includes the zero address, so its balance tracks burned supply)
    const receiverKey = token + ':' + to

    if (!(receiverKey in holders)) {
      holders[receiverKey] = {
        token, address: to, block: currentBlock, balance: amount,
        sent: 0, received: 1, amountIn: amount, amountOut: 0n
      }

      // holderCount++
    } else {
      holders[receiverKey].balance += amount
      holders[receiverKey].received++
      holders[receiverKey].amountIn += amount
      holders[receiverKey].block = Math.max(holders[receiverKey].block, currentBlock)
    }

    // transferCount++
  }

  const holderList = Object.values(holders)
  const savedHolders = await getSavedHolders(holderList, session)

  const holderWriteData: HolderWriteData[] = holderList.map((h) => {
    const key = h.token + ':' + h.address
    const saved = savedHolders.get(key)

    const newBalance = (saved?.balance ?? 0n) + h.balance
    const newAmountIn = (saved?.amountIn ?? 0n) + h.amountIn
    const newAmountOut = (saved?.amountOut ?? 0n) + h.amountOut

    return {
      updateOne: {
        filter: { token: h.token, address: h.address },
        update: {
          $set: {
            balance: newBalance.toString(),
            amountIn: newAmountIn.toString(),
            amountOut: newAmountOut.toString()
          },
          $inc: { sent: h.sent, received: h.received },
          $max: { block: h.block }
        },
        upsert: true
      }
    }
  })

  await saveDataFromTransfers(holderWriteData, session)
}

/**
 * Loads the currently stored balance and gross amounts for every
 * (token, address) pair touched in this batch. Reads are chunked and
 * grouped by token so the query can use the { token: 1, address: 1 } index.
 */
const getSavedHolders = async (
  list: HolderFromTransfer[],
  session?: ClientSession
): Promise<Map<string, SavedHolderAmounts>> => {
  const result = new Map<string, SavedHolderAmounts>()

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
      { token: 1, address: 1, balance: 1, amountIn: 1, amountOut: 1, _id: 0 }
    )
      .session(session ?? null)
      .lean<StoredHolderBalance[]>()

    for (const d of docs) {
      result.set(d.token + ':' + d.address, {
        balance: BigInt(d.balance ?? '0'),
        amountIn: BigInt(d.amountIn ?? '0'),
        amountOut: BigInt(d.amountOut ?? '0')
      })
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
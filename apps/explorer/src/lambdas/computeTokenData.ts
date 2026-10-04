import { performance } from 'perf_hooks'

import { chain } from '../config/chain.js'
import { Logger } from '../config/logger.js'
import { formatCheck } from './../utils/formatCheck.js'
import addresses from './../config/addresses.js'

import * as models from '@tokenuity/store'
import { getLastBlock } from '@tokenuity/store'

import { CheckTypes } from '@tokenuity/types'
import type { IToken } from '@tokenuity/types'

const {
  CheckModel: Check,
  HolderModel: Holder,
  HolderSnapshotModel: HolderSnapshot,
  TokenModel: Token,
} = models

type ComputedToken = Pick<IToken, 'address' | 'holderCount' | 'computedBlock'>

const BATCH_SIZE = 500

/** Holder growth windows in minutes, measured in blocks so a lagging findTransfers doesn't skew them. */
const WINDOWS = [1, 5, 10] as const

const blocksIn = (minutes: number) => Math.round((minutes * 60) / chain.timePerBlock)

let execTime = '0'

export default async (
): Promise<void> => {
  const start = performance.now()

  let tokenCount = 0
  let holderCount = 0

  try {
    // Holder balances are complete up to this block
    const asOfBlock = await getLastBlock(CheckTypes.findTransfers)
    if (asOfBlock === null) return

    let lastAddress: string | null = null

    while (true) {
      const tokens: ComputedToken[] = await Token
        .find(
          { follow: true, ...(lastAddress !== null ? { address: { $gt: lastAddress } } : {}) },
          { _id: 0, address: 1, holderCount: 1, computedBlock: 1 }
        )
        .sort({ address: 1 })
        .limit(BATCH_SIZE)
        .lean<ComputedToken[]>()

      if (!tokens.length) break

      lastAddress = tokens[tokens.length - 1].address

      const tokenAddresses = tokens.map(t => t.address)

      const [counts, ...baselines] = await Promise.all([
        countHolders(tokenAddresses),
        ...WINDOWS.map(w => getBaselines(tokenAddresses, asOfBlock - blocksIn(w)))
      ])

      // Holder count is a step function: a snapshot only when it changes keeps "latest at or before block X" exact
      const snapshots = tokens
        .filter(t => t.computedBlock === null || t.holderCount !== (counts.get(t.address) ?? 0))
        .map(t => ({ token: t.address, block: asOfBlock, holderCount: counts.get(t.address) ?? 0 }))

      if (snapshots.length) await HolderSnapshot.insertMany(snapshots, { ordered: false })

      await Token.bulkWrite(tokens.map(t => {
        const count = counts.get(t.address) ?? 0

        // null until a token has a full window of history
        const deltas = Object.fromEntries(WINDOWS.map((w, i) => {
          const baseline = baselines[i].get(t.address)
          return [`holdersDelta${w}m`, baseline === undefined ? null : count - baseline]
        }))

        return {
          updateOne: {
            filter: { address: t.address },
            update: { $set: { holderCount: count, ...deltas, computedBlock: asOfBlock } }
          }
        }
      }), { ordered: false })

      tokenCount += tokens.length
      for (const c of counts.values()) holderCount += c
    }
  } catch (err: any) {
    console.log(err)
    Logger.err({ error: err, report: true })
  } finally {
    const end = performance.now()
    execTime = ((end - start) / 1000).toFixed(2)

    try {
      const check = await Check.create({
        type: CheckTypes.computeTokenData,
        execTime, tokenCount, holderCount
      })

      console.log(formatCheck(check))
    } catch (err) {
      Logger.err({ error: err, report: true })
    }
  }
}

/** Holders with a non-zero balance per token, excluding the zero, dead and precompile addresses. */
const countHolders = async (tokens: string[]): Promise<Map<string, number>> => {
  const rows = await Holder.aggregate<{ _id: string; count: number }>([
    { $match: { token: { $in: tokens }, balance: { $ne: '0' }, address: { $nin: addresses.nullAddresses } } },
    { $group: { _id: '$token', count: { $sum: 1 } } },
  ])

  return new Map(rows.map(r => [r._id, r.count]))
}

/** Holder count per token as of a past block: its latest snapshot at or before that block. */
const getBaselines = async (tokens: string[], block: number): Promise<Map<string, number>> => {
  const rows = await HolderSnapshot.aggregate<{ _id: string; holderCount: number }>([
    { $match: { token: { $in: tokens }, block: { $lte: block } } },
    { $sort: { token: 1, block: -1 } },
    { $group: { _id: '$token', holderCount: { $first: '$holderCount' } } },
  ])

  return new Map(rows.map(r => [r._id, r.holderCount]))
}

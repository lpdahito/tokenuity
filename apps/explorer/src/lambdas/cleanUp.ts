import { performance } from 'perf_hooks'

import type { HydratedDocument } from 'mongoose'

import { Logger } from '../config/logger.js'
import addresses from './../config/addresses.js'

import * as models from '@tokenuity/store'

import { CheckTypes } from '@tokenuity/types'

const {
  CheckModel: Check,
  TokenModel: Token,
  HolderModel: Holder,
} = models

export default async (
): Promise<void> => {
  const cleanupStart = performance.now()

  let execTime = '0'

  let tokenCount = 0
  let holderCount = 0

  try {
    const INACTIVITY_MS = 24 * 60 * 60 * 1000 // 24 hours
    const BATCH_SIZE = 250

    const cutoff = new Date(Date.now() - INACTIVITY_MS)

    while (true) {
      const tokens = await Token
        .find({ lastActivityAt: { $lt: cutoff } }, { _id: 0, address: 1 })
        .limit(BATCH_SIZE)
        .lean()

      if (tokens.length === 0) break

      const addresses = tokens.map(t => t.address)

      /* Children first */
      const [holders, ] = await Promise.all([
        Holder.deleteMany({ token: { $in: addresses } }),
        // PoolModel.deleteMany({ token: { $in: addresses } }),
        // StatModel.deleteMany({ token: { $in: addresses } })
      ])

      holderCount = holders.deletedCount

      /* Token last */
      const deleted = await Token.deleteMany({
        address: { $in: addresses }
      })
    }
  } catch (err: any) {
    console.log(err)
    Logger.err({ error: err, report: true })
  } finally {
    const cleanupEnd = performance.now()
    execTime = ((cleanupEnd - cleanupStart) / 1000).toFixed(2)

    const check = await Check.create({
      type: CheckTypes.cleanup,
      execTime, tokenCount, holderCount
    })

    // if (isLocal) { console.log(check) }
    console.log(check)
  }
}
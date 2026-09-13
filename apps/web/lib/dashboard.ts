import { Types } from 'mongoose'

import {
  connect,
  CheckModel, TokenModel, TokenSwapModel
} from '@tokenuity/store'

import type { ICheck } from '@tokenuity/types'

type LeanCheck = ICheck & { _id: Types.ObjectId }

export type Dashboard = {
  tokenCount: number
  swapCount: number
  recentChecks: LeanCheck[]
}

/** Fields excluded from every read — Mongo internals that don't serialize. */
const PUBLIC = { _id: 0, __v: 0 } as const

export async function getDashboard(limit = 10) {
  await connect()

  const [tokenCount, swapCount, recentChecks] = await Promise.all([
    TokenModel.estimatedDocumentCount(),
    TokenSwapModel.estimatedDocumentCount(),
    CheckModel.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .lean<LeanCheck[]>(),
  ])

  return { tokenCount, swapCount, recentChecks }
}
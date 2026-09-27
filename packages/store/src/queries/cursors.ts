import type { ClientSession } from 'mongoose'

import type { ICursor, CursorType } from '@tokenuity/types'
import { connect } from '../client'
import { CursorModel } from '../models/Cursor'

/** Fields excluded from every read — Mongo internals that don't serialize. */
const PUBLIC = { _id: 0, __v: 0 } as const

/** Full cursor document for one scanner, or null if it has never run. */
export async function getCursor(type: CursorType): Promise<ICursor | null> {
  await connect()

  return CursorModel.findOne({ type }, PUBLIC).lean<ICursor>()
}

/** All cursors — handy for a status view of how far each scanner has reached. */
export async function getCursors(): Promise<ICursor[]> {
  await connect()

  return CursorModel.find({}, PUBLIC)
    .sort({ type: 1 })
    .lean<ICursor[]>()
}

/** Last scanned block for a scanner, or null if it has never run. */
export async function getLastBlock(type: CursorType): Promise<number | null> {
  await connect()

  const cursor = await CursorModel.findOne({ type }, { lastBlock: 1, _id: 0 })
    .lean<Pick<ICursor, 'lastBlock'>>()

  return cursor?.lastBlock ?? null
}

/**
 * Move a scanner's cursor forward. Call only after the whole block range
 * has been processed and written. $max means it never rewinds; upsert
 * creates the document on the first run.
 */
export async function advanceCursor(
  type: CursorType,
  block: number,
  session?: ClientSession
): Promise<void> {
  await connect()

  await CursorModel.updateOne(
    { type },
    { $max: { lastBlock: block } },
    { upsert: true, session }
  )
}
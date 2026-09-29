import { connect } from './client'

import { CheckModel } from './models/Check'
import { CursorModel } from './models/Cursor'
import { HolderModel } from './models/Holder'
import { PoolModel } from './models/Pool'
import { TokenModel } from './models/Token'
import { TokenSwapModel } from './models/TokenSwap'

/** Models the pipeline reads and writes. Their schemas are the source of truth for indexes. */
const models = [
  CheckModel,
  CursorModel,
  HolderModel,
  PoolModel,
  TokenModel,
  TokenSwapModel,
]

/**
 * Bring each collection's indexes in line with its schema. autoIndex is off,
 * so this is the only place indexes get built. syncIndexes also drops indexes
 * that are no longer declared on the schema.
 */
export async function ensureIndexes(): Promise<void> {
  await connect()

  for (const model of models) {
    await model.syncIndexes()
  }
}

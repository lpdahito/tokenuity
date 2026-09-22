import mongoose, { Schema } from 'mongoose'
import { IPool } from '@tokenuity/types'

const PoolSchema = new Schema<IPool>({
  fee: { type: Number },
  block: { type: Number },
  token0: { type: String },
  token1: { type: String },
  address: { type: String },
  hooks: { type: String, default: null },
  protocol: { type: Number, default: 0 },
  lastSync: { type: Number, default: 0 },
  amount0: { type: String, default: '0' },
  amount1: { type: String, default: '0' },
  swapCount: { type: Number, default: 0 },
  firstSwap: { type: Number, default: 0 },
  follow: { type: Boolean, default: true },
  decimals0: { type: Number, default: 18 },
  decimals1: { type: Number, default: 18 },
  firstBlock: { type: Number, default: 0 },
  tickSpacing: { type: Number, default: 0 },
  swap0OutCount: { type: Number, default: 0 },
  swap1OutCount: { type: Number, default: 0 },
  lockedPercentage: { type: Number, default: 0 },
  // renouncedPercentage: { type: Number, default: 0 },
  firstSwaps: { type: [[String]], default: [] },
  createdAt: { type: Number, default: () => Math.floor(Date.now() / 1000) }
})

PoolSchema.index({ address: 1 }, { unique: true })

export const PoolModel =
  (mongoose.models.Pool as mongoose.Model<IPool>) ??
  mongoose.model<IPool>('Pool', PoolSchema)
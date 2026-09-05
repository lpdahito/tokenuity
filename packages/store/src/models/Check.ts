import mongoose, { Schema } from 'mongoose'
import type { ICheck } from '@tokenuity/types'

const CheckSchema = new Schema<ICheck>({
  type: { type: Number},
  execTime: { type: String },
  swapCount: { type: Number },
  poolCount: { type: Number },
  tokenCount: { type: Number },
  timePerSwap: { type: String },
  loopExecTime: { type: String },
  portfolioBalance: { type: String },
  rejectedPoolCount: { type: Number },
  createdAt: { type: Number, default: () => Math.floor(Date.now() / 1000) }
})

CheckSchema.index({ createdAt: -1 })
CheckSchema.index({ type: 1, createdAt: 1 })

export const CheckModel =
  (mongoose.models.Check as mongoose.Model<ICheck>) ??
  mongoose.model<ICheck>('Check', CheckSchema)
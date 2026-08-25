import { Schema, model } from 'mongoose'
import type { ICheck } from '../types.js'

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

const CheckModel = model<ICheck>('Check', CheckSchema)
export { CheckModel, ICheck }
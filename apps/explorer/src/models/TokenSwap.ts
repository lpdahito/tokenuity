import { Schema, model } from 'mongoose'
import type { ITokenSwap } from '../types.js'

const TokenSwapSchema = new Schema<ITokenSwap>({
  tx: { type: String },
  // buy: { type: Boolean },
  block: { type: Number },
  pool: { type: String },
  // token: { type: String },
  amount0: { type: String },
  amount1: { type: String },
  logIndex: { type: Number },
  // protocol: { type: Number },
  timestamp: { type: Number, default: 0 },
  // sender: { type: String, default: null },
  // recipient: { type: String, default: null },
})

TokenSwapSchema.index({ tx: 1 }, { unique: true })
// TokenSwapSchema.index({ token: 1, timestamp: -1 })

const TokenSwapModel = model<ITokenSwap>('TokenSwap', TokenSwapSchema)
export { TokenSwapModel }
import mongoose, { Schema } from 'mongoose'
import type { IToken } from '@tokenuity/types'

const TokenSchema = new Schema<IToken>({
  name: { type: String, required: true },
  block: { type: Number },
  symbol: { type: String, required: true },
  address: { type: String, required: true },
  decimals: { type: Number, required: true },
  totalSupply: { type: String, required: true },
  follow: { type: Boolean, default: true },
  launchpad: { type: Number, default: null },
  lastActivityAt: { type: Date, default: Date.now },
  holderCount: { type: Number, default: 0 },
  holdersDelta1m: { type: Number, default: null },
  holdersDelta5m: { type: Number, default: null },
  holdersDelta10m: { type: Number, default: null },
  computedBlock: { type: Number, default: null },
  circulatingSupply: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, immutable: true }
})

TokenSchema.index({ address: 1 }, { unique: true })

export const TokenModel =
  (mongoose.models.Token as mongoose.Model<IToken>) ??
  mongoose.model<IToken>('Token', TokenSchema)
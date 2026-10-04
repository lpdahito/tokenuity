import mongoose, { Schema } from 'mongoose'
import type { IToken } from '@tokenuity/types'

const TokenSchema = new Schema<IToken>({
  name: { type: String },
  block: { type: Number },
  symbol: { type: String },
  address: { type: String },
  decimals: { type: Number, default: 18 },
  totalSupply: { type: String, required: true },
  follow: { type: Boolean, default: true },
  launchpad: { type: Number, default: null },
  lastActivityAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now, immutable: true }
})

TokenSchema.index({ address: 1 }, { unique: true })

export const TokenModel =
  (mongoose.models.Token as mongoose.Model<IToken>) ??
  mongoose.model<IToken>('Token', TokenSchema)
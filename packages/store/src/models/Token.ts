import mongoose, { Schema } from 'mongoose'
import type { IToken } from '@tokenuity/types'

const TokenSchema = new Schema<IToken>({
  name: { type: String },
  block: { type: Number },
  symbol: { type: String },
  address: { type: String },
  decimals: { type: Number, default: 18 },
  creator: { type: String, default: null },
  follow: { type: Boolean, default: true },
  isScam: { type: Boolean, default: null },
  website: { type: String, default: null },
  launchpad: { type: Number, default: null },
  // protocols: { type: [Number], default: [] },
  verified: { type: Boolean, default: null },
  compliant: { type: Boolean, default: null },
  snippetSafe: { type: Boolean, default: null },
  ownerRenounced: { type: Boolean, default: null },
  lastActivityAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now, immutable: true }
})

TokenSchema.index({ address: 1 }, { unique: true })

export const TokenModel =
  (mongoose.models.Token as mongoose.Model<IToken>) ??
  mongoose.model<IToken>('Token', TokenSchema)
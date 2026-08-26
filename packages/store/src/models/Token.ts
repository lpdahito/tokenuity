import { Schema, model } from 'mongoose'
import type { IToken } from '@tokenuity/contracts'

const TokenSchema = new Schema<IToken>({
  name: { type: String },
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
  createdAt: { type: Number, default: () => Math.floor(Date.now() / 1000) }
})

TokenSchema.index({ address: 1 }, { unique: true })

const TokenModel = model<IToken>('Token', TokenSchema)
export { TokenModel }
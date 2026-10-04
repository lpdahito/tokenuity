import mongoose, { Schema } from 'mongoose'
import type { IHolder } from '@tokenuity/types'

const HolderSchema = new Schema<IHolder>({
  token: { type: String },
  address: { type: String },
  balance: { type: String },
  sent: { type: Number, default: 0 },
  received: { type: Number, default: 0 },
  amountIn: { type: String, default: '0' },
  amountOut: { type: String, default: '0' },
  block: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, immutable: true }
})

HolderSchema.index({ token: 1, address: 1 }, { unique: true })
HolderSchema.index({ token: 1, balance: 1 })

export const HolderModel =
  (mongoose.models.Holder as mongoose.Model<IHolder>) ??
  mongoose.model<IHolder>('Holder', HolderSchema)
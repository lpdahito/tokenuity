import mongoose, { Schema } from 'mongoose'
import type { IPrice } from '@tokenuity/types'

const PriceSchema = new Schema<IPrice>({
  baseToken: { type: String },
  virtual: { type: String },
  createdAt: { type: Number, default: () => Math.floor(Date.now() / 1000) }
})

PriceSchema.index({ createdAt: -1 })

export const PriceModel =
  (mongoose.models.Price as mongoose.Model<IPrice>) ??
  mongoose.model<IPrice>('Price', PriceSchema)
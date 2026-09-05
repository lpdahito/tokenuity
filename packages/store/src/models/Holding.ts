import mongoose, { Schema } from 'mongoose'
import { IHolding } from '@tokenuity/types'

const HoldingSchema = new Schema<IHolding>({
  amount: { type: String },
  address: { type: String },
  avgPriceInBase: { type: String },
  tryCount: { type: Number, default: 0 },
  oldAvgPriceInBase: { type: String, default: null },
  createdAt: { type: Number, default: () => Math.floor(Date.now() / 1000) },
  updatedAt: { type: Number, default: () => Math.floor(Date.now() / 1000) }
})

HoldingSchema.index({ address: 1 }, { unique: true })

export const HoldingModel =
  (mongoose.models.Holding as mongoose.Model<IHolding>) ??
  mongoose.model<IHolding>('Holding', HoldingSchema)
import mongoose, { Schema } from 'mongoose'
import type { IPortfolioBalance } from '@tokenuity/types'

const PortfolioBalanceSchema = new Schema<IPortfolioBalance>({
  body: { type: String },
  wallet: { type: String },
  createdAt: { type: Number, default: () => Math.floor(Date.now() / 1000) }
})

// PortfolioBalanceSchema.index({ createdAt: -1 })

export const PortfolioBalanceModel =
  (mongoose.models.PortfolioBalance as mongoose.Model<IPortfolioBalance>) ??
  mongoose.model<IPortfolioBalance>('PortfolioBalance', PortfolioBalanceSchema)
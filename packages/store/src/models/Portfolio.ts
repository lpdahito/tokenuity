import mongoose, { Schema } from 'mongoose'
import { IPortfolio } from '@tokenuity/types'

const PortfolioSchema = new Schema<IPortfolio>({
  wallet: { type: String },
  balance: { type: String },
  auto: { type: Boolean, default: true },
  createdAt: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000)
  },
  updatedAt: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000)
  }
})

PortfolioSchema.index({ wallet: 1 }, { unique: true })

export const PortfolioModel =
  (mongoose.models.Portfolio as mongoose.Model<IPortfolio>) ??
  mongoose.model<IPortfolio>('Portfolio', PortfolioSchema)
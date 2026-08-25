import { Schema, model } from 'mongoose'
import { IPortfolio } from '../types.js'

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

const PortfolioModel = model<IPortfolio>('Portfolio', PortfolioSchema)
export { PortfolioModel }
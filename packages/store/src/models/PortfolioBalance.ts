import { Schema, model } from 'mongoose'
import type { IPortfolioBalance } from '@tokenuity/contracts'

const PortfolioBalanceSchema = new Schema<IPortfolioBalance>({
  body: { type: String },
  wallet: { type: String },
  createdAt: { type: Number, default: () => Math.floor(Date.now() / 1000) }
})

// PortfolioBalanceSchema.index({ createdAt: -1 })

const PortfolioBalanceModel = model<IPortfolioBalance>('PortfolioBalance', PortfolioBalanceSchema)
export { PortfolioBalanceModel, IPortfolioBalance }
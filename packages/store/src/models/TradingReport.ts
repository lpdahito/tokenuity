import mongoose, { Schema } from 'mongoose'
import { ITradingReport } from '@tokenuity/types'

// TypeScript Interface for the Subdocument
interface IResult {
  count: number, profit: string, multiple: number
}

// Subdocument
const ResultSchema = new Schema<IResult>({
  count: { type: Number, default: 0 },
  multiple: { type: Number, default: 0 },
  profit: { type: String, default: '0.00' },
}, { _id: false });

const TradingReportSchema = new Schema<ITradingReport>({
  count: { type: Number, default: 0 },
  profit: { type: String, default: '0.00' },
  bestMultiple: { type: Number, default: 0 },
  bestProfit: { type: String, default: '0.00' },
  results: { type: [ResultSchema], default: [] },
  createdAt: { type: Number, default: () => Math.floor(Date.now() / 1000) },
})

export const TradingReportModel =
  (mongoose.models.TradingReport as mongoose.Model<ITradingReport>) ??
  mongoose.model<ITradingReport>('TradingReport', TradingReportSchema)
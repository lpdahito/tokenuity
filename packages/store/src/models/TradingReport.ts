import { Schema, model } from 'mongoose'
import { ITradingReport } from '@tokenuity/contracts'

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

const TradingReportModel = model<ITradingReport>('TradingReport', TradingReportSchema)
export { TradingReportModel }
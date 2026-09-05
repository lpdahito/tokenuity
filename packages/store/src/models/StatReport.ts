import mongoose, { Schema } from 'mongoose'
import { IStatReport } from '@tokenuity/types'

const StatReportSchema = new Schema<IStatReport>({
  txCount: { type: Number, default: 0 },
  rugPulls: { type: Number, default: 0 },
  growth: { type: String, default: '0.00' },
  successfulExits: { type: Number, default: 0 },
  highestMultiple: { type: Number, default: 0 },
  createdAt: { type: Number, default: () => Math.floor(Date.now() / 1000) },
})

export const StatReportModel =
  (mongoose.models.StatReport as mongoose.Model<IStatReport>) ??
  mongoose.model<IStatReport>('StatReport', StatReportSchema)
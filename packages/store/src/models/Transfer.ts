import mongoose, { Schema } from 'mongoose'
import { ITransfer } from '@tokenuity/types'

const TransferSchema = new Schema<ITransfer>({
  tx: { type: String },
  to: { type: String },
  from: { type: String },
  token: { type: String },
  block: { type: Number },
  logIndex: { type: Number },
  createdAt: { type: Date, default: Date.now, immutable: true }
})

TransferSchema.index({ tx: 1, logIndex: 1 }, { unique: true })
TransferSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 })

export const TransferModel =
  (mongoose.models.Transfer as mongoose.Model<ITransfer>) ??
  mongoose.model<ITransfer>('Transfer', TransferSchema)
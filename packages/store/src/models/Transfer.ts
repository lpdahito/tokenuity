import mongoose, { Schema } from 'mongoose'
import { ITransfer } from '@tokenuity/types'

const TransferSchema = new Schema<ITransfer>({
  tx: { type: String },
  to: { type: String },
  from: { type: String },
  token: { type: String },
  block: { type: Number },
  logIndex: { type: Number },
  createdAt: { type: Number, default: () => Math.floor(Date.now() / 1000) }
})

TransferSchema.index({ address: 1 }, { unique: true })

export const TransferModel =
  (mongoose.models.Transfer as mongoose.Model<ITransfer>) ??
  mongoose.model<ITransfer>('Transfer', TransferSchema)
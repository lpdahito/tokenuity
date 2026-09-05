import mongoose, { Schema } from 'mongoose'
import type { ILog } from '@tokenuity/types'

const LogSchema = new Schema<ILog>({
  logType: { type: String, required: true },
  token: { type: Object },
  pump: { type: Boolean },
  swapCount: { type: Number },
  buyCount: { type: Number },
  sellCount: { type: Number },
  createdAt: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000)
  }
})

export const LogModel =
  (mongoose.models.Log as mongoose.Model<ILog>) ??
  mongoose.model<ILog>('Log', LogSchema)
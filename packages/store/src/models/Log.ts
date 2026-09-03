import { Schema, model } from 'mongoose'
import type { ILog } from '@tokenuity/contracts'

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

const LogModel = model<ILog>('Log', LogSchema)
export { LogModel }
import { Schema, model } from 'mongoose'
import { ICreator } from '@tokenuity/contracts'

const CreatorSchema = new Schema<ICreator>({
  address: { type: String },
  // tokens: { type: [String], default: [] },
  failCount: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },
  createdAt: { type: Number, default: () => Math.floor(Date.now() / 1000) },
})

CreatorSchema.index({ address: 1 }, { unique: true })

const CreatorModel = model<ICreator>('Creator', CreatorSchema)
export { CreatorModel }
import mongoose, { Schema } from 'mongoose'
import { ICreator } from '@tokenuity/types'

const CreatorSchema = new Schema<ICreator>({
  address: { type: String },
  // tokens: { type: [String], default: [] },
  failCount: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },
  createdAt: { type: Number, default: () => Math.floor(Date.now() / 1000) },
})

CreatorSchema.index({ address: 1 }, { unique: true })

export const CreatorModel =
  (mongoose.models.Creator as mongoose.Model<ICreator>) ??
  mongoose.model<ICreator>('Creator', CreatorSchema)
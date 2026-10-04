import mongoose, { Schema } from 'mongoose'
import type { IHolderSnapshot } from '@tokenuity/types'

/** Holder count per token, written by computeTokenData only when the count changes. */
const HolderSnapshotSchema = new Schema<IHolderSnapshot>({
  token: { type: String, required: true },
  block: { type: Number, required: true },
  holderCount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, immutable: true }
})

HolderSnapshotSchema.index({ token: 1, block: -1 })
HolderSnapshotSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 })

export const HolderSnapshotModel =
  (mongoose.models.HolderSnapshot as mongoose.Model<IHolderSnapshot>) ??
  mongoose.model<IHolderSnapshot>('HolderSnapshot', HolderSnapshotSchema)

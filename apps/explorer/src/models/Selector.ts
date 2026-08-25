import { Schema, model } from 'mongoose'
import type { ISelector } from '../types.js'

const SelectorSchema = new Schema<ISelector>({
  body: { type: String },
  unwanted: { type: Boolean, default: null },
  goodCount: { type: Number, default: 0 },
  badCount: { type: Number, default: 0 },
  lastGoods: { type: Array, default: [] },
  lastBads: { type: Array, default: [] },
  lastGoodTime: { type: Number, default: 0 },
  lastBadTime: { type: Number, default: 0 },
  updatedAt: { type: Number, default: () => Math.floor(Date.now() / 1000) },
  createdAt: { type: Number, default: () => Math.floor(Date.now() / 1000) },
})

SelectorSchema.index({ body: 1 }, { unique: true })

const SelectorModel = model<ISelector>('Selector', SelectorSchema)
export { SelectorModel }
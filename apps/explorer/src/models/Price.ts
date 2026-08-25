import { Schema, model } from 'mongoose'
import type { IPrice } from '../types.js'

const PriceSchema = new Schema<IPrice>({
  baseToken: { type: String },
  virtual: { type: String },
  createdAt: { type: Number, default: () => Math.floor(Date.now() / 1000) }
})

PriceSchema.index({ createdAt: -1 })

const PriceModel = model<IPrice>('Price', PriceSchema)
export { PriceModel, IPrice }
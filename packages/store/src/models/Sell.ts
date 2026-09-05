import mongoose, { Schema } from 'mongoose'
import { DexProtocols, ISell } from '@tokenuity/types'

/** 
 * Codes:
 * sc: success
 * pe: pending
 * er: failed with unknown error/reason
 * 
 * nw: no wallet
 * sf: simulation failed
 * to: token is too old
 * ss: swap count too small
 * sl: swap count too large
 * ls: liquidity too small
 * ll: liquidity too large
 * ts: transaction ratio too small
 * tl: transaction ratio too large
 * vs: volume ratio too small
 * vl: volume ratio too large
 * dp: no pool with direct path to baseToken
 * dn: dex is not supported
*/

const SellSchema = new Schema<ISell>({
  amount: { type: String },
  status: { type: String },
  multiple: { type: Number },
  tokenAddress: { type: String },
  tokenAgeOnTx: { type: Number },
  baseTokenPrice: { type: String },
  lowestMultiple: { type: Number },
  highestMultiple: { type: Number },
  tx: { type: String, default: null },
  prevHighestMultiple: { type: Number },
  attempts: { type: Number, default: 0 },
  prices: { type: [String], default: [] },
  txAttempts: { type: Number, default: 0 },
  amountInUsd: { type: Number, default: 0},
  trigger: { type: Number, default: null },
  messages: { type: [String], default: [] },
  timeTo2x: { type: Number, default: null },
  timeTo3x: { type: Number, default: null },
  timeTo4x: { type: Number, default: null },
  remaining: { type: Boolean, default: true },
  siphoned: { type: Boolean, default: false },
  stopLossCount: { type: Number, default: 0 },
  goodMultiple: { type: Number, default: null },
  timeToPoint90x: { type: Number, default: null },
  timeToPoint85x: { type: Number, default: null },
  timeToPoint75x: { type: Number, default: null },
  timeToPoint50x: { type: Number, default: null },
  timeToPoint25x: { type: Number, default: null },
  lowestBeforeTx: { type: Number, default: null },
  highestBeforeTx: { type: Number, default: null },
  updatedAt: { type: Number, default: () => Math.floor(Date.now() / 1000) },
  createdAt: { type: Number, default: () => Math.floor(Date.now() / 1000) },
  soldAt: { type: Number, default: null },
})

SellSchema.index({ tokenAddress: 1 }, { unique: true })

export const SellModel =
  (mongoose.models.Sell as mongoose.Model<ISell>) ??
  mongoose.model<ISell>('Sell', SellSchema)
import { Schema, model } from 'mongoose'
import { IBuy } from '../types.js'

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

const BuySchema = new Schema<IBuy>({
  status: { type: String },
  amount: { type: String },
  otherAmount: { type: String },
  swapCount: { type: Number },
  holderCount: { type: Number },
  tokenAddress: { type: String },
  tokenAgeOnTx: { type: Number },
  volumeInUsdIqr: { type: Number },
  liquidityInUsd: { type: Number },
  baseTokenPrice: { type: String },
  swapsPerMinute: { type: Number },
  coinHoldersWithOne: { type: Number },
  tokenHoldersWithOne: { type: Number },
  liquidityInBase: { type: String },
  volumeInUsdMean: { type: Number },
  holderCountRatio: { type: Number },
  coinHoldersWithTwenty: { type: Number },
  tokenHoldersWithTwenty: { type: Number },
  volumeInUsdMedian: { type: Number },
  buyCountPct: { type: Number },
  tx: { type: String, default: null },
  buySellVolumeRatio: { type: Number },
  attempts: { type: Number, default: 0 },
  swapIndex: { type: Number, default: 0 },
  coinHoldersWithOneHundred: { type: Number },
  tokenHoldersWithOneHundred: { type: Number },
  coinHoldersWithOneThousand: { type: Number },
  tokenHoldersWithOneThousand: { type: Number },
  amountInUsd: { type: Number, default: 0 },
  messages: { type: [String], default: [] },
  updatedAt: { type: Number, default: () => Math.floor(Date.now() / 1000) },
  createdAt: { type: Number, default: () => Math.floor(Date.now() / 1000) },
  boughtAt: { type: Number, default: null }
})

BuySchema.index({ tokenAddress: 1 }, { unique: true })

const BuyModel = model<IBuy>('Buy', BuySchema)
export { BuyModel }
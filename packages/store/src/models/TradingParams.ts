import mongoose, { Schema } from 'mongoose'
import type { DexProtocols, LimitsForSwaps } from '@tokenuity/types'

const TradingParamsSchema = new Schema<LimitsForSwaps>({
  amountIn: { type: Number },
  takeProfit: { type: Number },
  stopLoss: { type: Number },
  timeMax: { type: Number },
  tryCountMax: { type: Number },
  protocols: { type: [Number] },
  holderCountMin: { type: Number },
  mustBeVerified: { type: Boolean, default: true },
  mustBeRenounced: { type: Boolean },
  ownerMustNotBeNull: { type: Boolean },
  mustNotContainEmojis: { type: Boolean },
  lockedPercentageMin: { type: Number },
  tokenAgeMin: { type: Number },
  tokenAgeMax: { type: Number },
  swapCountMin: { type: Number },
  swapCountMax: { type: Number },
  swapsPerMinuteMin: { type: Number },
  liquidityInUsdMin: { type: Number },
  liquidityInUsdMax: { type: Number },
  buyCountPctMin: { type: Number },
  buyCountPctMax: { type: Number },
  buySellVolumeRatioMin: { type: Number },
  buySellVolumeRatioMax: { type: Number },
  buyVolumeInUsdMedianMin: { type: Number },
  unwanted: { type: [String] },
})

export const TradingParamsModel =
  (mongoose.models.TradingParams as mongoose.Model<LimitsForSwaps>) ??
  mongoose.model<LimitsForSwaps>('TradingParams', TradingParamsSchema)
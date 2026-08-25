import { Schema, model } from 'mongoose'
import type { DexProtocols, LimitsForSwaps } from '../types.js'

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

const TradingParamsModel = model<LimitsForSwaps>('TradingParams', TradingParamsSchema)
export { TradingParamsModel }
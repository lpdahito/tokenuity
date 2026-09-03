import type { HydratedDocument } from 'mongoose'

import { Logger } from '../config/logger.js'
import tradingParamsFromConfig from '../config/tradingParams.js'

import * as models from '@tokenuity/store'

import { DexProtocols, SwapEvent, EventToken, LimitsForSwaps } from '../types.js'

const {
  TradingParamsModel: TradingParams,
} = models

export const findOrCreateTradingParams = async (
): Promise<HydratedDocument<LimitsForSwaps> | null> => {
  let tradingParams: HydratedDocument<LimitsForSwaps> | null = null

  let params = tradingParamsFromConfig['default']
  let limits = params.limitsForSwaps

  try {
    tradingParams = await TradingParams.findOne({})

    if (!tradingParams) {
      tradingParams = new TradingParams({
        amountIn: limits.amountIn,
        takeProfit: limits.takeProfit,
        stopLoss: limits.stopLoss,
        timeMax: limits.timeMax,
        tryCountMax: limits.tryCountMax,
        holderCountMin: limits.holderCountMin,
        protocols: limits.protocols,
        mustBeVerified: limits.mustBeVerified,
        mustBeRenounced: limits.mustBeRenounced,
        ownerMustNotBeNull: limits.ownerMustNotBeNull,
        mustNotContainEmojis: limits.mustNotContainEmojis,
        lockedPercentageMin: limits.lockedPercentageMin,
        tokenAgeMin: limits.tokenAgeMin,
        tokenAgeMax: limits.tokenAgeMax,
        swapCountMin: limits.swapCountMin,
        swapCountMax: limits.swapCountMax,
        swapsPerMinuteMin: limits.swapsPerMinuteMin,
        liquidityInUsdMin: limits.liquidityInUsdMin,
        liquidityInUsdMax: limits.liquidityInUsdMax,
        buyCountPctMin: limits.buyCountPctMin,
        buyCountPctMax: limits.buyCountPctMax,
        buySellVolumeRatioMin: limits.buySellVolumeRatioMin,
        buySellVolumeRatioMax: limits.buySellVolumeRatioMax,
        buyVolumeInUsdMedianMin: limits.buyVolumeInUsdMedianMin,
        unwanted: limits.unwanted
      })

      await tradingParams.save()
    }
  } catch(err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return tradingParams
  }
}
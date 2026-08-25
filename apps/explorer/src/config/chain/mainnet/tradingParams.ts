/* Fibonacci sequence
  0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377,
  610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657,
  46368, 75025, 121393, 196418, 317811, 514229
*/

import { LimitsForLogs, LimitsForSwaps } from '../../../types.js'

interface Limits {
  limitsForLogs?: LimitsForLogs,
  limitsForSwaps: LimitsForSwaps
}

const buySellCountRatioPump = 3.5
const buySellCountRatioDump = 1

const buySellVolumeRatioPump = 3
const buySellVolumeRatioDump = 1

export default {
  'default': <Limits>{
    limitsForLogs: {
      buySellCountRatioPump: buySellCountRatioPump,
      buySellCountRatioDump: buySellCountRatioDump, 
      buySellVolumeRatioPump: buySellVolumeRatioPump,
      buySellVolumeRatioDump: buySellVolumeRatioDump,
      swapCount: {
        underOneDayOld: [ 55, 89, 144, 233, 377 ],
        underOneWeekOld: [ 55, 89, 144, 233, 377 ],
        moreThanOneWeekOld: [ 89, 144, 233, 377, 610 ],
      },
    },
    limitsForSwaps: {
      amountIn: 0.50, // $0.50
      takeProfit: 1.25,
      stopLoss: 0.75,
      timeMax: (60 * 60),
      tryCountMax: 2,
      holderCountMin: 25,
      protocols: [1, 2, 3],
      mustBeVerified: true,
      mustBeRenounced: false,
      ownerMustNotBeNull: true,
      mustNotContainEmojis: true,
      lockedPercentageMin: 0.20,
      tokenAgeMin: 0,
      tokenAgeMax: ((60 * 60) * 24), // 24 hours
      swapCountMin: 50,
      swapCountMax: 1_597,
      swapsPerMinuteMin: 3.2,
      liquidityInUsdMin: 1_597,
      liquidityInUsdMax: 300_000,
      buyCountPctMin: 0.95,
      buyCountPctMax: 200,
      buySellVolumeRatioMin: 0.95,
      buySellVolumeRatioMax: 200,
      buyVolumeInUsdMedianMin: 5.00,
      unwanted: [
        '4f7041a5', // buyTax
        'cc1776d3', // sellTax
      
        '0ac71193', // startTx
      
        '0faee56f', // _maxTaxSwap
        '7d1db4a5', // _maxTxAmount
        '8f9a55c0', // _maxWalletSize
        'bf474bed', // _taxSwapThreshold
      
        '4d237730', // taxManager
        '771a3a1d', // taxRate
        '37bb0eb8', // function reduceTaxRate(address account, uint256 newTaxRate)

        'f7888aec', // function balanceOf(address from, address to)
      ]
    }
  } 
}
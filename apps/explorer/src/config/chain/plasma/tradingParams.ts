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
      amountIn: 0.75, // $0.75
      takeProfit: 3.2,
      stopLoss: 0.90,
      timeMax: (60 * 40), // 40 mins
      tryCountMax: 1,
      holderCountMin: 8,
      protocols: [1, 2, 3],
      mustBeVerified: true,
      mustBeRenounced: false,
      ownerMustNotBeNull: true,
      mustNotContainEmojis: false,
      lockedPercentageMin: 0, // Should be 0.20
      tokenAgeMin: 1, // 1 second
      tokenAgeMax: (60 * 20), // 20 minutes
      swapCountMin: 15,
      swapCountMax: 10_000,
      swapsPerMinuteMin: 3,
      liquidityInUsdMin: 1_400,
      liquidityInUsdMax: 3_000_000,
      buyCountPctMin: 0.45,
      buyCountPctMax: 1.01,
      buySellVolumeRatioMin: 1.00,
      buySellVolumeRatioMax: 800,
      buyVolumeInUsdMedianMin: 0,
      unwanted: [
        // '4f7041a5', // buyTax
        // 'cc1776d3', // sellTax
      
        // '0ac71193', // startTx
      
        // '0faee56f', // _maxTaxSwap
        // '7d1db4a5', // _maxTxAmount
        // '8f9a55c0', // _maxWalletSize
        // 'bf474bed', // _taxSwapThreshold
      
        // '4d237730', // taxManager
        // '771a3a1d', // taxRate
        // '37bb0eb8', // function reduceTaxRate(address account, uint256 newTaxRate)

        // 'f7888aec', // function balanceOf(address from, address to)

        // '19ab453c', // function init(address init_0x)

        // '033b9b4f', // function tokenSymbol(address account)
        // '97541e9f', // function multicall(address spender)

        // '884e01d7', // ekvezobv
        // 'c22b21cc', // yazrjatq
        // '927f3d41', // _defaultAddress ????

        // '18647744', // function permit(address tokenOwner, address spender, uint256 amount)

        // '19693acd', // function validateAllowance(address owner, address spender, uint256 addedValue)
      ]
    }
  } 
}
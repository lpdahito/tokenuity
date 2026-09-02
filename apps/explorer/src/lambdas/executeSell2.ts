import { ethers } from 'ethers'
import BigNumber from 'bignumber.js'
import type { HydratedDocument } from 'mongoose'

import { Document } from 'mongodb'

import * as models from '@tokenuity/store'

import { contracts } from './../contracts/contracts.js'

import isLocal from './../config/isLocal.js'
import { chain } from './../config/chain.js'
import explorer from './../config/explorer.js'
import { Logger } from './../config/logger.js'
import addresses from './../config/addresses.js'
import { providers, wallets } from './../config/provider.js'

import { Swap } from './../helpers/swaps.js'
import { findOrCreateSell } from './../helpers/sells.js'
import { updatePortfolio } from './../helpers/portfolios.js'
import { sendDiscordMessage } from './../helpers/discord.js'
import { findOrCreateCreator } from './../helpers/creators.js'
import { saveSnippetsForToken } from './../helpers/snippets.js'
import { findOrCreateSnippet, getSourceCodeData } from './../helpers/snippets.js'
import { getTokenCreator, getTokenSourceCode, isVerified } from './../helpers/tokens.js'
import { lastPrice, baseToken as getBaseToken, quoteToken as getQuoteToken } from './../helpers/pools.js'

import {
  DexProtocols, IBuy, IHolding, IPool, IPortfolio, ISell, ISnippet, IToken, Launchpads, Triggers
} from '@tokenuity/contracts'

import { LimitsForSwaps, SwapResponse } from './../types.js'

const {
  BuyModel: Buy,
  SellModel: Sell,
  TokenModel: Token,
  HoldingModel: Holding,
  SnippetModel: Snippet,
  PortfolioModel: Portfolio,
} = models

let chainColor = '🔵'
let baseCoin = 'ETH'

switch (chain.name) {
  case 'base':
  chainColor = '🔵'; baseCoin = 'ETH'; break;

  case 'bsc':
  chainColor = '🟡'; baseCoin = 'BNB'; break;
}

const MAX_ATTEMPTS = 40

const TOKENUITY_CONTRACT = new ethers.Contract(
  addresses.tokenuity, contracts.tokenuity.abi, wallets[0]
)

export default async (
  baseToken: HydratedDocument<IToken>,
  baseTokenPrice: string,
  tokenAddress: string,
  pool: Document,
  avgPriceInBase: string,
  limits: LimitsForSwaps,
  ceiling: number
): Promise<void> => {
  if (isLocal) return

  let fake = true
  let save = false
  let track = false
  let sellAll = true
  let siphoned = false

  let amountIn = 0n
  let amountOut = 0n
  let portfolioBalance = 0n

  let timeMax = limits.timeMax

  let tokenAge = 0

  const formattedTime = getFormattedTime()

  let txResponse: SwapResponse | null = null

  let buy: HydratedDocument<IBuy> | null = null
  let sell: HydratedDocument<ISell> | null = null
  let token: HydratedDocument<IToken> | null = null
  let holding: HydratedDocument<IHolding> | null = null
  let portfolio: HydratedDocument<IPortfolio> | null = null

  const lastPriceInBase = lastPrice(pool)

  const _multiple = BigNumber(lastPriceInBase).div(avgPriceInBase).toNumber()
  let multiple = parseFloat(_multiple.toFixed(2))

  let msg = 'initializing'
  let botMsg = `Couldn\'t sell token: ${tokenAddress}`

  try {
    const collections = await getCollections(
      tokenAddress, multiple
    )

    buy = collections.buy
    sell = collections.sell
    token = collections.token
    holding = collections.holding
    portfolio = collections.portfolio

    if (!portfolio) {
      msg = formattedTime + 'Portfolio not found'; return
    }

    fake = ['0', '1'].includes(portfolio.wallet)

    if (!holding) {
      msg = 'Couldn\'t find holding'; return
    }

    if (!buy) {
      msg = 'Couldn\'t find associated buy'; return
    }

    if (!sell) {
      msg = 'Couldn\'t find or create buy'; return
    }

    if (!token) {
      msg = formattedTime + 'Could not find token';
      return
    }

    tokenAge = ceiling - token.createdAt
    const holdingAge = ceiling - holding.createdAt
    // const stopLossTimeForFull = (20 * 60)

    // const holdingTimePercentageToStopLoss = (holdingAge / stopLossTimeForFull)

    if (multiple < sell.lowestMultiple) {
      sell.lowestMultiple = multiple
      sell.updatedAt = ceiling

      await sell.save()
    }

    if (sell.highestMultiple < multiple) {
      sell.prevHighestMultiple = sell.highestMultiple
      sell.highestMultiple = multiple
      
      sell.updatedAt = ceiling
      
      await sell.save()
    }

    switch (true) {
      case (multiple > 4):
        if (buy.boughtAt && !sell.timeTo2x) {
          sell.timeTo2x = ceiling - buy.boughtAt
        }

        if (buy.boughtAt && !sell.timeTo3x) {
          sell.timeTo3x = ceiling - buy.boughtAt
        }

        if (buy.boughtAt && !sell.timeTo4x) {
          sell.timeTo4x = ceiling - buy.boughtAt

          await sell.save()
        }

        break;

      case (multiple > 3):
        if (buy.boughtAt && !sell.timeTo2x) {
          sell.timeTo2x = ceiling - buy.boughtAt
        }

        if (buy.boughtAt && !sell.timeTo3x) {
          sell.timeTo3x = ceiling - buy.boughtAt

          await sell.save()
        }
        
        break;

      case (multiple > 2):
        if (buy.boughtAt && !sell.timeTo2x) {
          sell.timeTo2x = ceiling - buy.boughtAt

          await sell.save()
        }
        
        break;
    }

    switch (true) {
      case (multiple < 0.25):
        if (buy.boughtAt && !sell.timeToPoint90x) {
          sell.timeToPoint90x = ceiling - buy.boughtAt
        }

        if (buy.boughtAt && !sell.timeToPoint85x) {
          sell.timeToPoint85x = ceiling - buy.boughtAt
        }

        if (buy.boughtAt && !sell.timeToPoint75x) {
          sell.timeToPoint75x = ceiling - buy.boughtAt
        }

        if (buy.boughtAt && !sell.timeToPoint50x) {
          sell.timeToPoint50x = ceiling - buy.boughtAt
        }

        if (buy.boughtAt && !sell.timeToPoint25x) {
          sell.timeToPoint25x = ceiling - buy.boughtAt

          await sell.save()
        }

        break;

      case (multiple < 0.50):
        if (buy.boughtAt && !sell.timeToPoint90x) {
          sell.timeToPoint90x = ceiling - buy.boughtAt
        }

        if (buy.boughtAt && !sell.timeToPoint85x) {
          sell.timeToPoint85x = ceiling - buy.boughtAt
        }

        if (buy.boughtAt && !sell.timeToPoint75x) {
          sell.timeToPoint75x = ceiling - buy.boughtAt
        }

        if (buy.boughtAt && !sell.timeToPoint50x) {
          sell.timeToPoint50x = ceiling - buy.boughtAt

          await sell.save()
        }
        
        break;

      case (multiple < 0.75):
        if (buy.boughtAt && !sell.timeToPoint90x) {
          sell.timeToPoint90x = ceiling - buy.boughtAt
        }

        if (buy.boughtAt && !sell.timeToPoint85x) {
          sell.timeToPoint85x = ceiling - buy.boughtAt
        }

        if (buy.boughtAt && !sell.timeToPoint75x) {
          sell.timeToPoint75x = ceiling - buy.boughtAt

          await sell.save()
        }
        
        break;

      case (multiple < 0.85):
        if (buy.boughtAt && !sell.timeToPoint90x) {
          sell.timeToPoint90x = ceiling - buy.boughtAt
        }

        if (buy.boughtAt && !sell.timeToPoint85x) {
          sell.timeToPoint85x = ceiling - buy.boughtAt

          await sell.save()
        }
        
        break;

      case (multiple < 0.90):
        if (buy.boughtAt && !sell.timeToPoint90x) {
          sell.timeToPoint90x = ceiling - buy.boughtAt

          await sell.save()
        }
        
        break;
    }

    if (!sell.remaining && sell.status === 'success') {
      msg = 'Sell is already successful'; return
    }
    
    if (sell.status === 'failed') {
      if (sell.attempts >= MAX_ATTEMPTS) {
        msg = 'sell.attempts >= MAX_ATTEMPTS'; return
      }
    }

    const prevStatus = sell.status

    if (sell.status !== 'pending') {
      sell.status = 'pending'
      // sell.multiple = multiple
      sell.updatedAt = ceiling
      // sell.randomString = randomString

      // await sell.save()
    }

    // Initializing values
    sell.trigger = Triggers.takeProfit
    let takeProfit = limits.takeProfit

    takeProfit = (takeProfit * 0.90)

    const tier1 = takeProfit
    const tier2 = takeProfit + 1.5
    const tier3 = takeProfit + 4.0

    // if (token.launchpad === Launchpads.fourmeme) {
    //   timeMax = ((60 * 30) * 1) // 30 mins
    // }

    let stopLoss = limits.stopLoss
    // if (holdingAge < (60 * 15)) { stopLoss = 0.50 }

    // if (holdingTimePercentageToStopLoss < 1) {
    //   stopLoss = holdingTimePercentageToStopLoss * stopLoss
    // }

    if (
      sell.multiple
      && sell.remaining
      && sell.goodMultiple
      && sell.highestMultiple
    ) {
      const floor = 1

      stopLoss = floor + 0.10

      if (sell.multiple > tier2) {
        stopLoss = sell.multiple * 0.70
      }
      
      // if (sell.highestMultiple > sell.multiple) {
      //   stopLoss = (sell.highestMultiple * 0.75)
      // }
    }

    switch (true) {
      case (holdingAge >= timeMax):
        sell.stopLossCount = 0
        sell.trigger = Triggers.time
        
        break;

      case (multiple <= stopLoss):
        // if (dexscreener && holdingAge < (60 * 15)) {
        //   sell.trigger = null
        // } else {
        //   sell.trigger = Triggers.stopLoss
        // }

        // if (
        //   holdingAge < (60 * 15)
        //   && !sell.goodMultiple
        //   && token.launchpad === Launchpads.fourmeme
        // ) {
        //   sell.trigger = null
        // } else {
        //   sell.trigger = Triggers.stopLoss
        // }

        // if (token.launchpad === Launchpads.fourmeme) {
        //   sell.trigger = null
        // } else {
        //   sell.trigger = Triggers.stopLoss
        // }

        sell.stopLossCount++
        if (sell.stopLossCount > 1) {
          sell.trigger = Triggers.stopLoss
        } else {
          sell.trigger = null
        }

        break;

      case (multiple >= takeProfit):
        sell.stopLossCount = 0
        sell.trigger = Triggers.takeProfit
        
        break;

      default:
        sell.stopLossCount = 0
        sell.trigger = null
        
        break;
    }

    /** Make sure to save tx */
    save = true
    /** Make sure to save tx */

    const tokenContract = new ethers.Contract(
      token.address, contracts.erc20.abi, wallets[0]
    )

    portfolioBalance = BigInt(portfolio.balance)

    if (sell.trigger === null && holdingAge < timeMax) {
      track = true; return
    }

    if (!holding?.amount || Number(holding.amount) === 0) {
      msg = 'tokenIn balance is 0'; return
    }

    let tokenBalance = BigInt(holding.amount)

    if (!fake) {
      // Get real token balance from blockchain
      tokenBalance = await tokenContract.balanceOf(
        addresses.tokenuity
      )

      const tokenBalanceFromContract = await TOKENUITY_CONTRACT.balanceFor(
        token.address
      )

      if (tokenBalance < tokenBalanceFromContract) {
        siphoned = true
        holding.amount = tokenBalance.toString()

        await holding.save()

        // await saveSelectorsForToken(token, false)
        await saveSnippetsForToken(
          token.address, buy.amountInUsd, false
        )
      }
    }

    if (tokenBalance === 0n) {
      msg = 'Portfolio\'s real balance is 0.'

      if (siphoned) {
        sell.attempts = MAX_ATTEMPTS - 1

        msg += ' Token was siphoned.'

        if (token.compliant) {
          botMsg = '🚨 ' + botMsg + ' 🚨' + '\n'
        }

        sendDiscordMessage(
          chainColor + ' ' + botMsg + ': ' + msg
        )
      }

      return
    }

    // sell all but 1
    amountIn = tokenBalance - 1n

    if (amountIn <= 0n) {
      msg = 'amountIn is 0'

      // await saveSelectorsForToken(token, false)
      sell.attempts = MAX_ATTEMPTS - 1

      sendDiscordMessage(
        chainColor + ' ' + botMsg + ': ' + msg
      )

      return
    }

    let soldAtLevel = false
    if (sell.trigger === Triggers.takeProfit) {
      switch (true) {
        case (multiple >= tier3):
          sellAll = true; break;

        case (multiple >= tier2):
          sellAll = false
          amountIn = (((amountIn * 10000n) / 100n) * 45n) / 10000n

          soldAtLevel = soldAtCurrentTier(sell, tier2)

          break;

        case (multiple >= tier1):
          sellAll = false
          amountIn = (((amountIn * 10000n) / 100n) * 20n) / 10000n

          soldAtLevel = soldAtCurrentTier(sell, tier1)

          break;
      }
    }

    if (soldAtLevel) {
      msg = 'Already sold at that level'
      sell.attempts = 1; sell.status = prevStatus; return
    }

    if (amountIn <= 0n) {
      msg = 'amountIn is 0'; return
    }

    const swapParams = {
      pool, amountIn, buy: false, signer: wallets[0]
    }

    const swap = new Swap(swapParams)

    amountOut = await swap.quote()
    const calldata = await swap.encode()

    if (!amountOut || amountOut === 0n) {
      msg = 'amountOut is 0'; return
    }

    if (!calldata || calldata === '') {
      msg = 'calldata is null'; return
    }

    /***************************/
    /** Real transaction starts */
    if (!fake) {
      let estimateGas = false
      if (sell.txAttempts > 0) estimateGas = true

      txResponse = await swap.execute({
        estimateGas: estimateGas
      })
      sell.txAttempts++

      if (!txResponse.success) {
        // await saveSelectorsForToken(token, false)
        await saveSnippetsForToken(
          token.address, buy.amountInUsd, false
        )
        
        if (sell.txAttempts === 1) {
          const lastSell = await Sell.findOne({
            tokenAddress: { $ne: token.address },
            status: { $in: [ 'success', 'failed' ] }
          }).sort({ createdAt: -1 })

          if (lastSell && lastSell.status === 'failed') {
            botMsg = '*** Trading halted *** ' + botMsg

            portfolio.auto = false
            await portfolio.save()
          }

          // const lastFailedSell = await Sell.findOne({
          //   tokenAddress: { $ne: token.address },
          //   status: 'failed'
          // }).sort({ createdAt: -1 })

          // if (lastFailedSell) {
          //   let trxnSelectors: Array<string> = []
            
          //   if (sell.token.selectors) {
          //     trxnSelectors = sell.token.selectors
          //   }

          //   let lastFailedTrxnSelectors: Array<string> = []
          //   if (lastFailedSell.token.selectors) {
          //     lastFailedTrxnSelectors = lastFailedSell.token.selectors
          //   }

          //   let commonSelectors = trxnSelectors.filter(selector => lastFailedTrxnSelectors.includes(selector))

          //   if (commonSelectors.length) {
          //     botMsg = '*** Trading halted *** ' + botMsg + ': Check selectors'

          //     portfolio.auto = false
          //     await portfolio.save()
          //   }
          // }

          sendDiscordMessage(
            chainColor + ' ' + botMsg
          )
        }

        throw new Error('Sell failed')
      }
    }
    /** Real transaction ends */
    /***************************/

    await updatePortfolio(
      portfolio, token, baseToken, amountIn, amountOut
    )
    // portfolio = await Portfolio.findOne({ wallet: portfolio.wallet }) // reload portfolio because it was saved in updatePortfolio call: "__v" +1...

    const usdAmount = (BigNumber(amountOut.toString()).div(baseTokenPrice.toString())).toFixed(2)
    sell.amountInUsd += Number(usdAmount)
    
    sell.goodMultiple = (sell.amountInUsd / buy.amountInUsd)

    if (siphoned) {
      // await saveSelectorsForToken(token, false)
      await saveSnippetsForToken(
        token.address, buy.amountInUsd, false
      )
    } else if (sell.goodMultiple >= 1) {
      // await saveSelectorsForToken(token, true)
      await saveSnippetsForToken(
        token.address, buy.amountInUsd, true
      )
    }

    sell.status = 'success'
    if (multiple > sell.multiple) {
      sell.multiple = multiple
    }

    if (!sell.lowestBeforeTx) {
      sell.lowestBeforeTx = sell.lowestMultiple
    }

    if (!sell.highestBeforeTx) {
      sell.highestBeforeTx = sell.highestMultiple
    }
    
    sell.remaining = !sellAll

    if (sell.soldAt === null) { sell.soldAt = ceiling }
    if (sell.trigger === null) { sell.trigger = Triggers.time }

    let protocol = 'uniswapv2'
    switch (pool.protocol) {
      case DexProtocols.pancakeswapv2:
        protocol = 'pancakeswapv2'
        break;

      case DexProtocols.uniswapv3:
        protocol = 'uniswapv3'
        break;
    }

    const _trigger = (sell.trigger === Triggers.time) ? 'time' : 'price'
      
    msg = `Sold ${token.symbol} at *${multiple}x* ($${usdAmount}): ${amountIn.toString()} (${token.symbol}) >> ${amountOut.toString()} (${baseCoin})`
    botMsg = `Sold $${usdAmount} worth of ${token.symbol} at *${multiple}x*\n`
    botMsg += `Attempt: ${sell.attempts + 1}, Trigger: ${_trigger}, Protocol: ${protocol}`

    if (txResponse) {
      botMsg += '\n--\n'
      botMsg += `${explorer.url}tx/${txResponse.tx}`
    }

    if (!fake) {
      sendDiscordMessage(
        chainColor + ' ' + botMsg
      )
    }
  } catch (err: any) {
    if ('message' in err) { msg = err.message }
    Logger.err({ error: err, report: true })
  } finally {
    if (sell && track) {
      msg = 'Tracking multiples'

      sell.status = 'tracked'
      sell.updatedAt = ceiling

      await sell.save()
    } else if (sell && save) {
      if (sell.status !== 'success') {
        sell.status = 'failed'
      }

      if (txResponse && txResponse.tx) {
        sell.tx = txResponse.tx
      }

      if (siphoned) {
        sell.siphoned = true
      }

      sell.attempts++
      sell.messages.unshift(msg)
      sell.tokenAgeOnTx = tokenAge
      sell.amount = amountOut.toString()
      sell.updatedAt = Math.floor(Date.now() / 1000)
      sell.baseTokenPrice = baseTokenPrice.toString()
      
      await sell.save()
    }

    if (isLocal) { console.log(msg) }
  }
}

const getCollections = async (
  tokenAddress: string, multiple: number
): Promise<{
  buy: HydratedDocument<IBuy> | null
  sell: HydratedDocument<ISell> | null
  token: HydratedDocument<IToken> | null
  holding: HydratedDocument<IHolding> | null
  portfolio: HydratedDocument<IPortfolio> | null
}> => {
  let buy: HydratedDocument<IBuy> | null = null
  let sell: HydratedDocument<ISell> | null = null
  let token: HydratedDocument<IToken> | null = null
  let holding: HydratedDocument<IHolding> | null = null
  let portfolio: HydratedDocument<IPortfolio> | null = null

  try {
    const promises = await Promise.all([
      findOrCreateSell(tokenAddress, multiple),
      Token.findOne({ address: tokenAddress }),
      Holding.findOne({ address: tokenAddress }),
      Buy.findOne({ tokenAddress: tokenAddress }),
      Portfolio.findOne({  wallet: process.env.WALLET_ADDRESS! })
    ])

    sell = promises[0]; token = promises[1]; holding = promises[2]; buy = promises[3];  portfolio = promises[4]
  } catch(err: any) {
    console.log(err)
  } finally {
    return {
      buy, sell, token, holding, portfolio
    }
  }
}

const soldAtCurrentTier = (
  sell: HydratedDocument<ISell>,
  lower: number,
  // upper: number
): boolean => {
  let _soldAtCurrentTier = false

  if (
    sell.goodMultiple
    && sell.multiple >= lower
    // && sell.multiple < upper
  ) { _soldAtCurrentTier = true }

  return _soldAtCurrentTier
}

const getFormattedTime = (
): string => {
  const start = new Date()

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Toronto',
  }

  let formattedTime = new Intl.DateTimeFormat(
    'en-US', timeOptions
  ).format(start)

  return `[${formattedTime}] `
}
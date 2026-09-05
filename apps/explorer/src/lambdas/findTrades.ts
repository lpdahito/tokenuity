import type { HydratedDocument } from 'mongoose'

import { Logger } from '../config/logger.js'

import * as models from '@tokenuity/store'

import addresses from './../config/addresses.js'

import { quoteToken } from './../helpers/pools.js'
import { findOrCreateToken } from './../helpers/tokens.js'
import { findOrCreateLastPrice } from './../helpers/prices.js'
import { findOrCreatePortfolio } from './../helpers/portfolios.js'
import { findOrCreateTradingParams } from './../helpers/tradingParams.js'

import executeBuy from './executeBuy2.js'
import executeSell from './executeSell2.js'

import { IHolding, IPrice, IPortfolio, IToken, DexProtocols } from '@tokenuity/types'
import { LimitsForSwaps, } from './../types.js'

export interface Holdings {
  [key: string]: HydratedDocument<IHolding>
}

const {
  PoolModel: Pool,
  HoldingModel: Holding
} = models

const lockedTokens: string[] = []
const bannedTokens: string[] = []

export default async (
): Promise<void> => {
  try {
    let data = await getCollections()

    setInterval( async () => {
      data = await getCollections()
    }, 60000) // run every minute

    const poolChangeStream = Pool.collection.watch(
      [ { $match: { operationType: 'update' } }, ],
      { fullDocument: 'updateLookup' }
    )

    poolChangeStream.on('change', async (change) => {
      if (change.operationType === 'update') {
        const document = change.fullDocument
        if (!document) { return }

        if (!document.firstSwap) { return }
        // if (document.protocol === DexProtocols.uniswapv4) { return }

        const start = new Date()
        const ceiling = Math.floor(Number(start) / 1000)

        // protect variables from async mutation

        let buy = true
        
        const _limits = data.limits
        const trading = data.trading
        const _baseToken = data.baseToken
        const _baseTokenPrice = data.baseTokenPrice
        const _holdings = { ...data.recentHoldings }

        if (!_limits) {
          console.log('Can\'t find trading limits'); return
        }

        if (!_baseToken) {
          console.log('Couldn\'t get baseToken'); return
        }

        if (!_baseTokenPrice) {
          console.log('Couldn\'t get baseTokenPrice'); return
        }

        let token = quoteToken(document)

        if (token in _holdings) { buy = false }

        // Check if token is locked...
        if (lockedTokens.includes(token)) { return }

        try {
          lockToken(token)

          if (buy) {
            if (!trading) {
              console.log('Trading is turned off'); return
            }

            // Check if token is banned...
            if (bannedTokens.includes(token)) { return }

            const resp = await executeBuy(
              _baseToken, _baseTokenPrice, token, document, _limits, ceiling
            )

            if (resp?.isBanned) {
              banToken(token); return
            }

            if (resp?.holding) {
              const address: string = resp?.holding.address
              
              _holdings[address] = resp.holding
            }
          } else {
            if (!_holdings[token]) { return }

            const avgPriceInBase = String(_holdings[token].avgPriceInBase)

            await executeSell(
              _baseToken, _baseTokenPrice, token, document, avgPriceInBase, _limits, ceiling
            )
          }
        } catch (err: any) {
          console.log(err)
        } finally {
          unlockToken(token)
        }
      }
    })
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  }
}

const lockToken = (
  token: string
): boolean => {
  lockedTokens.unshift(token)

  if (lockedTokens.length > 10) {
    lockedTokens.length = 10
  }

  return true
}

const unlockToken = (
  token: string
) => {
  const index = lockedTokens.indexOf(token)

  if (index > -1) {
    lockedTokens.splice(index, 1)
  }
}

const banToken = (
  token: string
): boolean => {
  bannedTokens.unshift(token)

  if (bannedTokens.length > 20) {
    bannedTokens.length = 20
  }

  return true
}

const getCollections = async (
): Promise<{
  trading: boolean
  baseTokenPrice: string
  recentHoldings: Holdings
  limits: LimitsForSwaps | null
  price: HydratedDocument<IPrice> | null
  baseToken: HydratedDocument<IToken> | null
  portfolio: HydratedDocument<IPortfolio> | null
}> => {
  let trading = false
  let baseTokenPrice = '0'
  let recentHoldings: Holdings = {}
  let limits: LimitsForSwaps | null = null
  let price: HydratedDocument<IPrice> | null = null
  let holdings: Array<HydratedDocument<IHolding>> = []
  let baseToken: HydratedDocument<IToken> | null = null
  let portfolio: HydratedDocument<IPortfolio> | null = null

  try {
    const promises = await Promise.all([
      findOrCreateLastPrice(),
      findOrCreateTradingParams(),
      findOrCreateToken(addresses.tokens.base),
      Holding.find({}).sort({ createdAt: -1 }).limit(500),
      findOrCreatePortfolio(process.env.WALLET_ADDRESS!),
    ])

    price = promises[0]
    limits = promises[1]
    holdings = promises[3]
    portfolio = promises[4]
    baseToken = promises[2].token

    if (price?.baseToken) {
      baseTokenPrice = price.baseToken
    }

    trading = portfolio?.auto ? true : false

    for (const holding of holdings) {
      const address = holding.address

      recentHoldings[address] = holding
    }
  } catch(err: any) {
    console.log(err)
  } finally {
    return {
      trading, price, portfolio, baseToken, baseTokenPrice, recentHoldings, limits
    }
  }
}
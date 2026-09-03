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

import { IPrice, IPortfolio, IToken, LimitsForSwaps } from './../types.js'

const {
  PoolModel: Pool,
} = models

const lockedTokens: string[] = []
const bannedTokens: string[] = []

let trading = false
let limits: LimitsForSwaps | null = null
let baseTokenPrice: string | null = null
let baseToken: HydratedDocument<IToken> | null = null

export default async (
): Promise<void> => {
  try {
    await setPriceAndPortfolio()

    setInterval( async () => {
      setPriceAndPortfolio()
    }, 60000) // run every minute

    const poolChangeStream = Pool.collection.watch(
      [ { $match: { operationType: 'update' } }, ],
      { fullDocument: 'updateLookup' }
    )

    poolChangeStream.on('change', async (change) => {
      if (change.operationType === 'update') {
        const document = change.fullDocument
        if (!document) { return }

        const start = new Date()
        const ceiling = Math.floor(Number(start) / 1000)

        if (!trading) {
          console.log('Trading is turned off'); return
        }

        if (!limits) {
          console.log('Can\'t find trading limits'); return
        }

        if (!baseToken) {
          console.log('Couldn\'t get baseToken'); return
        }

        if (!baseTokenPrice) {
          console.log('Couldn\'t get baseTokenPrice'); return
        }

        let token = quoteToken(document)

        console.log('quote token:', token)
        
        // if (document.createdAt < (ceiling - (60 * 60))) {
        //   console.log('Pool is too old'); return
        // }
      
        // if (document.swapCount < 12) {
        //   console.log('document.swapCount < 12'); return
        // }

        if (lockedTokens.includes(token)) {
          console.log(`Token: ${token} is locked.`); return
        }

        if (bannedTokens.includes(token)) {
          console.log(`Token: ${token} is banned.`); return
        }

        lockToken(token)

        // const buyObj = await executeBuy(
        //   baseToken, baseTokenPrice, token, document,  limits, ceiling
        // )

        // if (buyObj && buyObj.isBanned) {
        //   banToken(token)
        // }

        unlockToken(token)
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

const setPriceAndPortfolio = async (
): Promise<void> => {
  try {
    const collections = await getCollections()

    if (collections.price?.baseToken) {
      baseTokenPrice = collections.price.baseToken
    }

    limits = collections.limits
    baseToken = collections.baseToken
    trading = collections.portfolio?.auto ? true : false

    console.log(baseToken)
  } catch(err: any) {
    console.log(err)
  }
}

const getCollections = async (
): Promise<{
  price: HydratedDocument<IPrice> | null
  portfolio: HydratedDocument<IPortfolio> | null
  baseToken: HydratedDocument<IToken> | null
  limits: LimitsForSwaps | null
}> => {
  let price: HydratedDocument<IPrice> | null = null
  let portfolio: HydratedDocument<IPortfolio> | null = null
  let baseToken: HydratedDocument<IToken> | null = null
  let limits: LimitsForSwaps | null = null

  try {
    const promises = await Promise.all([
      findOrCreateLastPrice(),
      findOrCreateTradingParams(),
      findOrCreatePortfolio(process.env.WALLET_ADDRESS!),
      findOrCreateToken(addresses.tokens.base),
    ])

    price = promises[0]
    limits = promises[1]
    portfolio = promises[2]
    baseToken = promises[3].token

  } catch(err: any) {
    console.log(err)
  } finally {
    return {
      price, portfolio, baseToken, limits
    }
  }
}
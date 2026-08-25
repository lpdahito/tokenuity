// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/ai/timeReport.js").default()'
// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=56 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/ai/timeReport.js").default()'

import * as mongoose from 'mongoose'
import * as models from './../../models/models.js'

import { databaseUrl } from './../../config/databaseUrl'

import { findOrCreateTradingParams } from './../../helpers/tradingParams.js'

import { balanceInUsd, growth, priceInUsd } from './../../utils/numbers.js'

import {
  IBuy, IHolding, IPool, ISell, IToken, ISelector, ISnippet, Launchpads, Routers, SwapResponse
} from './../../types.js'

const {
  BuyModel: Buy,
  SellModel: Sell,
  PoolModel: Pool,
  TokenModel: Token,
  PriceModel: Price,
  HoldingModel: Holding,
  SelectorModel: Selector,
} = models

interface Position {
  token: string
  tokenAddress: string

  status: string // success, siphoned, rugPulled
  
  occurences: number
  
  timeTo2x: number | null
  timeTo3x: number | null
  timeTo4x: number | null

  timeToPoint90x: number | null
  timeToPoint85x: number | null
  timeToPoint75x: number | null
  timeToPoint50x: number | null
  timeToPoint25x: number | null

  multiple: number
  lowestMultiple: number
  highestMultiple: number
  goodMultiple: number | null

  swapCountOnBuy: number
  tokenAgeOnBuy: number
  swapsPerMinute: number

  liquidityInUsd: number
  timeInvestedInSecs: number
}

interface HoldingItem extends IHolding {
  txs: any[],
  token: IToken,
  growth: string,
  result: string,
  positive: number,
  multiple: number,
  siphoned: boolean,
  priceInUsd: string,
  rugPulled: boolean,
  balanceInUsd: string,
  goodMultiple: number,
  pools: Array<IPool> | null,
  selectors: Array<ISelector>
  // lowestMultiple: number,
  // highestMultiple: number,
  // lpRenounced: boolean | null
  // ownerRenounced: boolean | null
}

export default async () => {
  const ceiling = Math.floor(Date.now() / 1000)
  const oneWeekAgo = ceiling - (((60 * 60) * 24) * 7)

  const holdingCount = 50

  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(databaseUrl)

    const walletAddress = process.env.WALLET_ADDRESS!
    if (!walletAddress) { throw new Error("Portfolio not found") }

    const tradingParams = await findOrCreateTradingParams()
    if (!tradingParams) { return }

    const holdings = await Holding
      .find({ createdAt: { $gte: oneWeekAgo } })
      .sort({ createdAt: -1 })
      .skip(0)
      // .limit(holdingCount)
      .lean()

    const addresses = holdings.map(h => h.address)

    // console.log(addresses.length)

    const tokens = await Token.find({ address: { $in: addresses } })
      .limit(addresses.length)
      .lean()

    // const pools = await Pool.find({
    //   $or:[
    //     { token0: { $in: addresses } },
    //     { token1: { $in: addresses } }
    //   ]
    // }).limit(100).lean()

    const buys = await Buy.find({
      status: 'success', tokenAddress: { $in: addresses }
    }).sort({createdAt: -1}).limit(addresses.length).lean()

    const sells = await Sell.find({
      status: { $in: ['failed', 'success', 'tracked', 'pending'] }, tokenAddress: { $in: addresses }
    }).sort({createdAt: -1}).limit(addresses.length).lean()

    // let _selectors: string[] = []
    // for (const token of tokens) {
    //   for (let selector of token.selectors) {
    //     if (!_selectors.includes(selector)) {
    //       _selectors.push(selector)
    //     }
    //   }
    // }

    // const selectors = await Selector.find({
    //   body: { $in: _selectors }
    // }).lean()

    const lastPrice = await Price.findOne({}).sort({ createdAt: -1 }).lean()
    if (!lastPrice) { return console.log('Couldn\'t find last price') }

    const positions = buildPositionsArray(
      holdings, tokens, buys, sells, // lastPrice.baseToken
    )
    // console.log(positions)

    console.log(JSON.stringify(positions, null, 2))

    // const result = buildObject(
    //   holdingsArray
    // )

    // console.log(holdingsArray)
  } catch (err: any) {
    console.log(err)
  } finally {
    mongoose.disconnect()
  }
}

export const buildPositionsArray = (
  holdings: Array<IHolding>,
  tokens: Array<IToken>,
  buys: Array<IBuy>,
  sells: Array<ISell>,
  // pools: Array<IPool>,
  // selectors: Array<ISelector>,
  // baseTokenPrice: string
): Array<Position> => {
  const ceiling = Math.floor(Date.now() / 1000)
  const rugPullInterval = 60 * 3 // 3 minutes.

  let positionsArray: Array<Position> = []

  for (let holding of holdings) {
    let token = tokens.find((t) => t.address === holding.address)
    if (!token) { continue }

    // let _pools = pools.filter((pool) => {
    //   return [pool.token0, pool.token1].includes(token.address)
    // })

    let _buys = buys.filter((buy) => {
      return buy.tokenAddress === holding.address
    })
    if (!_buys.length) { continue }

    // console.log(_buys.length)

    // _buys = _buys.filter(
    //   (obj, index, self) =>
    //     index === self.findIndex(buy => buy.tokenAddress === obj.tokenAddress)
    // );

    // console.log(_buys.length)

    let _sells = sells.filter((sell) => {
      return sell.tokenAddress === holding.address
    })

    const buy = _buys[0]
    const sell = _sells[0]

    let timeInvestedInSecs = 0
    if (buy.boughtAt && sell.soldAt) {
      timeInvestedInSecs = sell.soldAt - buy.boughtAt
    }

    const position = <Position>{
      token: token.name + ` (${token.symbol})`,
      tokenAddress: token.address,
      status: 'success',
      multiple: 0,
      lowestMultiple: 0,
      highestMultiple: 0,

      goodMultiple: sell.goodMultiple,

      timeTo2x: sell.timeTo2x,
      timeTo3x: sell.timeTo3x,
      timeTo4x: sell.timeTo4x,
      timeToPoint90x: sell.timeToPoint90x,
      timeToPoint85x: sell.timeToPoint85x,
      timeToPoint75x: sell.timeToPoint75x,
      timeToPoint50x: sell.timeToPoint50x,
      timeToPoint25x: sell.timeToPoint25x,

      swapCountOnBuy: buy.swapCount,
      tokenAgeOnBuy: buy.tokenAgeOnTx,
      swapsPerMinute: buy.swapsPerMinute,
      liquidityInUsd: buy.liquidityInUsd,
      timeInvestedInSecs: timeInvestedInSecs
    }

    const tokenActive = !(token.lastSwap < (ceiling - rugPullInterval))

    switch(true) {
      // Siphoned... could not exit
      case (sell.siphoned):
        position.status = 'siphoned'; break;

      // Success... closed position
      case (sell.goodMultiple && sell.goodMultiple > 0):
        position.multiple = sell.goodMultiple
        position.highestMultiple = sell.highestMultiple
        position.lowestMultiple = sell.lowestMultiple

        break;

      // Rug pulled... could not exit
      case (!tokenActive):
        position.status = 'rugPulled';

        if (
          sell
          && sell.prevHighestMultiple
          && sell.prevHighestMultiple < sell.highestMultiple
          && sell.prevHighestMultiple < 1000 // Remove false `highestMultiple`s
        ) {
          sell.highestMultiple = sell.prevHighestMultiple
        }

        position.lowestMultiple = sell.lowestMultiple
        
        break;

      // Still invested... skip
      default:
        continue;
    }

    positionsArray.push(position)
  }

  return positionsArray
}

const buildObject = (
  holdingsArray: HoldingItem[]
): Array<any> => {
  let obj = []

  for (const item of holdingsArray) {
    let holding = {
      token: {
        name: item.token.name,
        symbol: item.token.symbol,
        address: item.token.address,
        verified: item.token.verified,
        // protocol: item.token.protocols,
        compliant: item.token.compliant,
        launchpad: item.token.launchpad,
        ownerRenounced: item.token.ownerRenounced
      },
      result: item.result,
      amount: item.amount,
      createdAt: item.createdAt,
      avgPriceInBase: item.avgPriceInBase,
      buy: null,
      // sell: item.txs[0].sell || null
    }

    if (
      item.txs
      && typeof item.txs === 'object'
    ) {
      if (item.txs[0].buy) {
        const buy = item.txs[0].buy

        let _buy = {
          protocol: buy.protocol,
          tokenAgeOnBuy: buy.tokenAgeOnTx,
          liquidityInUsd: buy.liquidityInUsd
        }

        // holding.buy = _buy
      }
    }

    obj.push(holding)
  }

  return obj
}
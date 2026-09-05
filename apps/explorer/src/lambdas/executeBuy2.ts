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
import { findOrCreateBuy } from './../helpers/buys.js'
import { updatePortfolio } from './../helpers/portfolios.js'
import { sendDiscordMessage } from './../helpers/discord.js'
import { findOrCreateCreator } from './../helpers/creators.js'
import { isApeStore, isFourMeme } from './../helpers/launchpads.js'
import { getLiquidityInBase, buyCount, compute } from './../helpers/pools.js'
import { findOrCreateSnippet, getSourceCodeData } from './../helpers/snippets.js'
import { getTokenCreator, getTokenSourceCode, isVerified } from './../helpers/tokens.js'

import { DexProtocols, IBuy, IHolding, IPool, IPortfolio, ISnippet, IToken, ITokenSwap, Launchpads } from '@tokenuity/types'
import { LimitsForSwaps, Routers, SwapResponse } from './../types.js'

const {
  SellModel: Sell,
  TokenModel: Token,
  HoldingModel: Holding,
  SnippetModel: Snippet,
  PortfolioModel: Portfolio,
  TokenSwapModel: TokenSwap,
} = models

let chainColor = '🔵'
let baseCoin = 'ETH'

switch (chain.name) {
  case 'base':
  chainColor = '🔵'; baseCoin = 'ETH'; break;

  case 'bsc':
  chainColor = '🟡'; baseCoin = 'BNB'; break;
}

const MAX_ATTEMPTS = 140
const TRUST_SCORE_MIN = 4

const TOKENUITY_CONTRACT = new ethers.Contract(
  addresses.tokenuity, contracts.tokenuity.abi, wallets[0]
)

export default async (
  baseToken: HydratedDocument<IToken>,
  baseTokenPrice: string,
  tokenAddress: string,
  pool: Document,
  limits: LimitsForSwaps,
  ceiling: number
): Promise<{
  isBanned: boolean,
  holding: HydratedDocument<IHolding> | null
} | void> => {
  if (isLocal) return
  
  let save = false
  let isBanned = false

  let trustScore: number | null = null

  let fake = true

  let tokenAge = 0
  let tokenAgeInMins = 0

  let amountIn = 0n
  let amountOut = 0n

  let liquidityInBase = 0n

  let avgPriceInBase = '0'

  let portfolioBalance = 0n
  let amountInMax = BigInt(
    (BigNumber(baseTokenPrice.toString()).times(limits.amountIn)).toFixed(0)
  );

  const swapCount = pool.swapCount || 0
  const _buyCount = buyCount(pool)

  let swapsPerMinute = 0
      
  const buyCountPct = buyCount(pool) ? (_buyCount / swapCount) : 0

  let buy: HydratedDocument<IBuy> | null = null
  let token: HydratedDocument<IToken> | null = null
  let holding: HydratedDocument<IHolding> | null = null
  let portfolio: HydratedDocument<IPortfolio> | null = null
  let tokenswaps: Array<HydratedDocument<ITokenSwap>> = []

  let snippets: Array<HydratedDocument<ISnippet>> = []

  let txResponse: SwapResponse | null = null

  const formattedTime = getFormattedTime()

  let msg = 'initializing'

  try {
    tokenAge = (ceiling - pool.firstSwap)
    tokenAgeInMins = tokenAge / 60
    
    swapsPerMinute = swapCount / tokenAgeInMins

    if (pool.firstSwap > (ceiling - limits.tokenAgeMin)) {
      msg = formattedTime + 'pool.firstSwap > (ceiling - limits.tokenAgeMin)'; return
    }

    if (pool.firstSwap < (ceiling - limits.tokenAgeMax)) {
      msg = formattedTime + 'pool.firstSwap < (ceiling - limits.tokenAgeMax)'; return
    }
  
    if (swapCount < limits.swapCountMin) {
      msg = formattedTime + 'pool.swapCount < limits.swapCountMin'; return
    }

    const swapsPerMinuteMin = (chain.id === 56) ? 100 : 10

    if (swapsPerMinute < swapsPerMinuteMin) {
      msg = formattedTime + 'swapsPerMinute < swapsPerMinuteMin'; return
    }

    // if (buyCountPct < limits.buyCountPctMin) {
    //   msg = formattedTime + 'buyCountPct < limits.buyCountPctMin'; return
    // }

    const computations = compute(pool)

    if (!computations || !computations.shouldBuy) {
      msg = formattedTime + '!computations || !computations.shouldBuy'; return
    }

    let collections = await getCollections(
      pool.address, tokenAddress, ceiling
    )

    buy = collections.buy
    token = collections.token
    holding = collections.holding
    portfolio = collections.portfolio
    tokenswaps = collections.tokenswaps

    if (!portfolio) {
      msg = formattedTime + 'Portfolio not found'; return
    }

    fake = ['0', '1'].includes(portfolio.wallet)

    if (holding) {
      msg = 'Holding already exists'; return { holding, isBanned: true }
    }

    if (!buy) {
      msg = 'Couldn\'t find or create buy'; return
    }

    if (!token) {
      msg = formattedTime + 'Could not find token';
      return { holding, isBanned: true }
    }

    if (!token.follow) {
      msg = formattedTime + 'Token is not followed';
      return { holding, isBanned: true }
    }

    // tokenAge = ceiling - token.createdAt

    // if (tokenAge > limits.tokenAgeMax) {
    //   msg = formattedTime + 'token.createdAt < (ceiling - limits.tokenAgeMax)'
      
    //   return { holding, isBanned: true }
    // }

    if (buy.status === 'success') {
      msg = formattedTime + 'Buy is already successful';
      return { holding, isBanned: true }
    }

    if (buy.status === 'failed') {
      if (buy.attempts >= MAX_ATTEMPTS) {
        msg = buy.messages[0]; return { holding, isBanned: true }
      }
    }

    if (buy.status !== 'pending') {
      buy.status = 'pending'
      // buy.randomString = randomString

      // await buy.save()
    }

    /** Make sure to save tx */
    save = true
    /** Make sure to save tx */

    const tokenContract = new ethers.Contract(
      token.address, contracts.erc20.abi, wallets[0]
    )

    let tokenSourceCode = ''

    // 1. Make sure token is verified

    if (token.verified === null) {
      tokenSourceCode = await getTokenSourceCode(token.address)

      token.verified = (tokenSourceCode.length ? true : false)

      await token.save()
    }

    if (token.verified === false) {
      msg = formattedTime + 'Token is not verified'; return
    }

    if (token.launchpad === null) {
      let launchpad = Launchpads.unknown

      switch (chain.id) {
        case 56:
          const _isFourMeme = await isFourMeme(token.address)
          if (_isFourMeme) { launchpad = Launchpads.fourmeme }

          break;

        // case 8453:
        //   const _isApeStore = await isApeStore(token.address)
        //   if (_isApeStore) { launchpad = Launchpads.apestore }

        //   break;
      }

      token.launchpad = launchpad
      await token.save()
    }

    if (!token.launchpad) {
      if (
        chain.id === 56
        || chain.id === 8453
      ) {
        msg = formattedTime + 'Token is not from Launchpad';

        return { holding, isBanned: true }
      }

      // if (selectorData.unallowed.length) {
      //   token.follow = false; await token.save();

      //   msg = 'Token contains unwanted selectors'; return
      // }

      // 2. Make sure token snippets are safe

      if (token.snippetSafe === null) {
        if (!tokenSourceCode.length) {
          tokenSourceCode = await getTokenSourceCode(token.address)
        }

        const sourceCodeData = getSourceCodeData(tokenSourceCode)

        if (sourceCodeData === null) {
          token.snippetSafe = false
          token.follow = false

          await token.save()

          msg = formattedTime + 'Cannot parse token snippets'
          return { holding, isBanned: true }
        } else if (sourceCodeData.snippets.length) {
          token.compliant = false

          for (let snippet of sourceCodeData.snippets) {
            let _snippet = await findOrCreateSnippet( // should be Promise.all call *****************
              token.address, snippet.scope, snippet.body
            )

            if (_snippet) {
              if (_snippet.blocked) {
                token.snippetSafe = false
                token.follow = false

                await token.save()

                msg = formattedTime + 'Contains blocked snippet';
                
                return { holding, isBanned: true }
              }

              if (_snippet.trustScore !== null) {
                if (
                  trustScore === null
                  || trustScore > _snippet.trustScore
                ) {
                  trustScore = _snippet.trustScore
                }

                if (_snippet.trustScore < TRUST_SCORE_MIN) {
                  token.snippetSafe = false;
                  token.follow = false;

                  await token.save()

                  msg = formattedTime + 'Trust score is ' + _snippet.trustScore

                  let botMsg = msg
                  botMsg += `\n ${token.name} (${token.symbol})`

                  // sendDiscordMessage(
                  //   chainColor + ' ' + botMsg
                  // )

                  return { holding, isBanned: true }
                }
              }

              snippets.push(_snippet)
            }
          }

          token.snippetSafe = true

          await token.save()
        } else if (!sourceCodeData.snippets.length) {
          token.compliant = true
          token.snippetSafe = true

          await token.save()
        }  
      } else if (token.snippetSafe) {
        snippets = await Snippet.find({ tokens: token })

        for (let snippet of snippets) {
          if (snippet.blocked) {
            token.snippetSafe = false;
            token.follow = false;

            await token.save()

            msg = formattedTime + 'Contains blocked snippet';
            
            return { holding, isBanned: true }
          }

          if (snippet.trustScore !== null) {
            if (
              trustScore === null
              || trustScore > snippet.trustScore
            ) {
              trustScore = snippet.trustScore
            }

            if (snippet.trustScore < TRUST_SCORE_MIN) {
              token.snippetSafe = false;
              token.follow = false;

              await token.save()

              msg = formattedTime + 'Trust score is ' + snippet.trustScore

              return { holding, isBanned: true }
            }
          }
        }
      }

      if (token.snippetSafe === false) {
        msg = formattedTime + 'Contains unsafe snippets'
        return { holding, isBanned: true }
      }

      for (let snippet of snippets) {
        let tokens = snippet.tokens

        if (tokens.includes(token.address)) {
          const _token = token.address

          tokens = tokens.filter(t => t !== _token)
        }

        tokens.unshift(token.address)
        if (tokens.length > 10) { tokens.pop() }

        snippet.tokens = tokens
        await snippet.save()
      }
    }

    if (!token.creator) {
      let tokenCreator = await getTokenCreator(token.address)
      
      if (tokenCreator.length) {
        token.creator = tokenCreator
        await token.save()

        const creator = await findOrCreateCreator(tokenCreator)

        if (creator && creator.failCount) {
          token.follow = false; await token.save()

          msg = formattedTime + 'creator is a known scammer'
          return { holding, isBanned: true }
        }
      }
    }

    if (!fake) {
      portfolioBalance = await providers[0].getBalance(portfolio.wallet)

      if (portfolio.balance !== portfolioBalance.toString()) {
        portfolio.balance = portfolioBalance.toString()
  
        await portfolio.save()
      }
    }

    const _amountInMax = (portfolioBalance / 30n)
    if (amountInMax > _amountInMax) { amountInMax = _amountInMax }

    amountIn = amountInMax

    if (portfolioBalance < amountIn) {
      msg = formattedTime + 'Coin balance is < amountIn required.'; return
    }

    if (amountIn === 0n) {
      msg = formattedTime + 'amountIn is 0'; return
    }

    if (pool.protocol !== DexProtocols.uniswapv4) {
      liquidityInBase = await getLiquidityInBase(pool)

      if (liquidityInBase === 0n) {
        msg = formattedTime + 'Liquidity is 0'; return
      }

      if (liquidityInBase < (BigInt(baseTokenPrice) * BigInt(limits.liquidityInUsdMin))) {
        msg = formattedTime + 'Liquidity is too small: ' + liquidityInBase.toString();

        console.log(msg)
        // buy.attempts = MAX_ATTEMPTS;
        return
      }
    }

    const swapParams = {
      pool, amountIn, buy: true, signer: wallets[0],
    }

    const swap = new Swap(swapParams)

    amountOut = await swap.quote()
    const calldata = await swap.encode()

    if (!amountOut || amountOut === 0n) {
      msg = formattedTime + 'amountOut is 0'; return
    }

    if (!calldata || calldata === '') {
      msg = formattedTime + 'calldata is null'; return
    }

    /***************************/
    /** Real transaction starts */
    if (!fake) {
      let tokenOutBalanceBefore = 0n
      tokenOutBalanceBefore = await TOKENUITY_CONTRACT.balanceFor(
        token.address
      )

      console.log('tokenOutBalanceBefore:', tokenOutBalanceBefore)

      let estimateGas = false
      if (buy.attempts > 0) { estimateGas = true }

      txResponse = await swap.execute({
        estimateGas: estimateGas
      })

      if (!txResponse.success || !txResponse.tx) {
        throw new Error('Buy failed')
      }

      // wait for 1 block
      const receipt = await providers[0].waitForTransaction(txResponse.tx, 1)

      let tokenOutBalanceAfter = 0n
      tokenOutBalanceAfter = await TOKENUITY_CONTRACT.balanceFor(
        token.address, { blockTag: receipt?.blockNumber }
      )

      console.log('tokenOutBalanceAfter:', tokenOutBalanceAfter)

      const tokenOutBalanceDelta = tokenOutBalanceAfter - tokenOutBalanceBefore
      amountOut = (tokenOutBalanceDelta < 0n) ? -tokenOutBalanceDelta : tokenOutBalanceDelta

      console.log('amountOut:', amountOut)
    }
    /** Real transaction ends */
    /***************************/

    const obj = await updatePortfolio(
      portfolio,
      baseToken, // tokenIn
      token, // tokenOut
      amountIn,
      amountOut
    )

    holding = obj.holding
    // portfolio = await Portfolio.findOne({ wallet: portfolio.wallet }) // reload portfolio because it was saved in updatePortfolio call: "__v" +1...

    buy.status = 'success'
    if (buy.boughtAt === null) { buy.boughtAt = ceiling }
    if (buy.swapIndex === 0) { buy.swapIndex = pool.firstSwaps.length }

    msg = formattedTime + `Bought ${token.symbol}: ${amountIn.toString()} (${baseCoin}) >> ${amountOut.toString()} (${token.symbol})`

    const usdAmount = (BigNumber(amountIn.toString()).div(baseTokenPrice.toString())).toFixed(2)
    buy.amountInUsd = Number(usdAmount)

    let protocol = 'uniswapv2'
    switch (pool.protocol) {
      case DexProtocols.pancakeswapv2:
        protocol = 'pancakeswapv2'
        break;

      case DexProtocols.uniswapv3:
        protocol = 'uniswapv3'
        break;
    }

    let botMsg = ''
    botMsg = `Bought $${usdAmount} worth of ${token.name} (${token.symbol})\n`
    botMsg += `Attempt: ${buy.attempts + 1}, Launchpad: ${token.launchpad}, Protocol: ${protocol}`

    if (txResponse) {
      botMsg += '\n--\n'
      botMsg += `${explorer.url}tx/${txResponse.tx}`
    }
    
    if (!fake) {
      sendDiscordMessage(
        chainColor + ' ' + botMsg
      )
    }
  } catch(err: any) {
    if (buy && buy.attempts > 5) {
      buy.attempts = MAX_ATTEMPTS
    }

    if ('message' in err) {
      msg = err.message
    }

    // Logger.err({ error: err, report: true })

    console.log(err)
  } finally {
    if (buy && save) {
      if (buy.status !== 'success') {
        buy.status = 'failed'
      }

      // if (amountOut > 0n) {
      //   buy.avgPriceInBase = (amountIn * BigInt(10 ** tokenOut.decimals) / amountOut).toString()
      // }

      if (liquidityInBase) {
        buy.liquidityInBase = liquidityInBase.toString()
        buy.liquidityInUsd = Number(liquidityInBase / BigInt(baseTokenPrice))
      }

      if (txResponse && txResponse.tx) {
        buy.tx = txResponse.tx
      }

      buy.attempts++
      buy.messages.unshift(msg)

      buy.tokenAgeOnTx = tokenAge

      buy.amount = amountOut.toString()
      buy.otherAmount = amountIn.toString()

      buy.baseTokenPrice = baseTokenPrice.toString()
      // buy.baseTokenPriceChange = baseTokenPriceChange

      buy.swapCount = swapCount
      // buy.holderCount = data?.holderCount
      buy.swapsPerMinute = swapsPerMinute
      // buy.holderCountRatio = data?.holderCountRatio

      buy.buyCountPct = buyCountPct
      
      // buy.buySellVolumeRatio = data?.buySellVolumeRatio
      // buy.buyVolumeInUsdMedian = data?.buyVolumeInUsdMedian,
      // buy.buyVolumeInUsdMean = data?.buyVolumeInUsdMean,
      // buy.buyVolumeInUsdIqr = data?.buyVolumeInUsdIqr,
      // buy.sellVolumeInUsdMedian = data?.sellVolumeInUsdMedian,
      // buy.sellVolumeInUsdMean = data?.sellVolumeInUsdMean,
      // buy.sellVolumeInUsdIqr = data?.sellVolumeInUsdIqr,
      // buy.volumeInUsdMedian = data?.volumeInUsdMedian,
      // buy.volumeInUsdMean = data?.volumeInUsdMean,
      // buy.volumeInUsdIqr = data?.volumeInUsdIqr,

      // buy.tokenHoldersWithOne = tokenHoldersWithOne
      // buy.tokenHoldersWithTwenty = tokenHoldersWithTwenty
      // buy.tokenHoldersWithOneHundred = tokenHoldersWithOneHundred
      // buy.tokenHoldersWithOneThousand = tokenHoldersWithOneThousand

      // buy.coinHoldersWithOne = coinHoldersWithOne
      // buy.coinHoldersWithTwenty = coinHoldersWithTwenty
      // buy.coinHoldersWithOneHundred = coinHoldersWithOneHundred
      // buy.coinHoldersWithOneThousand = coinHoldersWithOneThousand

      buy.updatedAt = Math.floor(Date.now() / 1000)

      await buy.save()

      // if (buy.status === 'success') {
      //   let sell = new Sell({
      //     tokenAddress,
      //     status: 'tracked',
      //     attempts: 0,
      //     txAttempts: 0,
      //     trigger: null,
      //     remaining: true,
      //     multiple: 1,
      //     goodMultiple: null,
      //     lowestMultiple: 1,
      //     highestMultiple: 1,
      //     prevHighestMultiple: 1,

      //     amount: '0',
      //     liquidityInBase: '0',
      //     liquidityInUsd: 0,
      //     messages: [],
      //   })

      //   if (holding?.avgPriceInBase) {
      //     sell.prices = [ holding.avgPriceInBase ]
      //   }

      //   await sell.save()
      // }
    }
    return {
      holding, isBanned
    }
  }
}

const getCollections = async (
  poolAddress: string,
  tokenAddress: string,
  ceiling: number
): Promise<{
  buy: HydratedDocument<IBuy> | null
  token: HydratedDocument<IToken> | null
  holding: HydratedDocument<IHolding> | null
  portfolio: HydratedDocument<IPortfolio> | null
  tokenswaps: Array<HydratedDocument<ITokenSwap>>
}> => {
  let buy: HydratedDocument<IBuy> | null = null
  let token: HydratedDocument<IToken> | null = null
  let holding: HydratedDocument<IHolding> | null = null
  let portfolio: HydratedDocument<IPortfolio> | null = null
  let tokenswaps: Array<HydratedDocument<ITokenSwap>> = []

  try {
    const promises = await Promise.all([
      findOrCreateBuy(tokenAddress),
      Token.findOne({ address: tokenAddress }),
      Holding.findOne({ address: tokenAddress }),
      Portfolio.findOne({  wallet: process.env.WALLET_ADDRESS! }),
      TokenSwap.find({ pool: poolAddress, timestamp: { $gte: (ceiling - (60 * 30)) }}).sort({ block: -1 })
    ])

    buy = promises[0]
    token = promises[1]
    holding = promises[2]
    portfolio = promises[3]
    tokenswaps = promises[4]
  } catch(err: any) {
    console.log(err)
  } finally {
    return { buy, token, holding, portfolio, tokenswaps }
  }
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
  
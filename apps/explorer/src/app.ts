// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 --env INSTANCE_FUNCTION_TYPE=findPools -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/app.js")'
// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 --env INSTANCE_FUNCTION_TYPE=findSwaps -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/app.js")'

// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=56 --env INSTANCE_FUNCTION_TYPE=findPools -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/app.js")'
// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=56 --env INSTANCE_FUNCTION_TYPE=findSwaps -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/app.js")'

import * as cron from 'node-cron'

import * as models from '@tokenuity/store'
import { connect } from '@tokenuity/store'

import { chain } from './config/chain.js'
import isLocal from './config/isLocal.js'
import { Logger } from './config/logger.js'
import addresses from './config/addresses.js'
import { databaseUrl } from './config/databaseUrl.js'

import { findOrCreateToken } from './helpers/tokens.js'

import findPools from './lambdas/findPools.js'
import findSwaps from './lambdas/findSwaps.js'
import findTransfers from './lambdas/findTransfers.js'

import findTrades from './lambdas/findTrades.js'

// import scanBuyOpps from './lambdas/serverless/scanBuyOpps.js'
// import scanSellOpps from './lambdas/serverless/scanSellOpps.js'

const {
  BuyModel: Buy,
  PoolModel: Pool,
  SellModel: Sell,
  TokenModel: Token,
  PriceModel: Price,
  CheckModel: Check,
  HoldingModel: Holding,
  SnippetModel: Snippet,
  SelectorModel: Selector,
  TokenSwapModel: TokenSwap,
} = models

const main = async () => {
  let seconds = 0

  if (isLocal) {
    setInterval(() => {
      seconds++
      if (seconds > 60) {
        console.log('Existing on local after 60 seconds.')
        process.exit(0)
      }
    }, 1000)
  }

  try {
    await connect()
    console.log('Connected to database.')

    switch (process.env.INSTANCE_FUNCTION_TYPE) {
      case 'findPools':
        _findPools(); break;

      case 'findSwaps':
        _findSwaps(); break;

      case 'findTransfers':
        _findTransfers(); break;


      case 'findTrades':
        await _findTrades(); break;
    }

    console.log('Successfuly reached end of main function.')
  } catch(err: any) {
    // Logger.err({ error: err, report: true })
    console.log(err)
  }
}

main();

// keep Node alive even if run() finishes quickly
setInterval(() => {}, 1 << 30);

const _findPools = async () => {
  console.log('Inside _findPools.')

  try {
    await Buy.collection.dropIndexes()
    await Sell.collection.dropIndexes()
    await Pool.collection.dropIndexes()
    await Token.collection.dropIndexes()
    await Price.collection.dropIndexes()
    await Check.collection.dropIndexes()
    await Holding.collection.dropIndexes()
    await Snippet.collection.dropIndexes()
    await Selector.collection.dropIndexes()
    await TokenSwap.collection.dropIndexes()

    await Price.collection.createIndex({ createdAt: -1 })
    await Check.collection.createIndex({ createdAt: -1 })
    await Check.collection.createIndex({ type: 1, createdAt: 1  })
    await Pool.collection.createIndex({ address: 1 }, { unique: true })
    await Token.collection.createIndex({ address: 1 }, { unique: true })
    await Holding.collection.createIndex({ address: 1 }, { unique: true })
    await Buy.collection.createIndex({ tokenAddress: 1 }, { unique: true })
    await Sell.collection.createIndex({ tokenAddress: 1 }, { unique: true })

    await Selector.collection.createIndex({ body: 1 }, { unique: true })
    await TokenSwap.collection.createIndex({ tx: 1 }, { unique: true })
    await Snippet.collection.createIndex({ scope: 1, body: 1 }, { unique: true })

    const { token: baseToken } = await findOrCreateToken(addresses.tokens.base)
    if (!baseToken) return console.log('Could not find or create baseToken...')

    let isRunning = false

    cron.schedule('*/10 * * * * *', async () => {
      if (isRunning) { return }

      isRunning = true

      try {
        await findPools()
      } finally {
        isRunning = false
      }
    })

    console.log('Reached end of _findPools.')
  } catch(err: any) {
    // Logger.err({ error: err, report: true })
    console.log(err)
  }
}

const _findSwaps = async () => {
  console.log('Inside _findSwaps.')

  try {
    const { token: baseToken } = await findOrCreateToken(addresses.tokens.base)
    if (!baseToken) return console.log('Could not find or create baseToken...')

    let isRunning = false

    cron.schedule('*/10 * * * * *', async () => {
      if (isRunning) { return }

      isRunning = true

      try {
        await findSwaps()
      } finally {
        isRunning = false
      }
    })

    console.log('Reached end of _findSwaps.')
  } catch(err: any) {
    // Logger.err({ error: err, report: true })
    console.log(err)
  }
}

const _findTransfers = async () => {
  console.log('Inside _findSwaps.')

  try {
    const { token: baseToken } = await findOrCreateToken(addresses.tokens.base)
    if (!baseToken) return console.log('Could not find or create baseToken...')

    let isRunning = false

    cron.schedule('*/10 * * * * *', async () => {
      if (isRunning) { return }

      isRunning = true

      try {
        await findTransfers()
      } finally {
        isRunning = false
      }
    })

    console.log('Reached end of _findTransfers.')
  } catch(err: any) {
    // Logger.err({ error: err, report: true })
    console.log(err)
  }
}

const _findTrades = async () => {
  console.log('Inside _findTrades.')

  try {
    await findTrades()

    console.log('Reached end of _findTrades.')
  } catch(err: any) {
    // Logger.err({ error: err, report: true })
    console.log(err)
  }
}

// const _scanBuyOpps = async () => {
//   console.log('Inside _scanBuyOpps.')

//   try {
//     const { token: baseToken } = await findOrCreateToken(addresses.tokens.base)
//     if (!baseToken) return console.log('Could not find or create baseToken...')

//     let isRunning = false

//     cron.schedule('*/20 * * * * *', async () => {
//       if (isRunning) { return }

//       isRunning = true

//       try {
//         await scanBuyOpps(baseToken)
//       } finally {
//         isRunning = false
//       }
//     })

//     console.log('Reached end of _scanBuyOpps.')
//   } catch(err: any) {
//     // Logger.err({ error: err, report: true })
//     console.log(err)
//   }
// }

// const _scanSellOpps = async () => {
//   console.log('Inside _scanSellOpps.')

//   try {
//     const { token: baseToken } = await findOrCreateToken(addresses.tokens.base)
//     if (!baseToken) return console.log('Could not find or create baseToken...')

//     let isRunning = false

//     cron.schedule('*/15 * * * * *', async () => {
//       if (isRunning) { return }

//       isRunning = true

//       try {
//         await scanSellOpps(baseToken)
//       } finally {
//         isRunning = false
//       }
//     })

//     console.log('Reached end of _scanSellOpps.')
//   } catch(err: any) {
//     // Logger.err({ error: err, report: true })
//     console.log(err)
//   }
// }
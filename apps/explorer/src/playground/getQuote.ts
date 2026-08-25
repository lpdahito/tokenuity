// docker run -it --rm --link mongo-server --env-file .env -v /Users/lpdahito/Projects/tokenuity/trends/trends-explorer/dist:/app/dist explorer node ./dist/playground/getQuote.js

import { ethers } from 'ethers'

import addresses from '../config/addresses'
import { contracts } from '../contracts/contracts'

import { wallets } from '../config/provider'

const getQuote = async (
): Promise<void> => {
  let amountOut = BigInt(0)

  const quoteExactInputSingleParams = {
    tokenIn: addresses.tokens.base,
    tokenOut: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    amountIn: BigInt('1000000000000000000'),
    fee: 3000,
    sqrtPriceLimitX96: 0
  }

  const quoterV2Contract = new ethers.Contract(
    addresses.uniswap.v3.quoterv2, contracts.uniswapv3.quoterv2.abi, wallets[0]
  )

  try {
    let quoterV2Resp = await quoterV2Contract.quoteExactInputSingle.staticCall(
      quoteExactInputSingleParams
    )

    amountOut = quoterV2Resp[0]

    console.log(amountOut.toString())
  } catch (err: any) {
    console.log(err)
  }
}

getQuote()
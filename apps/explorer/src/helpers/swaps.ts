import { ethers } from 'ethers'
import type { HydratedDocument } from 'mongoose'
import { Document } from 'mongodb'

import erc20 from '../contracts/abis/openzeppelin/ERC20.json' // assert { type: 'json' }

import UniswapV2SwapRouter02 from '../contracts/abis/uniswapv2/UniswapV2Router02.json' // assert { type: 'json' }
import UniswapV3SwapRouter02 from '../contracts/abis/uniswapv3/SwapRouter02.json' // assert { type: 'json' }

import PancakeswapV2RouterAbi from '../contracts/abis/pancakeswapv2/PancakeRouter.json'

import { chain } from '../config/chain.js'
import { Logger } from '../config/logger.js'
import addresses from '../config/addresses.js'

import { contracts } from '../contracts/contracts.js'

import { sendDiscordMessage } from './../helpers/discord.js'
import { baseToken as getBaseToken, quoteToken as getQuoteToken } from './../helpers/pools.js'

import { DexProtocols, IPool } from '@tokenuity/types'
import { SwapResponse } from '../types.js'

export interface IUniversalRouterExecuteCall {
  commands: string,
  inputs: Array<string>,
  deadline: number
}

interface SwapParams {
  buy: boolean
  amountIn: bigint
  pool: Document | HydratedDocument<IPool>
  signer: ethers.Wallet
}

interface TxParams {
  from: string
  to: string
  data: string
  value: bigint
  chainId: number
  gasLimit: bigint
  gasPrice: bigint,
  type: number | null
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
}

let chainColor = '🔵'

switch (chain.name) {
  case 'base':
  chainColor = '🔵'; break;

  case 'bsc':
  chainColor = '🟡'; break;
}

export class Swap {
  buy: boolean

  tokenIn: string
  tokenOut: string

  fee: number = 3000

  path: string[] = []

  calldata: string = ''

  amountIn: bigint = 0n
  amountOut: bigint = 0n

  protocol: DexProtocols

  tickSpacing: number = 10

  tokenInContract: ethers.Contract
  tokenOutContract: ethers.Contract

  pool: Document | HydratedDocument<IPool>

  signer: ethers.Wallet
  
  hooks: string = '0x0000000000000000000000000000000000000000'

  constructor(
    params: SwapParams
  ) {
    this.buy = params.buy
    this.pool = params.pool
    this.signer = params.signer
    this.amountIn = params.amountIn

    this.fee = this.pool.fee
    this.protocol = this.pool.protocol
    this.tickSpacing = this.pool.tickSpacing

    if (this.pool.hooks) {
      this.hooks = this.pool.hooks
    }

    const _baseToken = getBaseToken(this.pool)
    const _quoteToken = getQuoteToken(this.pool)

    if (this.buy) {
      this.tokenIn = _baseToken
      this.tokenOut = _quoteToken
    } else {
      this.tokenIn = _quoteToken
      this.tokenOut = _baseToken
    }

    this.path = [ this.tokenIn, this.tokenOut ]

    this.tokenInContract = new ethers.Contract(
      this.tokenIn, erc20.abi, this.signer
    )

    this.tokenOutContract = new ethers.Contract(
      this.tokenOut, erc20.abi, this.signer
    )
  }

  async encode(
  ): Promise<string> {
    try {
      this.calldata = this.encodeForDefault()
    } catch (err: any) {
      Logger.err({ error: err, report: true })
    } finally {
      return this.calldata
    }
  }

  async quote(
  ): Promise<bigint> {
    try {
      switch(this.protocol) {
        case DexProtocols.uniswapv2:
        case DexProtocols.sushiswapv2:
          this.amountOut = await this.quoteForUniswapV2()
          break;

        case DexProtocols.pancakeswapv2:
          this.amountOut = await this.quoteForPancakeswapV2()
          break;
  
        case DexProtocols.uniswapv3:
          this.amountOut = await this.quoteForUniswapV3()
          break;

        case DexProtocols.uniswapv4:
          this.amountOut = await this.quoteForUniswapV4()
          break;
      }
    } catch (err: any) {
      Logger.err({ error: err, report: true })
    } finally {
      return this.amountOut
    }
  }

  async execute(
    opts?: {
      estimateGas?: boolean,
      estimateGasOnly?: boolean
    }
  ): Promise<SwapResponse> {
    let tx: ethers.TransactionResponse | null = null

    let response: SwapResponse = {
      success: false, tx: null, msg: null
    }

    const provider = new ethers.JsonRpcProvider(chain.publicNode)

    let value = BigInt(0)
    if (this.buy) value = this.amountIn
  
    try {
      const feeData = await provider.getFeeData()

      const gasPrice = feeData['gasPrice']

      if (!gasPrice) {
        response.msg = 'Gas price is null';

        return response
      }

      let maxFeePerGas = feeData['maxFeePerGas']
      let maxPriorityFeePerGas = feeData['maxPriorityFeePerGas']

      if (chain.name !== 'bsc') {
        if (!maxFeePerGas || !maxPriorityFeePerGas) {
          response.msg = 'Gas fee data is missing'
          
          return response
        }
  
        /** Bump up by 5% */
        maxFeePerGas = (maxFeePerGas * BigInt(105)) / BigInt(100)
        maxPriorityFeePerGas = (maxPriorityFeePerGas * BigInt(105)) / BigInt(100)
      }

      if (opts?.estimateGas || opts?.estimateGasOnly) {
        const estimatedGas = await this.signer.estimateGas({
          from: this.signer.address,
          to: addresses.tokenuity,
          data: this.calldata,
          chainId: chain.id,
          value: value,
          type: 1,
        })

        // console.log(estimatedGas)
        // console.log(txType)
  
        if (!estimatedGas || estimatedGas === BigInt(0)) {
          response.msg = 'Estimated gas is 0';

          return response
        }
      }

      if (opts?.estimateGasOnly) {
        response.success = true
        response.msg = 'Estimated gas only'

        return response
      }

      // console.log('Estimated gas:', estimatedGas.toString())

      // const estimatedGasPaid = estimatedGas * gasPrice
      // const maxEstimatedGasPaid = estimatedGas * maxFeePerGas

      // const estimatedGasPaidInEth = estimatedGasPaid / BigInt(10 ** 9)
      // const maxEstimatedGasPaidInEth = maxEstimatedGasPaid / BigInt(10 ** 9)

      // const gasPriceLimitInEth = (baseTokenPrice * BigInt('35')) // $35 USD

      // if (estimatedGasPaidInEth > gasPriceLimitInEth) {
      //   console.log('Gas fees are too high: ' + maxEstimatedGasPaidInEth.toString())
      //   return success
      // }

      // console.log('before swap...')

      let txParams: TxParams = {
        from: this.signer.address,
        to: addresses.tokenuity,
        data: this.calldata,
        chainId: chain.id,
        value: value,
        type: 1,
        gasPrice: gasPrice,
        gasLimit: BigInt(3500000)
      }

      // if (maxFeePerGas) {
      //   txParams.maxFeePerGas = maxFeePerGas
      // }

      // if (maxPriorityFeePerGas) {
      //   txParams.maxPriorityFeePerGas = maxPriorityFeePerGas
      // }

      console.log('before sendTransaction')

      tx = await this.signer.sendTransaction(txParams)
      // console.log(tx)

      console.log('after sendTransaction')

      const receipt = await waitForReceipt(this.signer.provider, tx.hash)

      console.log('after waitForReceipt')

      if (receipt) {
        response.success = true; response.tx = tx.hash;
      } else {
        console.log('tx error')
      }
    } catch (err: any) {
      if (tx && tx.hash) response.tx = tx.hash
      if ('message' in err) { response.msg = err.message }

      Logger.err({ error: err, report: true })
    } finally {
      return response
    }
  }

  encodeForDefault(
  ): string {
    const defaultContract = new ethers.Contract(
      addresses.tokenuity, contracts.tokenuity.abi, this.signer
    )

    const quoteToken = this.buy ? this.tokenOut : this.tokenIn

    let _functionParams = [
      quoteToken,
      this.amountIn,
      (((this.amountOut * BigInt(1000)) / BigInt(10)) * BigInt(5)) / BigInt(1000), // 50% slippage
      this.protocol,
      this.fee,
      this.path,
      this.hooks,
      this.tickSpacing
    ]
  
    return defaultContract.interface.encodeFunctionData(
      'execute', _functionParams
    )
  }

  async quoteForUniswapV2(
  ): Promise<bigint> {
    let amountOut = BigInt(0)
    
    let router = addresses.uniswap.v2.swapRouter02
    if (this.protocol === DexProtocols.sushiswapv2) {
      router = addresses.sushiswap.v2.swapRouter02
    }

    const routerContract = new ethers.Contract(
      router, UniswapV2SwapRouter02.abi, this.signer
    )
  
    try {
      const amountsOut = await routerContract.getAmountsOut(this.amountIn, this.path)
      amountOut = amountsOut[1]
    } catch (err: any) {
      Logger.err({ error: err, report: true })
    } finally {
      return amountOut
    }
  }

  async quoteForPancakeswapV2(
  ): Promise<bigint> {
    let amountOut = BigInt(0)
    const router = addresses.pancakeswap.v2.router
    if (!router) { return amountOut }

    const routerContract = new ethers.Contract(
      router, PancakeswapV2RouterAbi, this.signer /* Verify !!!!!!!!!!!!!!!!! */
    )
  
    try {
      const amountsOut = await routerContract.getAmountsOut(this.amountIn, this.path)
      amountOut = amountsOut[1]
    } catch (err: any) {
      Logger.err({ error: err, report: true })
    } finally {
      return amountOut
    }
  }
  
  async quoteForUniswapV3(
  ): Promise<bigint> {
    let amountOut = BigInt(0)

    const quoteExactInputSingleParams = {
      tokenIn: this.tokenIn,
      tokenOut: this.tokenOut,
      amountIn: this.amountIn,
      fee: this.fee,
      sqrtPriceLimitX96: 0
    }

    const quoterV2Contract = new ethers.Contract(
      addresses.uniswap.v3.quoterv2, contracts.uniswapv3.quoterv2.abi, this.signer
    )
  
    try {
      let quoterV2Resp = await quoterV2Contract.quoteExactInputSingle.staticCall(
        quoteExactInputSingleParams
      )

      amountOut = quoterV2Resp[0]
    } catch (err: any) {
      Logger.err({ error: err, report: true })

      console.log(err)
    } finally {
      return amountOut
    }
  }

  async quoteForUniswapV4(
  ): Promise<bigint> {
    let amountOut = BigInt(0)

    const quoterContract = new ethers.Contract(
      addresses.uniswap.v4.quoter, contracts.uniswapv4.quoter.abi, this.signer
    )

    const zeroForOne = this.path[0] === this.pool.token0

    try {
      // For a single-hop swap (exact input)
      const quoteParams = {
        poolKey: {
          currency0: this.pool.token0,    // lower address first
          currency1: this.pool.token1,    // higher address
          fee: this.fee,
          tickSpacing: this.tickSpacing,
          hooks: this.hooks,
        },
        zeroForOne: zeroForOne,       // true if swapping currency0 -> currency1
        exactAmount: this.amountIn,        // int128, positive = exact input
        hookData: '0x',
      }

      const result = await quoterContract.quoteExactInputSingle.staticCall(quoteParams)
      amountOut = result[0]
    } catch (err: any) {
      Logger.err({ error: err, report: true })
    } finally {
      return amountOut
    }
  }
}

const waitForReceipt = async (
  provider: ethers.Provider | ethers.JsonRpcProvider | null,
  txHash: string
): Promise<ethers.TransactionReceipt | null> => {
  if (!provider) { return null }
  const start = Date.now()
  const threeMinutes = (60000 * 3)

  while (Date.now() - start < threeMinutes) {
    const receipt = await provider.getTransactionReceipt(txHash)
    if (receipt) { return receipt }

    await new Promise((resolve) => setTimeout(resolve, 2500))
  }

  const msg = `Timeout reached: no receipt for tx ${txHash}`

  console.warn(msg)

  await sendDiscordMessage(
    chainColor + ' ' + msg
  )

  return null
}
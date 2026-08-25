// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/checkLpRenounced.js").default()'

import { ethers } from 'ethers'

import addresses from '../config/addresses'
import { wallets } from '../config/provider'

import { contracts } from '../contracts/contracts'

interface Call3 {
  target: string,
  allowFailure: boolean,
  callData: string
}

interface Result {
  success: boolean,
  returnData: string
}

const multicall3Contract = new ethers.Contract(
  addresses.multicall3, contracts.multicall3.abi, wallets[0]
)

export default async (
): Promise<boolean> => {
  let _isRenounced = false

  const poolAddress = '0x0955CAdc0e04C83Bfc096d4bCF8Af2a51da6fC19'

  const poolContract = new ethers.Contract(
    poolAddress, contracts.uniswapv2.pool.abi, wallets[0]
  )

  try {
    let totalSupplyCalldata = poolContract.interface.encodeFunctionData('totalSupply')
    let uniswapV2LockerCalldata = poolContract.interface.encodeFunctionData(
      'balanceOf', [ addresses.uncx.uniswapV2Locker ]
    )
    
    let calls: Array<Call3> = [
      { target: poolAddress, allowFailure: true, callData: totalSupplyCalldata },
      { target: poolAddress, allowFailure: true, callData: uniswapV2LockerCalldata }
    ]

    for (let address of addresses.nullAddresses) {
      let calldata = poolContract.interface.encodeFunctionData(
        'balanceOf', [ address ]
      )

      calls.push({
        target: poolAddress, allowFailure: true, callData: calldata
      })
    }

    const results: Array<Result> = await multicall3Contract.aggregate3.staticCall(calls)

    let balance = 0n
    let totalSupply = 0n
    
    for (let i=0; i < results.length; i++) {
      if (i === 0) {
        if (!results[0].success) {
          console.log('Could\'t get totalSupply'); return false 
        }

        totalSupply = poolContract.interface.decodeFunctionResult(
          'totalSupply', results[i].returnData
        )[0]
      } else {
        if (results[i].success) {
          let _result = poolContract.interface.decodeFunctionResult(
            'balanceOf', results[i].returnData
          )[0]
  
          balance += _result
        }
      }
    }

    if (totalSupply > 0n && balance > 0n) {
      let resp = totalSupply / balance

      // Check if 50% of LP is renounced
      if (resp !== 0n && resp <= 2n) {
        _isRenounced = true
      }
    }
  } catch (err: any) {
    console.log(err)
  } finally {
    return _isRenounced
  }
}
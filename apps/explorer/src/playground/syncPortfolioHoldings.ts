// docker run -it --rm --link mongo-server --env-file .env -v /Users/lpdahito/projects/tokenuity/trends/trends-explorer/dist:/app/dist explorer node ./dist/playground/syncPortfolioHoldings.js

import { ethers } from 'ethers'

import { contracts } from '../contracts/contracts'

import { wallets } from '../config/provider'

import addresses from '../config/addresses'

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

const main = async (
): Promise<void> => {
  let calls: Array<Call3> = []

  try {
    let holdings = [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      '0x111111111117dC0aa78b770fA6A738034120C302', // 1INCH
      '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', // AAVE
      '0x4Fabb145d64652a948d72533023f6E7A623C7C53', // BUSD
      '0xD533a949740bb3306d119CC777fa900bA034cd52', // CRV
    ]

    for (let holding of holdings) {
      const tokenContract = new ethers.Contract(
        holding, contracts.erc20.abi, wallets[0]
      )

      const calldata = tokenContract.interface.encodeFunctionData(
        'balanceOf', [wallets[0].address]
      )

      calls.push({
        target: holding,
        allowFailure: true,
        callData: calldata
      })
    }
  
    const results: Array<Result> = await multicall3Contract.aggregate3.staticCall(calls)

    console.log(results)

    for (let i = 0; i < holdings.length; i++) {
      if (!results[i].success) continue

      let holding = holdings[i]

       const tokenContract = new ethers.Contract(
        holding, contracts.erc20.abi, wallets[0]
      )

      const amount = tokenContract.interface.decodeFunctionResult('balanceOf', results[i].returnData)[0]

      console.log(amount.toString())
    }
  } catch (err: any) {
    console.log(err)
  }
}

main()
// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/launchpads/isClanker.js").default()'

import { ethers } from 'ethers'

import { contracts } from './../../contracts/contracts.js'

import addresses from './../../config/addresses.js'
import { providers, wallets } from './../../config/provider.js'
import { Launchpads } from '../../types.js'

interface Call3 {
  target: string,
  allowFailure: boolean,
  callData: string
}

interface Result {
  success: boolean,
  returnData: string
}

interface TokenWithMeta {
  name: string
  symbol: string
  decimals: number
  launchpad: Launchpads | null
}

const multicall3Contract = new ethers.Contract(
  addresses.multicall3, contracts.multicall3.abi, wallets[0]
)

export default async (
): Promise<TokenWithMeta> => {
  // const tokenAddress = '0x14f44312e63b6667750b633F241BC99BecBe0B07' // good
  // const tokenAddress = '0x4200000000000000000000000000000000000006' // bad

  const tokenAddress = '0x537368d6ade9742c43c74078EFd766fFc1F59381'

  let tokenWithMeta: TokenWithMeta = {
    name: '', symbol: '', decimals: 18, launchpad: null
  }

  let launchpad: number | null = null

  const erc20iface = new ethers.Interface(contracts.erc20.abi)
  const clankeriface = new ethers.Interface(contracts.clanker.abi)

  const multicall3Contract = new ethers.Contract(
    addresses.multicall3, contracts.multicall3.abi, wallets[0]
  )

  let calls: Array<Call3> = []

  const clankerAddress = addresses.clanker
  if (!clankerAddress) { return tokenWithMeta }

  try {
    const calldataForName = erc20iface.encodeFunctionData('name')
    const calldataForSymbol = erc20iface.encodeFunctionData('symbol')
    const calldataForDecimals = erc20iface.encodeFunctionData('decimals')

    calls.push({ target: tokenAddress, allowFailure: true, callData: calldataForName })
    calls.push({ target: tokenAddress, allowFailure: true, callData: calldataForSymbol })
    calls.push({ target: tokenAddress, allowFailure: true, callData: calldataForDecimals })

    const calldataForClanker = clankeriface.encodeFunctionData('deploymentInfoForToken', [ tokenAddress ])

    calls.push({ target: clankerAddress, allowFailure: true, callData: calldataForClanker })

    const results: Array<Result> = await multicall3Contract.aggregate3.staticCall(calls)

    const name = erc20iface.decodeFunctionResult('name', results[0].returnData)[0] as string
    if (!name) { return tokenWithMeta }

    const symbol = erc20iface.decodeFunctionResult('symbol', results[1].returnData)[0] as string
    if (!symbol) { return tokenWithMeta }

    const decimals = erc20iface.decodeFunctionResult('decimals', results[2].returnData)[0] as bigint
    if (!decimals) { return tokenWithMeta }

    if (results[3].success) {
      const clanker = clankeriface.decodeFunctionResult('deploymentInfoForToken', results[3].returnData)[0] as string

      if (clanker && clanker !== '0x0000000000000000000000000000000000000000') {
        launchpad = Launchpads.clanker
      }
    }

    tokenWithMeta = {
      name, symbol, launchpad, decimals: Number(decimals)
    }

    console.log(tokenWithMeta)
  } catch(err: any) {
    console.log(err)
  } finally {
    return tokenWithMeta
  }
}
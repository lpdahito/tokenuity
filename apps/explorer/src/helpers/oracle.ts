import { ethers, JsonRpcProvider } from 'ethers'

import { chain } from './../config/chain'
import { Logger } from './../config/logger.js'

import { contracts } from './../contracts/contracts.js'

// export const getEthPrice = async (
//   stablecoin: string
// ): Promise<bigint> => {
//   // console.log('inside getEthPrice')
//   let contract = new ethers.Contract(
//     usdcFeed, contracts.chainlink.aggregatorV3.abi, provider
//   )

//   // console.log('after contract')

//   switch (stablecoin) {
//     case 'DAI':
//       contract = new ethers.Contract(
//         daiFeed, contracts.chainlink.aggregatorV3.abi, provider
//       )

//       break;
//   }

//   try {
//     // console.log('before latestRoundData')
//     let agggregatorData = await contract.latestRoundData()
//     // console.log('after latestRoundData')
//     return BigInt(agggregatorData.answer)
//   } catch (err: any) {
//     console.log(err)
//     return BigInt(0)
//   }  
// }

export const getBaseTokenPrice = async (
  chainId?: number
): Promise<bigint> => {
  let price = 0n

  if (!chainId) { chainId = chain.id }

  try {
    if (chainId === 56) {
      price = await getBnbPrice()
    } else {
      price = await getEthPrice()
    }
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return price
  }
}

export const getBnbPrice = async (
): Promise<bigint> => {
  let price = 0n

  const wbnbUsdcV2Pool = '0xd99c7f6c65857ac913a8f880a4cb84032ab2fc5b'

  const network = new ethers.Network('bnb', 56)

  // const provider = new JsonRpcProvider(
  //   'https://rpc.ankr.com/bsc/' + process.env.ANKR_API_KEY!, network, // { staticNetwork: true }
  // )

  const provider = new JsonRpcProvider(
    'https://bsc-mainnet.core.chainstack.com/' + process.env.CHAINSTACK_API_KEY!, network, // { staticNetwork: true }
  )

  let poolContract = new ethers.Contract(
    wbnbUsdcV2Pool, contracts.pancakeswapv2.pool.abi, provider
  )

  try {
    let reserves = await poolContract.getReserves()
    price = (BigInt(reserves[1]) * (10n ** 18n)) / BigInt(reserves[0])
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return price
  }
}

export const getEthPrice = async (
): Promise<bigint> => {
  let priceX = 0n

  const usdcEthV3Pool = '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640'

  const infuraProvider = new JsonRpcProvider(
    'https://mainnet.infura.io/v3/' + process.env.INFURA_PROJECT_ID
  )

  let poolContract = new ethers.Contract(
    usdcEthV3Pool, contracts.uniswapv3.pool.abi, infuraProvider
  )

  const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

  try {
    let slot0 = await poolContract.slot0()
    let sqrtPriceX96: bigint = slot0.sqrtPriceX96

    if (_zeroForOne(USDC)) {
      priceX = (sqrtPriceX96 ** 2n) / ((2n ** 192n) / (10n ** 6n))
    } else {
      priceX = ((2n ** 192n) * (10n ** 18n)) / (sqrtPriceX96 ** 2n) // Don't think this is right...
    }
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return priceX
  }
}

export const getVirtualPrice = async (
): Promise<bigint> => {
  let price = 0n

  const virtualEthV2Pool = '0x1688D62C82abEbf4D33EcEa96D983fc1627966f6'
  // const VIRTUAL = '0x44ff8620b8cA30902395A7bD3F2407e1A091BF73'

  const provider = new JsonRpcProvider(
    'https://mainnet.infura.io/v3/' + process.env.INFURA_PROJECT_ID
  )

  let poolContract = new ethers.Contract(
    virtualEthV2Pool, contracts.uniswapv2.pool.abi, provider
  )

  try {
    // token 0 = VIRTUAL
    // token 1 = WETH

    let reserves = await poolContract.getReserves()
    price = (BigInt(reserves[1]) * (10n ** 18n)) / BigInt(reserves[0])
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return price
  }
}

const _zeroForOne = (
  token: string
): boolean => {
  const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

  return token < WETH
}
// docker run -it --rm --env-file .env -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/executeDispersedSwap.js").default()'

import { ethers, JsonRpcProvider } from "ethers"
import BigNumber from 'bignumber.js'

import addresses from '../config/addresses.js'

import { contracts } from '../contracts/contracts.js'
import erc20 from './../contracts/abis/openzeppelin/ERC20.json'

import { Swap } from './../helpers/swaps.js'
import { getBaseTokenPrice } from './../helpers/oracle.js'
import { canBuyAndSellToken } from './../helpers/tokens.js'

import { DexProtocols, IToken, Routers } from '../types'

const maxUint160 = BigInt(2 ** 160) - BigInt(1)

const token = '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' // DAI

const network = new ethers.Network('base', 8453);
const key = new ethers.SigningKey('0x' + process.env.WALLET_PRIVATE_KEY!)

const provider = new JsonRpcProvider(
  'https://base-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY!, network
)

const wallet = new ethers.Wallet(key, provider)

export default async () => {
  let baseTokenPrice = 0n

  const tokenuityContract = new ethers.Contract(
    addresses.tokenuity, contracts.tokenuity.abi, wallet
  )

  const tokenContract = new ethers.Contract(
    token, erc20.abi, wallet
  )

  try {
    baseTokenPrice = await getBaseTokenPrice()
    if (baseTokenPrice === 0n) return console.log('Could not get baseToken price...')

    const amountIn = BigInt(BigNumber(baseTokenPrice.toString()).times(5).toFixed(0))

    // const vaults = await tokenuityContract.vaults()
    // console.log(vaults)

    // const _canBuyAndSellToken = await canBuyAndSellToken(
    //   token, amountIn, 2
    // )

    // console.log(_canBuyAndSellToken)

    // console.log(await tokenuityContract.balanceFor(token))

    // console.log()
    // console.log(await providers[0].getTransactionCount('0xb15645B4702d8d63B532C5D6a340448a2CE3b645'))

    // const amountIn0 = BigInt(BigNumber(baseTokenPrice.toString()).times(1.00).toFixed(0))

    // const swapParams0 = {
    //   token: token,
    //   amountIn: amountIn0,
    //   buy: true,
    //   protocol: DexProtocols.uniswapv2,
    //   fee: 3000,
    //   signer: wallet,
    //   router: Routers.default
    // }

    // const swap0 = new Swap(swapParams0)
    // const amountOut0 = await swap0.quote()
    // const calldata0 = await swap0.encode()

    // if (!amountOut0 || amountOut0 === BigInt(0)) {
    //   return console.log('amountOut is 0')
    // }

    // if (!calldata0 || calldata0 === '') {
    //   return console.log('calldata is null')
    // }

    // const tx0 = await swap0.execute()
    // console.log(tx0)

    const amountIn1 = await tokenuityContract.dispersedBalanceFor(token)

    // const swapParams1 = {
    //   token: token,
    //   amountIn: amountIn1,
    //   buy: false,
    //   protocol: DexProtocols.uniswapv2,
    //   fee: 3000,
    //   signer: wallet,
    //   router: Routers.default
    // }

    // const swap1 = new Swap(swapParams1)
    // const amountOut1 = await swap1.quote()
    // const calldata1 = await swap1.encode()

    // if (!amountOut1 || amountOut1 === BigInt(0)) {
    //   return console.log('amountOut is 0')
    // }

    // if (!calldata1 || calldata1 === '') {
    //   return console.log('calldata is null')
    // }

    // const tx1 = await swap1.execute()
    // console.log(tx1)
  } catch (err: any) {
    console.log(err)
  }
}
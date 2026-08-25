// docker run -it --rm --env-file .env -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/getDispersedBalance.js").default()'

import { ethers, JsonRpcProvider } from "ethers"
import BigNumber from 'bignumber.js'

import addresses from '../config/addresses.js'
import { providers, wallets } from '../config/provider.js'

import { contracts } from '../contracts/contracts.js'

const token = '0x612870024D7e324ffdc8D2C61911ee4B84974444'

export default async () => {
  const tokenuityContract = new ethers.Contract(
    addresses.tokenuity, contracts.tokenuity.abi, wallets[0]
  )

  try {
    const balance = await tokenuityContract.dispersedBalanceFor(token)

    console.log(balance)
  } catch (err: any) {
    console.log(err)
  }
}
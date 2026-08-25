// docker run -it --rm --env-file .env -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/tokenuity/balanceFor.js").default()'

import { ethers } from 'ethers'

import addresses from './../../config/addresses.js'
import { wallets } from './../../config/provider.js'

import { contracts } from './../../contracts/contracts.js'

let a = '0x30E4Db105176e89342Ecf7280A3F9F015C6024AA' // clean
a = '0x372d7B941A7856D83045710FfCfFb89DA5f1a0d1'

export default async () => {
  const tokenuityContract = new ethers.Contract(
    addresses.tokenuity, contracts.tokenuity.abi, wallets[0]
  )

  try  {
    const balance = await tokenuityContract.balanceFor(a)

    console.log('balance:', balance)
  } catch (err: any)  {
    if ('message' in err) {
      console.log(err.message)
    }
  }
}
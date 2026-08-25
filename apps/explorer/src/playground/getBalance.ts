// docker run -it --rm --env-file .env -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/getBalance.js").default()'

import { ethers } from 'ethers'

import addresses from '../config/addresses.js'
import { providers, wallets } from '../config/provider.js'

export default async () => {
  try  {
    const balance = await providers[0].getBalance(
      '0xb15645B4702d8d63B532C5D6a340448a2CE3b645'
    )

    console.log(balance)
    console.log(balance / 30n)
  } catch (err: any)  {
    if ('message' in err) {
      console.log(err.message)
    }
  }
}
// docker run -it --rm --env-file .env -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/createWallets.js").default()'

import crypto from 'crypto'
import { ethers } from 'ethers'

import { providers } from './../config/provider.js'

export default async () => {
  const wallets = []
  
  try  {
    while (wallets.length < 10) {
      let id = crypto.randomBytes(32).toString('hex')
      let privateKey = "0x" + id
  
      const wallet = new ethers.Wallet(privateKey, providers[0])
  
      wallets.push(wallet)
    }

    for (const wallet of wallets) {
      console.log(wallet.privateKey)
    }

    console.log('--')

    for (const wallet of wallets) {
      console.log(wallet.address)
    }
  } catch (err: any)  {
    if ('message' in err) {
      console.log(err.message)
    }
  }
}
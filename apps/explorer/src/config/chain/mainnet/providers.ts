// import * as dotenv from 'dotenv'
// dotenv.config()

import { ethers, JsonRpcProvider } from "ethers"

import { chain } from './../../chain.js'

const key = new ethers.SigningKey('0x' + process.env.WALLET_PRIVATE_KEY!)

const providers: (ethers.InfuraProvider | ethers.AlchemyProvider | ethers.JsonRpcProvider)[] = []
const wallets: ethers.Wallet[] = []

if (chain.name === 'mainnet') {
  const infuraProvider = new JsonRpcProvider(
    'https://mainnet.infura.io/v3/' + process.env.INFURA_PROJECT_ID
  )
  
  const infuraWallet = new ethers.Wallet(key, infuraProvider)
  
  providers.push(infuraProvider)
  wallets.push(infuraWallet)
}

export default { providers, wallets }
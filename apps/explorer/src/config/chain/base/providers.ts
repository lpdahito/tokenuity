// import * as dotenv from 'dotenv'
// dotenv.config()

import { ethers, JsonRpcProvider } from "ethers"

import { chain } from './../../chain.js'

// import fromServerless from '../../fromServerless.js'

const network = new ethers.Network('base', 8453);

const key = new ethers.SigningKey('0x' + process.env.WALLET_PRIVATE_KEY!)

const providers: (ethers.InfuraProvider | ethers.AlchemyProvider | ethers.JsonRpcProvider)[] = []
const wallets: ethers.Wallet[] = []

const INSTANCE_FUNCTION_TYPE = process.env.INSTANCE_FUNCTION_TYPE

if (chain.name === 'base') {
  if (
    INSTANCE_FUNCTION_TYPE === 'findTrades'
  ) {
    // const blastProvider = new JsonRpcProvider(
    //   'https://base-mainnet.blastapi.io/' + process.env.BLAST_API_KEY!, network, // { staticNetwork: true }
    // )
  
    // const blastWallet = new ethers.Wallet(key, blastProvider)
  
    // providers.push(blastProvider)
    // wallets.push(blastWallet)
  
    const alchemyProvider = new JsonRpcProvider(
      'https://base-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY!, network, { staticNetwork: true }
    )
  
    const alchemyWallet = new ethers.Wallet(key, alchemyProvider)
  
    providers.push(alchemyProvider)
    wallets.push(alchemyWallet)
  }
  
  const tenderly_url_base = process.env.TENDERLY_URL_BASE!
  
  const tenderlyProvider = new JsonRpcProvider(tenderly_url_base, network)
  const tenderlyWallet = new ethers.Wallet(key, tenderlyProvider)
  
  providers.push(tenderlyProvider)
  wallets.push(tenderlyWallet)
  
  // const alchemyProvider = new JsonRpcProvider(
  //   'https://base-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY!, network, // { staticNetwork: true }
  // )
  
  // const alchemyWallet = new ethers.Wallet(key, alchemyProvider)
  
  // providers.push(alchemyProvider)
  // wallets.push(alchemyWallet)
}

export default { providers, wallets }
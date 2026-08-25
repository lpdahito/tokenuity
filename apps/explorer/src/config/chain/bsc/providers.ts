// import * as dotenv from 'dotenv'
// dotenv.config()

import { ethers, JsonRpcProvider } from "ethers"

import { chain } from './../../chain.js'

const network = new ethers.Network('bnb', 56);

const key = new ethers.SigningKey('0x' + process.env.WALLET_PRIVATE_KEY!)

const providers: (ethers.InfuraProvider | ethers.AlchemyProvider | ethers.JsonRpcProvider)[] = []
const wallets: ethers.Wallet[] = []

const INSTANCE_FUNCTION_TYPE = process.env.INSTANCE_FUNCTION_TYPE

if (chain.name === 'bsc') {
  if (
    INSTANCE_FUNCTION_TYPE === 'findTrades'
) {
  // const alchemyProvider = new JsonRpcProvider(
  //   'https://bnb-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY!, network, // { staticNetwork: true }
  // )
  
  // const alchemyWallet = new ethers.Wallet(key, alchemyProvider)
  
  // providers.push(alchemyProvider)
  // wallets.push(alchemyWallet)

  const moralisProvider = new JsonRpcProvider(
    'https://site1.moralis-nodes.com/bsc/' + process.env.MORALIS_API_KEY, network, // { staticNetwork: true }
  )
  
  const moralisWallet = new ethers.Wallet(key, moralisProvider)
  
  providers.push(moralisProvider)
  wallets.push(moralisWallet)
}

// const ankrProvider = new JsonRpcProvider(
//   'https://rpc.ankr.com/bsc/' + process.env.ANKR_API_KEY!, network, // { staticNetwork: true }
// )

// const ankrWallet = new ethers.Wallet(key, ankrProvider)

// providers.push(ankrProvider)
// wallets.push(ankrWallet)

  // const alchemyProvider = new JsonRpcProvider(
  //   'https://bnb-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY!, network, // { staticNetwork: true }
  // )
    
  // const alchemyWallet = new ethers.Wallet(key, alchemyProvider)
    
  // providers.push(alchemyProvider)
  // wallets.push(alchemyWallet)

  const chainstackProvider = new JsonRpcProvider(
    'https://bsc-mainnet.core.chainstack.com/' + process.env.CHAINSTACK_API_KEY!, network, // { staticNetwork: true }
  )

  const chainstackWallet = new ethers.Wallet(
    key, chainstackProvider
  )

  providers.push(chainstackProvider)
  wallets.push(chainstackWallet)
}

export default { providers, wallets }




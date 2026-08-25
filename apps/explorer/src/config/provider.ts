// import * as dotenv from 'dotenv'
// dotenv.config()

import { ethers } from "ethers"

import { chain } from './chain.js'

import mainnet from './chain/mainnet/providers.js'
import base from './chain/base/providers.js'
import bsc from './chain/bsc/providers.js'
import sepolia from './chain/sepolia/providers.js'

type Providers = (ethers.InfuraProvider | ethers.AlchemyProvider | ethers.JsonRpcProvider)[]
type Wallets = ethers.Wallet[]

let _providers = {
  '1': <Providers>mainnet.providers,
  '56': <Providers>bsc.providers,
  '8453': <Providers>base.providers,
  '11155111': <Providers>sepolia.providers,
}

let _wallets = {
  '1': <Wallets>mainnet.wallets,
  '56': <Wallets>bsc.wallets,
  '8453': <Wallets>base.wallets,
  '11155111': <Wallets>sepolia.wallets,
}

let providers = _providers[chain.id.toString() as keyof typeof _providers]
let wallets = _wallets[chain.id.toString() as keyof typeof _wallets]

export { providers, wallets }
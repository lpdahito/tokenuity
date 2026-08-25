import { chain } from './chain.js'
import eth from './chain/mainnet/addresses.js'
import base from './chain/base/addresses.js'
import bsc from './chain/bsc/addresses.js'
import sepolia from './chain/sepolia/addresses.js'

export interface Addresses {
  zero: string,
  tokens: {
    base: string,
    popular: Array<string>,
    stable: Array<string>,
    removed: Array<string>,
  },
  whales: Array<string>,
  tokenuity: string,
  pancakeswap: {
    v2: {
      factory: string,
      router: string,
    },
    v3: {
      factory: string,
      quoterv2: string,
      swapRouter: string,
      universalRouter: string,
      permit2: string,
    },
  },
  uniswap: {
    v4: {
      poolManager: string,
      quoter: string
    },
    v3: {
      factory: string,
      quoterv2: string,
      swapRouter02: string,
      universalRouter: string,
      permit2: string,
    },
    v2: {
      factory: string,
      swapRouter02: string,
    }
  },
  sushiswap: {
    v2: {
      factory: string,
      swapRouter02: string,
    }
  },
  virtuals?: {
    factory: string
  },
  zora?: string,
  clanker?: string,
  launchpads: string[],
  uncx: {
    uniswapV2Locker: string
  },
  onlymoons: {
    tokenLockerManagerV1: string
  },
  multicall3: string,
  nullAddresses: Array<string>
}

let addresses = {
  '1': <Addresses>eth,
  '56': <Addresses>bsc,
  '8453': <Addresses>base,
  // '11155111': <Addresses>sepolia,
}

for (let key in addresses) {
  addresses[key.toString() as keyof typeof addresses].nullAddresses = [
    '0x0000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000001',
    '0x0000000000000000000000000000000000000002',
    '0x0000000000000000000000000000000000000003',
    '0x0000000000000000000000000000000000000004',
    '0x0000000000000000000000000000000000000005',
    '0x0000000000000000000000000000000000000006',
    '0x0000000000000000000000000000000000000007',
    '0x0000000000000000000000000000000000000008',
    '0x0000000000000000000000000000000000000009',
    '0x0000000000000000000000000000000000000010',
    '0x000000000000000000000000000000000000dEaD'
  ]
}

export { addresses }
export default addresses[chain.id.toString() as keyof typeof addresses]